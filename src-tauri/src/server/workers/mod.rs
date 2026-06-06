use crate::{
    logging, module::message::Message, server::events::store::Clients, singleton,
    utils::logging::Type,
};
use apalis::{
    layers::{
        WorkerBuilderExt as _,
        retry::{
            HasherRng, RetryPolicy,
            backoff::{ExponentialBackoffMaker, MakeBackoff as _},
        },
    },
    prelude::{AbortError, BoxDynError, Event, Monitor, WorkerBuilder},
};
use apalis_codec::json::JsonCodec;
use apalis_sqlite::{CompactType, SqliteStorage, fetcher::SqliteFetcher};
use futures::FutureExt as _;
use parking_lot::Mutex;
use socketioxide::SocketIo;
use std::{sync::Arc, time::Duration};
use tokio_util::sync::CancellationToken;

mod message;

pub type MessageBackend = SqliteStorage<Message, JsonCodec<CompactType>, SqliteFetcher>;

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

    pub async fn run(
        &self,
        message_backend: MessageBackend,
        io: SocketIo,
        clients: Clients,
    ) -> anyhow::Result<()> {
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
                    .backend(message_backend.clone())
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
                    }
                    Event::Stop => logging!(info, Type::Server, "Worker \"{name}\" stopped"),
                    _ => {}
                }
            })
            // Define when a worker should restart
            .should_restart(|ctx, err, runs| {
                if ctx.name() == "synclan-message-dispatcher"
                    && err.to_string().contains("Recoverable Error")
                    && runs < 5
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
