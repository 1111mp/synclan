use crate::module::device::Device;
use anyhow::Result;

pub async fn get_device_by_id(id: String) -> Result<Option<Device>> {
    Device::get_host_device(&id).await
}

pub async fn get_devices(self_id: Option<String>) -> Result<Vec<Device>> {
    Device::get_all(self_id.as_deref()).await
}

pub async fn devices_discover(exclude_ids: &[String]) -> Result<Vec<Device>> {
    Device::get_not_in(exclude_ids).await
}

pub async fn remove_device(id: String) -> Result<()> {
    Device::remove(&id).await
}
