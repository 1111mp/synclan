use axum::{
    extract::{FromRequestParts, Query as AxumQuery},
    http::request::Parts,
};
use serde::de::DeserializeOwned;
use validator::Validate;

pub struct Query<T>(pub T);

impl<S, T> FromRequestParts<S> for Query<T>
where
    // these trait bounds are copied from `impl FromRequest for axum::extract::path::Path`
    T: DeserializeOwned + Send + Validate,
    S: Send + Sync,
{
    type Rejection = super::ParserRejection;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let AxumQuery(value) = AxumQuery::<T>::from_request_parts(parts, state).await?;
        value.validate()?;
        Ok(Query(value))
    }
}
