use super::*;
use apalis::prelude::{TaskSink as _, WorkerContext};
use socketioxide::handler::ConnectHandler;
use sqlx::sqlite::SqlitePoolOptions;
use tokio::io::{AsyncBufReadExt, BufReader};

fn message(uuid: &str, receiver: &str) -> Message {
    serde_json::from_value(serde_json::json!({
        "uuid": uuid, "sender": "desktop", "receiver": receiver,
        "type": "text", "content": uuid, "createdAt": null, "updatedAt": null
    }))
    .unwrap()
}

#[tokio::test]
async fn fixed_worker_identity_reproduces_collision() -> anyhow::Result<()> {
    let pool = SqlitePoolOptions::new().max_connections(1).connect(":memory:").await?;
    SqliteStorage::setup(&pool).await?;
    let mut backend = MessageBackend::new(&pool);
    for attempt in 0..2 {
        backend.push(message("collision", "web")).await?;
        let worker = WorkerBuilder::new(MESSAGE_WORKER_PREFIX)
            .backend(backend.clone().poll_with_interval(Duration::from_millis(10)))
            .build(|_: Message, ctx: WorkerContext| async move { ctx.stop() });
        let result = tokio::time::timeout(Duration::from_secs(5), worker.run()).await?;
        if attempt == 0 {
            result?;
        } else {
            assert!(result.unwrap_err().to_string().contains("WORKER_ALREADY_EXISTS"));
        }
    }
    Ok(())
}

#[tokio::test]
async fn real_socket_delivery_survives_dispatcher_restarts() -> anyhow::Result<()> {
    use crate::{
        server::{AppState, events::handlers},
        utils::db::DBManager,
    };
    let pool = SqlitePoolOptions::new().max_connections(1).connect(":memory:").await?;
    sqlx::raw_sql(include_str!("../../../resources/migrations/20250604035105_init.sql"))
        .execute(&pool)
        .await?;
    SqliteStorage::setup(&pool).await?;
    DBManager::global()
        .db_pool
        .set(pool.clone())
        .map_err(|_| anyhow::anyhow!("test database already initialized"))?;
    for id in ["desktop", "web", "offline"] {
        sqlx::query("INSERT INTO devices (id, name) VALUES (?, ?)")
            .bind(id)
            .bind(id)
            .execute(&pool)
            .await?;
    }
    let mut backend = MessageBackend::new(&pool).with_config(apalis_sqlite::Config::default().batch_size(50));
    let clients = Clients::new();
    let state = Arc::new(AppState {
        db_pool: pool.clone(),
        message_storage: backend.clone(),
    });
    let (layer, io) = SocketIo::builder()
        .with_state(state)
        .with_state(clients.clone())
        .build_layer();
    io.ns(
        "/socket",
        handlers::on_connection.with(handlers::authenticate_middleware),
    );
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await?;
    let addr = listener.local_addr()?;
    let http = tokio::spawn(async move {
        axum::serve(listener, axum::Router::new().layer(layer)).await.unwrap();
    });
    let monitor = Arc::new(WorkerMonitor::new());
    for phase in 0..2 {
        // Queue before starting the dispatcher, then connect the receivers.
        backend
            .push(message(&format!("backlog-{phase}"), "web").create().await?)
            .await?;
        let mut child = tokio::process::Command::new("node")
            .arg(concat!(
                env!("CARGO_MANIFEST_DIR"),
                "/../test/integration/message-delivery.mjs"
            ))
            .arg(format!("http://{addr}"))
            .arg(phase.to_string())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .kill_on_drop(true)
            .spawn()?;
        let mut stdout = BufReader::new(child.stdout.take().unwrap()).lines();
        assert_eq!(
            tokio::time::timeout(Duration::from_secs(10), stdout.next_line())
                .await??
                .as_deref(),
            Some("READY")
        );
        let (monitor_clone, backend_clone, io_clone, clients_clone) =
            (monitor.clone(), backend.clone(), io.clone(), clients.clone());
        let worker = tokio::spawn(async move { monitor_clone.run(backend_clone, io_clone, clients_clone).await });
        let output = tokio::time::timeout(Duration::from_secs(30), child.wait_with_output()).await??;
        assert!(output.status.success(), "{}", String::from_utf8_lossy(&output.stderr));
        assert!(stdout.next_line().await?.unwrap().starts_with("PASS:"));
        // Allow ACK writes to finish before stopping the real production monitor.
        tokio::time::timeout(Duration::from_secs(5), async {
            loop {
                let pending: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM Jobs WHERE status != 'Done'")
                    .fetch_one(&pool)
                    .await
                    .unwrap();
                if pending == 0 {
                    break;
                }
                tokio::time::sleep(Duration::from_millis(20)).await;
            }
        })
        .await?;
        monitor.shutdown();
        tokio::time::timeout(Duration::from_secs(7), worker).await???;
        let offline = Message::get_offline_messages("offline").await?;
        assert_eq!(offline.len(), phase + 1);
        assert!(
            crate::module::message::MessageAck::get_last_ack("offline")
                .await?
                .is_none()
        );
        let history = Message::get_messages("desktop", "web", None, 200).await?;
        assert_eq!(history.messages.len(), (phase + 1) * 63);
    }
    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM messages")
        .fetch_one(&pool)
        .await?;
    assert_eq!(total, 128);
    let workers: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM Workers")
        .fetch_one(&pool)
        .await?;
    assert_eq!(workers, 2);
    http.abort();
    Ok(())
}

#[tokio::test]
async fn new_identity_recovers_jobs_locked_by_crashed_worker() -> anyhow::Result<()> {
    let pool = SqlitePoolOptions::new().max_connections(1).connect(":memory:").await?;
    SqliteStorage::setup(&pool).await?;
    let config = apalis_sqlite::Config::default().heartbeat_interval(Duration::from_secs(1));
    let mut backend = MessageBackend::new(&pool).with_config(config);
    backend.push(message("orphan", "web")).await?;
    // Model a process crash: leave a running job owned by an expired worker.
    sqlx::query("INSERT INTO Workers (id, worker_type, storage_name, last_seen) VALUES ('crashed', 'default', 'SqliteStorage', unixepoch() - 120)")
        .execute(&pool).await?;
    sqlx::query("UPDATE Jobs SET status = 'Running', lock_by = 'crashed', lock_at = unixepoch() - 120")
        .execute(&pool)
        .await?;
    let (tx, mut rx) = tokio::sync::mpsc::channel(1);
    let worker = WorkerBuilder::new(message_worker_name())
        .backend(backend.poll_with_interval(Duration::from_millis(10)))
        .build(move |message: Message, ctx: WorkerContext| {
            let tx = tx.clone();
            async move {
                tx.send(message.uuid).await?;
                ctx.stop()?;
                Ok::<(), BoxDynError>(())
            }
        });
    tokio::time::timeout(Duration::from_secs(5), worker.run()).await??;
    assert_eq!(rx.recv().await.as_deref(), Some("orphan"));
    let status: String = sqlx::query_scalar("SELECT status FROM Jobs").fetch_one(&pool).await?;
    assert_eq!(status, "Done");
    Ok(())
}
