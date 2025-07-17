use crate::config::{Config, ISynclan};
use anyhow::Result;
use axum_server::tls_rustls::RustlsConfig;
use rcgen::{CertificateParams, DistinguishedName, DnType, KeyPair, SanType};
use std::net::IpAddr;

/// Self-signed certificate to support HTTPS with given IP.
pub async fn build_rustls_config_with_ip(ip: &IpAddr) -> Result<RustlsConfig> {
    let synclan = Config::synclan().latest_ref().clone();
    
    if let (Some(cert_pem), Some(signing_key_pem)) = (synclan.cert_pem, synclan.signing_key_pem) {
        let config =
            RustlsConfig::from_pem(cert_pem.into_bytes(), signing_key_pem.into_bytes()).await?;
        return Ok(config);
    }

    // Generate new self-signed certificate
    let (cert_pem, signing_key_pem) = generate_cert(ip)?;

    // save to config
    let patch = ISynclan {
        cert_pem: Some(cert_pem.clone()),
        signing_key_pem: Some(signing_key_pem.clone()),
        ..ISynclan::default()
    };
    Config::synclan().draft_mut().patch_config(patch);

    match RustlsConfig::from_pem(cert_pem.into_bytes(), signing_key_pem.into_bytes()).await {
        Ok(config) => {
            Config::synclan().apply();
            Config::synclan().data_mut().save_config()?;
            Ok(config)
        }
        Err(err) => {
            Config::synclan().discard();
            Err(err.into())
        }
    }
}

/// Generate new self-signed certificate
pub fn generate_cert(ip: &IpAddr) -> Result<(String, String)> {
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

    Ok((cert_pem, signing_key_pem))
}
