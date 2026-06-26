use crate::utils::db;
use anyhow::{Result, bail};
use serde::{Deserialize, Serialize};
use sqlx::{QueryBuilder, Sqlite};
use utoipa::ToSchema;

#[derive(Debug, Default, Deserialize, Serialize, ToSchema, PartialEq, sqlx::Type)]
#[sqlx(type_name = "TEXT", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum DeviceRole {
    Host,
    #[default]
    Client,
}

#[derive(Debug, Default, Deserialize, Serialize, sqlx::FromRow, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct Device {
    pub id: String,
    pub name: String,
    pub avatar: Option<String>,
    pub fingerprint_id: Option<String>,
    pub role: DeviceRole,
    pub platform: Option<String>,
    pub browser: Option<String>,
    pub created_at: Option<i64>,
    pub updated_at: Option<i64>,
}

impl Device {
    /// Get device by id
    pub async fn get_by_id(id: &str) -> Result<Option<Device>> {
        let db_pool = db::get_db_pool()?;
        let device = sqlx::query_as::<_, Device>(
            "SELECT id, name, avatar, fingerprint_id, role, platform, browser, created_at, updated_at FROM devices WHERE id = $1",
        )
        .bind(id)
        .fetch_optional(&db_pool)
        .await?;

        Ok(device)
    }

    pub async fn get_host_device(id: &str) -> Result<Option<Device>> {
        let db_pool = db::get_db_pool()?;
        let device = sqlx::query_as::<_, Device>(
          "SELECT id, name, avatar, fingerprint_id, role, platform, browser, created_at, updated_at FROM devices WHERE id = $1",
        )
        .bind(id)
        .fetch_optional(&db_pool)
        .await?;

        if let Some(device) = device {
            Ok(Some(device))
        } else {
            let host_device = sqlx::query_as::<_, Device>(
                r#"
                    SELECT
                        id,
                        name,
                        avatar,
                        fingerprint_id,
                        role,
                        platform,
                        browser,
                        created_at,
                        updated_at
                    FROM devices WHERE role = 'host' LIMIT 1
                    "#,
            )
            .fetch_optional(&db_pool)
            .await?;

            Ok(host_device)
        }
    }

    pub async fn get_all(self_id: Option<&str>) -> Result<Vec<Device>> {
        let db_pool = db::get_db_pool()?;
        let devices = match self_id {
            Some(id) => {
                sqlx::query_as::<_, Device>(
                    r#"
                SELECT
                    id,
                    name,
                    avatar,
                    fingerprint_id,
                    role,
                    platform,
                    browser,
                    created_at,
                    updated_at
                FROM devices WHERE id != $1
                ORDER BY created_at DESC
                "#,
                )
                .bind(id)
                .fetch_all(&db_pool)
                .await?
            },
            None => {
                sqlx::query_as::<_, Device>(
                    r#"
                SELECT
                    id,
                    name,
                    avatar,
                    fingerprint_id,
                    role,
                    platform,
                    browser,
                    created_at,
                    updated_at
                FROM devices
                ORDER BY created_at DESC
                "#,
                )
                .fetch_all(&db_pool)
                .await?
            },
        };

        Ok(devices)
    }

    pub async fn get_not_in(ids: &[String]) -> Result<Vec<Device>> {
        let db_pool = db::get_db_pool()?;
        if ids.is_empty() {
            return Self::get_all(None).await;
        }

        let mut query_builder = QueryBuilder::<Sqlite>::new(
            r#"
            SELECT
                id,
                name,
                avatar,
                fingerprint_id,
                role,
                platform,
                browser,
                created_at,
                updated_at
            FROM devices WHERE id NOT IN (
          "#,
        );
        let mut separated = query_builder.separated(", ");
        for id in ids {
            separated.push_bind(id);
        }
        separated.push_unseparated(") ");
        let devices = query_builder.build_query_as::<Device>().fetch_all(&db_pool).await?;

        Ok(devices)
    }

    pub async fn register(&self) -> Result<Device> {
        let db_pool = db::get_db_pool()?;
        let device = sqlx::query_as::<_, Device>(
            r#"
            INSERT INTO devices (id, name, role, platform, browser)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            "#,
        )
        .bind(&self.id)
        .bind(&self.name)
        .bind(&self.role)
        .bind(&self.platform)
        .bind(&self.browser)
        .fetch_one(&db_pool)
        .await?;

        Ok(device)
    }

    pub async fn patch(&self) -> Result<()> {
        let db_pool = db::get_db_pool()?;
        let mut query_builder = sqlx::QueryBuilder::<sqlx::Sqlite>::new("UPDATE devices SET ");
        let mut needs_comma = false;

        macro_rules! add_field {
            ($val:expr, $col:literal) => {
                if let Some(v) = $val {
                    if needs_comma {
                        query_builder.push(", ");
                    }
                    query_builder.push($col).push(" = ").push_bind(v);
                    needs_comma = true;
                }
            };
        }

        // add_field!(&self.name, "name");
        add_field!(&self.avatar, "avatar");

        if !needs_comma {
            bail!("No fields need to update");
        }

        query_builder.push(" WHERE id = ").push_bind(&self.id);

        query_builder.build().execute(&db_pool).await?;

        Ok(())
    }
}
