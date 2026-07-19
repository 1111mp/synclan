# SyncLan

**SyncLan** is a LAN-based instant messaging and file transfer application. It combines **chatting** and **file sharing** into a single interface. Once devices are discovered on the same Wi-Fi or local network, you can exchange text messages, images, and files as naturally as chatting. The desktop application runs the local service, while browsers can directly access and use it without installation.

> Perfect for quickly sharing files and messages across multiple devices in offices, dormitories, home networks, air-gapped environments, or anywhere you don't want to rely on cloud storage.

English | [简体中文](./README.md)

## Highlights

- 💬 **Lark-inspired IM experience** – The conversation list and chat interface are heavily inspired by Lark (Feishu), providing a familiar, polished, and intuitive messaging experience while dramatically lowering the learning curve for LAN file sharing.
- 🖼️ **Pixel-perfect rich text editor** – Supports rich text formatting, inline image previews, and incremental message history loading. The editing experience is carefully refined to match the smoothness of modern IM applications like Lark.
- 📁 **LAN file transfer** – Uploaded files are stored in a configurable local resource directory and shared with other devices through LAN URLs.
- 🖥️ **Desktop + Browser** – Built with Tauri for cross-platform desktop support while simultaneously serving a built-in web application accessible from any browser.
- 🔎 **Device discovery** – Automatically discover devices on the same network and start conversations instantly.
- 🔐 **Optional HTTPS** – Export a self-signed certificate and enable HTTPS after trusting it in your operating system.
- ⚙️ **Highly configurable** – Supports language, theme, launch at login, start minimized, automatic update checks, server port, upload directory, automatic cleanup, and more.
- 🧩 **Built-in API documentation** – Includes Swagger UI for API debugging and integration.

## Screenshots

<p align="center">
  <img src="https://github.com/user-attachments/assets/721e4904-d470-4ad1-9064-9fb78168b43b" width="32%" />
  <img src="https://github.com/user-attachments/assets/63705921-9a4a-4a65-aa61-f22b81438589" width="32%" />
  <img src="https://github.com/user-attachments/assets/a25c5804-7d55-42eb-a591-a940c85714ba" width="32%" />
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/f1144582-5fc8-4184-ae5d-57543298083d" width="32%" />
  <img src="https://github.com/user-attachments/assets/e39f902f-85fe-4e1b-b157-f33162bacf67" width="32%" />
  <img src="https://github.com/user-attachments/assets/58107d41-1b8f-459d-b19f-cf70e97fac11" width="32%" />
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/8c050155-caa0-4cba-a1ac-df043715cbca" width="24%" />
  <img src="https://github.com/user-attachments/assets/a3d54954-cdd2-47fa-9f32-e80a30e28663" width="24%" />
  <img src="https://github.com/user-attachments/assets/193e57b6-d895-495d-80bb-9e50d49b00bc" width="24%" />
  <img src="https://github.com/user-attachments/assets/f62224cb-5aff-4608-9412-9a09b2c54f00" width="24%" />
</p>

## Architecture

SyncLan adopts a **"desktop-hosted services with browser-based clients"** architecture, which differs from applications like LocalSend that require installation on every device.

1. **A desktop instance is required.** The SyncLan desktop application acts as the LAN hub. When launched, it starts both the IM service (Socket.IO) and the built-in web server.
2. **Browser access for other devices.** As long as one computer is running SyncLan Desktop, any other device on the same LAN can join instantly by opening the host's IP address in a browser—no installation required.
3. **About mobile devices (iOS / Android).** SyncLan relies on long-running background services that continuously provide IM and web server functionality. This architecture is not well suited to mobile operating systems due to battery usage and background execution restrictions. Therefore, **native mobile applications are not planned**, and mobile devices should simply access the desktop service through a browser.

### Connection Flow

<p align="left">
  <img src="https://github.com/user-attachments/assets/004b8a75-1373-4ab6-bf66-696344f9d4df" width="200" />
  <img src="https://github.com/user-attachments/assets/d1d988e3-c30a-43d2-b682-1827560d079e" width="200" />
</p>

1. Launch SyncLan Desktop on the host computer.
2. Ensure all devices are connected to the same LAN or Wi-Fi, and the firewall allows SyncLan's configured port.
3. **Desktop clients:** Open **Device Discovery**, select a device, and start chatting.
4. **Browser-only devices or mobile devices:** Open the desktop server's LAN address directly in your browser.

The default local service runs on port `53317`.

- Web UI: `http://127.0.0.1:53317`
- API Documentation: `http://127.0.0.1:53317/api/docs`
- Socket.IO: `ws://127.0.0.1:53317/socket`

> Both the server port and upload directory can be customized in Settings.

## Installation

### Download Releases

If you simply want to use SyncLan, download the latest installer from [GitHub Releases](https://github.com/1111mp/synclan/releases/latest).

### Build from Source

#### Requirements

- Node.js (latest LTS recommended)
- pnpm
- [Rust](https://rust-lang.org/learn/get-started/) (the repository includes `rust-toolchain.toml`)
- [Tauri 2](https://tauri.app/) system dependencies

The installation process differs slightly across operating systems. Please refer to the official Tauri documentation to install the required [WebView runtime and toolchain](https://tauri.app/zh-cn/start/prerequisites/).

#### Install Dependencies

```bash
pnpm install
```

#### Development

```bash
pnpm dev
```

Starts the Tauri desktop application in development mode.

#### Build Desktop Application

```bash
pnpm build
```

The generated packages are located under:

```text
src-tauri/target/release/bundle/
```

#### Build Web Assets Only

```bash
pnpm web:build
```

#### Build Desktop UI Only

```bash
pnpm ui:build
```

## Common Settings

| Setting            | Description                                                      |
| ------------------ | ---------------------------------------------------------------- |
| Language           | Switch between Simplified Chinese and English.                   |
| Appearance         | System, Light, or Dark theme.                                    |
| Launch at Login    | Start SyncLan automatically after login.                         |
| Start Minimized    | Launch minimized to the system tray/background.                  |
| HTTP Server Port   | HTTP service port. Default: `53317`.                             |
| Enable HTTPS       | Enable HTTPS after trusting the exported certificate.            |
| Export Certificate | Export the self-signed SyncLan certificate.                      |
| Upload Directory   | Directory used to store uploaded files.                          |
| Auto File Cleanup  | Automatically delete uploaded files after a configurable period. |
| Auto Check Update  | Automatically check for application updates.                     |

## Browser Access

When the desktop application is running, it serves the web interface automatically.

Devices on the same LAN can access it using the desktop machine's IP address, for example:

```text
http://192.168.1.10:53317
```

If you cannot connect:

- Ensure both devices are on the same LAN or Wi-Fi.
- Make sure the desktop application is running.
- Check whether the configured port is blocked by the firewall, antivirus software, or router isolation.
- If HTTPS is enabled, ensure the SyncLan certificate has been trusted.

## API

SyncLan uses **Axum** for its HTTP API and **Socket.IO** for real-time communication.

Once the desktop application is running, open:

```text
http://127.0.0.1:53317/api/docs
```

to view the OpenAPI / Swagger documentation.

Main API groups:

- `Synclan` – Application authentication and common APIs.
- `Device` – Device information and discovery.
- `Upload` – File uploads.
- `Message` – Messaging and chat history.

## Project Structure

```text
.
├── src/                  # React frontend
│   ├── components/       # Shared UI, chat components, device discovery
│   ├── pages/            # Welcome, Chat, Settings, Profile, etc.
│   ├── lib/              # API, utilities, attachments, types
│   └── locales/          # Localization resources
├── src-tauri/            # Tauri / Rust backend
│   ├── src/server/       # HTTP API, Socket.IO, workers
│   ├── src/config/       # Configuration and encrypted fields
│   ├── src/core/         # Tray, logging, windows, startup
│   └── resources/        # Bundled web assets and database migrations
├── scripts/              # Release and helper scripts
├── package.json
└── Cargo.toml
```

## Development Scripts

| Command                                                | Description                                           |
| ------------------------------------------------------ | ----------------------------------------------------- |
| `pnpm dev`                                             | Start the Tauri development environment.              |
| `pnpm build`                                           | Build desktop installers.                             |
| `pnpm app:dev`                                         | Build the web application and preview the desktop UI. |
| `pnpm app:build`                                       | Build both the web application and desktop UI.        |
| `pnpm web:dev`                                         | Start the browser development server.                 |
| `pnpm web:build`                                       | Build browser assets.                                 |
| `pnpm ui:dev`                                          | Start the desktop UI development server.              |
| `pnpm ui:build`                                        | Type-check and build the desktop UI.                  |
| `pnpm typecheck`                                       | Run TypeScript type checking.                         |
| `pnpm oxlint`                                          | Run frontend linting.                                 |
| `pnpm format:check`                                    | Check frontend formatting.                            |
| `pnpm test`                                            | Run Vitest tests.                                     |
| `cargo test -p synclan`                                | Run Rust tests.                                       |
| `cargo fmt --all -- --check`                           | Check Rust formatting.                                |
| `cargo clippy -p synclan --all-targets -- -D warnings` | Run Rust Clippy.                                      |

## Troubleshooting

### Devices Cannot Be Discovered

- Ensure all devices are connected to the same LAN.
- Temporarily disable VPNs, proxies, or guest network isolation.
- Verify that the system firewall allows SyncLan to use the configured port.
- Restart the local service after changing the server port.

### Cannot Open the Web Interface

- First verify that `http://127.0.0.1:53317` works on the host machine.
- Use the host machine's LAN IP instead of `127.0.0.1` on other devices.
- Ensure the HTTP Server Port matches the configured value.

### HTTPS Certificate Not Trusted

SyncLan uses a self-signed certificate.

Export the certificate from **Settings**, trust it in your operating system or browser, restart SyncLan, and try again.

## License

This project is licensed under the **MIT License**.
