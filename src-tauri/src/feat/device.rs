use crate::module::device::Device;
use anyhow::Result;

pub async fn get_device_by_id(id: String) -> Result<Option<Device>> {
    Device::get_host_device(&id).await
}
