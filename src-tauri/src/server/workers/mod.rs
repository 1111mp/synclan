use crate::{logging, module::message::Message, server::events::store::Clients, singleton, utils::logging::Type};
use apalis::{
    layers::{
        WorkerBuilderExt as _,
        retry::{
            HasherRng, RetryPolicy,
            backoff::{ExponentialBackoffMaker, MakeBackoff as _},
        },
    },
    prelude::{AbortError, BackendExt as _, BackoffConfig, BoxDynError, Event, Monitor, WorkerBuilder},
};
use apalis_sqlite::SqliteStorage;
use futures::FutureExt as _;
use parking_lot::Mutex;
use socketioxide::SocketIo;
use std::{sync::Arc, time::Duration};
use tokio_util::sync::CancellationToken;

mod message;

pub type MessageBackend = SqliteStorage<Message>;

pub struct WorkerMonitor {
    shutdown_token: Arc<Mutex<Option<CancellationToken>>>,
}

singleton!(WorkerMonitor, WORKERMONITOR);

impl WorkerMonitor {
    pub fn new() -> Self {
        Self {
            shutdown_token: Arc::new(Mutex::new(None)),
        }
    }

    pub async fn run(&self, message_backend: MessageBackend, io: SocketIo, clients: Clients) -> anyhow::Result<()> {
        let token = CancellationToken::new();
        *self.shutdown_token.lock() = Some(token.clone());

        let backoff = ExponentialBackoffMaker::new(
            Duration::from_millis(1000),
            Duration::from_millis(5000),
            1.25,
            HasherRng::default(),
        )?
        .make_backoff();

        Monitor::new()
            .register(move |_run_id| {
                WorkerBuilder::new("synclan-message-dispatcher")
                    .backend(
                        message_backend.clone().poll_with_backoff(
                            Duration::from_millis(100),
                            BackoffConfig::new(Duration::from_secs(2))
                                .with_multiplier(1.5)
                                .with_jitter(0.1),
                        ),
                    )
                    .enable_tracing()
                    .catch_panic()
                    // maybe we don't need rate limit
                    // .rate_limit(10, Duration::from_millis(1000))
                    .concurrency(20)
                    .retry(
                        RetryPolicy::retries(3)
                            .with_backoff(backoff.clone())
                            .retry_if(|e: &BoxDynError| e.downcast_ref::<AbortError>().is_none()),
                    )
                    .data(io.clone())
                    .data(clients.clone())
                    .build(message::MessageWorker::send_message)
            })
            .on_event(|ctx, evt| {
                let name = ctx.name();
                match evt {
                    Event::Start => logging!(info, Type::Server, "Worker \"{name}\" started"),
                    Event::Error(err) => {
                        logging!(error, Type::Server, "Worker \"{name}\" error: {err}")
                    },
                    Event::Stop => logging!(info, Type::Server, "Worker \"{name}\" stopped"),
                    _ => {},
                }
            })
            // Define when a worker should restart
            .should_restart(|ctx, err| {
                if ctx.name() == "synclan-message-dispatcher"
                    && err.to_string().contains("Recoverable Error")
                    && ctx.restarts() < 5
                {
                    return true;
                }
                false
            })
            .shutdown_timeout(Duration::from_secs(5))
            .run_with_signal(token.cancelled().map(|_| Ok::<(), std::io::Error>(())))
            .await?;

        Ok(())
    }

    pub fn shutdown(&self) {
        if let Some(token) = self.shutdown_token.lock().take() {
            token.cancel();
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use apalis::prelude::{TaskSink as _, WorkerContext};
    use sqlx::sqlite::SqlitePoolOptions;

    #[tokio::test]
    async fn message_queue_round_trip() -> anyhow::Result<()> {
        let pool = SqlitePoolOptions::new().max_connections(1).connect(":memory:").await?;
        SqliteStorage::setup(&pool).await?;
        let config = apalis_sqlite::Config::default().batch_size(50);
        let mut backend = MessageBackend::new(&pool).with_config(config);
        let message: Message = serde_json::from_value(serde_json::json!({
            "id": 1,
            "uuid": "queue-round-trip",
            "sender": "sender",
            "receiver": "receiver",
            "type": "text",
            "content": "hello",
            "createdAt": 1700000000123_i64,
            "updatedAt": null
        }))?;
        let expected = serde_json::to_value(&message)?;
        backend.push(message).await?;

        let (tx, mut rx) = tokio::sync::mpsc::channel(1);
        let worker = WorkerBuilder::new("message-queue-test")
            .backend(backend.poll_with_interval(Duration::from_millis(10)))
            .build(move |message: Message, ctx: WorkerContext| {
                let tx = tx.clone();
                async move {
                    tx.send(serde_json::to_value(message)?).await?;
                    ctx.stop()?;
                    Ok::<(), BoxDynError>(())
                }
            });
        tokio::time::timeout(Duration::from_secs(5), worker.run()).await??;
        assert_eq!(rx.recv().await.unwrap(), expected);
        let (status,): (String,) = sqlx::query_as("SELECT status FROM Jobs WHERE job_type = 'default'")
            .fetch_one(&pool)
            .await?;
        assert_eq!(status, "Done");
        Ok(())
    }
}
