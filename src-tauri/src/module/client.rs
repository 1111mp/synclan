use crate::utils::db;
use anyhow::{bail, Result};
use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Client {
    pub id: String,
    pub name: Option<String>,
    pub avatar: Option<String>,
    pub auto_message_clean: Option<i32>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

impl Client {
    /// Get client by id
    pub async fn get_by_id(id: String) -> Result<Option<Client>> {
        let db_pool = db::get_db_pool()?;
        let client = sqlx::query_as::<_, Client>(
            "SELECT id, name, avatar, auto_message_clean, created_at, updated_at FROM clients WHERE id = $1",
        )
        .bind(id)
        .fetch_optional(&db_pool)
        .await?;

        Ok(client)
    }

    pub async fn create(&self) -> Result<Client> {
        let db_pool = db::get_db_pool()?;
        let client = sqlx::query_as::<_, Client>(
            r#"
            INSERT INTO clients (id, name, avatar) 
            VALUES ($1, $2, $3)
            RETURNING *
            "#,
        )
        .bind(&self.id)
        .bind(&self.name)
        .bind(&self.avatar)
        .fetch_one(&db_pool)
        .await?;

        Ok(client)
    }

    pub async fn patch(&self) -> Result<()> {
        let db_pool = db::get_db_pool()?;
        let mut query_builder = sqlx::QueryBuilder::<sqlx::Sqlite>::new("UPDATE clients SET ");
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

        add_field!(&self.name, "name");
        add_field!(&self.avatar, "avatar");
        add_field!(&self.auto_message_clean, "auto_message_clean");

        if !needs_comma {
            bail!("No fields need to update");
        }

        query_builder.push(" WHERE id = ").push_bind(&self.id);

        query_builder.build().execute(&db_pool).await?;

        Ok(())
    }
}
