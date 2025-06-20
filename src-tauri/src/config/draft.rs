use super::ISynclan;
use parking_lot::{MappedMutexGuard, Mutex, MutexGuard};
use std::sync::Arc;

#[derive(Debug, Clone)]
pub struct Draft<T: Clone + ToOwned> {
    inner: Arc<Mutex<(T, Option<T>)>>,
}

macro_rules! draft_define {
    ($id: ident) => {
        impl From<$id> for Draft<$id> {
            fn from(data: $id) -> Self {
                Draft {
                    inner: Arc::new(Mutex::new((data, None))),
                }
            }
        }

        impl Draft<Box<$id>> {
            #[allow(unused)]
            pub fn data(&self) -> MappedMutexGuard<Box<$id>> {
                MutexGuard::map(self.inner.lock(), |guard| &mut guard.0)
            }

            pub fn latest(&self) -> MappedMutexGuard<Box<$id>> {
                MutexGuard::map(self.inner.lock(), |inner| {
                    if inner.1.is_none() {
                        &mut inner.0
                    } else {
                        inner.1.as_mut().unwrap()
                    }
                })
            }

            pub fn draft(&self) -> MappedMutexGuard<Box<$id>> {
                MutexGuard::map(self.inner.lock(), |inner| {
                    if inner.1.is_none() {
                        inner.1 = Some(inner.0.clone());
                    }

                    inner.1.as_mut().unwrap()
                })
            }

            pub fn apply(&self) -> Option<Box<$id>> {
                let mut inner = self.inner.lock();

                match inner.1.take() {
                    Some(draft) => {
                        let old_value = inner.0.to_owned();
                        inner.0 = draft.to_owned();
                        Some(old_value)
                    }
                    None => None,
                }
            }

            pub fn discard(&self) -> Option<Box<$id>> {
                let mut inner = self.inner.lock();
                inner.1.take()
            }
        }

        impl From<Box<$id>> for Draft<Box<$id>> {
            fn from(data: Box<$id>) -> Self {
                Draft {
                    inner: Arc::new(Mutex::new((data, None))),
                }
            }
        }
    };
}

draft_define!(ISynclan);
