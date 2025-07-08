use crate::config::{Config, ISynclan};
use anyhow::Result;
use axum_server::tls_rustls::RustlsConfig;
use rcgen::{CertificateParams, DistinguishedName, DnType, KeyPair, SanType};
use std::net::IpAddr;

/// Self-signed certificate to support HTTPS with given IP.
pub async fn build_rustls_config_with_ip(ip: &IpAddr) -> Result<RustlsConfig> {
    let config = Config::synclan();
    let cert_pem = config.latest().get_cert_pem();
    let signing_key_pem = config.latest().get_signing_key_pem();

    if let (Some(cert_pem), Some(signing_key_pem)) = (cert_pem, signing_key_pem) {
        let config =
            RustlsConfig::from_pem(cert_pem.into_bytes(), signing_key_pem.into_bytes()).await?;
        return Ok(config);
    }

    // Generate new self-signed certificate
    let mut params = CertificateParams::new(vec![])?;
    params.distinguished_name = DistinguishedName::new();
    params
        .distinguished_name
        .push(DnType::CommonName, "Local SyncLan HTTPS Server");
    params
        .subject_alt_names
        .push(SanType::IpAddress(ip.clone()));
    let signing_key = KeyPair::generate()?;
    let cert = params.self_signed(&signing_key)?;
    let cert_pem = cert.pem();
    let signing_key_pem = signing_key.serialize_pem();

    // save to config
    let patch = ISynclan {
        cert_pem: Some(cert_pem.clone()),
        signing_key_pem: Some(signing_key_pem.clone()),
        ..ISynclan::default()
    };
    Config::synclan().draft().patch_config(patch);

    match RustlsConfig::from_pem(cert_pem.into_bytes(), signing_key_pem.into_bytes()).await {
        Ok(config) => {
            Config::synclan().apply();
            Config::synclan().data().save_file()?;
            Ok(config)
        }
        Err(err) => {
            Config::synclan().discard();
            Err(err.into())
        }
    }
}
