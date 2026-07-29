# 💬 SyncLan

**An Instant-Messaging-Style LAN File Transfer Tool**

Bringing a "Lark/Feishu-grade IM experience" to local network file sharing. Anytime, anywhere, ready out of the box.

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Tauri](https://img.shields.io/badge/Tauri-v2-blue.svg?logo=tauri)
![Rust](https://img.shields.io/badge/Rust-1.97+-orange.svg?logo=rust)
![React](https://img.shields.io/badge/React-19-61dafb.svg?logo=react)

English | [简体中文](./README-zh_CN.md)

---

**SyncLan** is an instant-messaging-style file transfer tool built for local area networks (LANs). It breaks away from the cold, drag-and-drop workflow of traditional transfer tools by seamlessly integrating **chat** and **file sharing** into a single unified interface. Once devices on the same Wi-Fi or LAN are automatically discovered, you can exchange plain text, rich text, images, and files just as you would in a modern IM app.

The desktop client acts as a "communication hub" running locally, allowing other LAN devices (smartphones, tablets, or other PCs) to **connect instantly via any web browser without installing any apps**.

> 💡 **Ideal For**: Cross-device office collaboration, dorm/home network sharing, environments without public internet access, or any scenario where you want to avoid third-party cloud drives and chat apps for temporary file transfers.

---

## ✨ Features

- 💬 **Lark-grade IM Experience**: Closely models the conversation list and chat layout of Lark/Feishu, featuring meticulous visual interaction details for zero learning curve.
- 🖼️ **Pixel-Perfect Rich Text Editor**: Supports formatted text editing, inline live previews for images and attachments, and infinite scroll for message history, giving it the smooth feel of a mature IM application.
- 📁 **High-Speed LAN Transfers**: Direct file transfers saved straight to your designated local folder, leveraging full local network bandwidth without public speed caps.
- 🖥️ **Desktop Host + Zero-Install Web Client**: Built on Tauri 2 as a lightweight, cross-platform desktop app with a built-in web server. Mobile phones and other PCs can join instantly by scanning a QR code or entering the IP address in a browser.
- 🔎 **Automatic Device Discovery**: Uses LAN broadcasts to discover online devices automatically and start messaging with a single click.
- 🔐 **HTTPS Support**: Built-in self-signed certificate export functionality, enabling full HTTPS encryption once trusted.
- ⚙️ **Highly Customizable**: Supports multi-language switching (English/Chinese), light/dark themes, auto-start on boot, silent tray launch, auto-cleanup of expired files, and more.
- 🧩 **Open API Documentation**: Includes built-in Swagger UI (`/api/docs`) for easy secondary development and automated integrations.

---

## 📸 Screenshots

### Desktop Interface

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

### Mobile Browser View

<p align="center">
  <img src="https://github.com/user-attachments/assets/8c050155-caa0-4cba-a1ac-df043715cbca" width="24%" />
  <img src="https://github.com/user-attachments/assets/a3d54954-cdd2-47fa-9f32-e80a30e28663" width="24%" />
  <img src="https://github.com/user-attachments/assets/193e57b6-d895-495d-80bb-9e50d49b00bc" width="24%" />
  <img src="https://github.com/user-attachments/assets/f62224cb-5aff-4608-9412-9a09b2c54f00" width="24%" />
</p>

---

## 🎨 Design & UI System

SyncLan's frontend UI is primarily built with [shadcn/ui](https://ui.shadcn.com/), following modern Web design standards.

> 🤝 **Contributions Welcome**: We are constantly refining the UI/UX details. If you have design suggestions, interaction improvements, or Figma/Sketch files to share, feel free to submit an issue or open a pull request!

---

## 🏗️ Architecture & How It Works

SyncLan uses a **"Desktop Hub with Zero-Install Mobile/Web Access"** design philosophy:

```text
[ Desktop Client (Tauri) ] ---- Port Listener (Default 53317) ---- Socket.IO / Web Server
       |                                                                |
       +---> Device Discovery (Finds other SyncLan desktop clients)      |
       |                                                                |
       +---> Other LAN Devices (Phones / Tablets / PCs) ----> [ Web Browser IP:53317 ]
```

1. **Desktop Host as Communication Hub**: Launching the desktop app automatically starts the backend IM service (Axum + Socket.IO) alongside a static web server.
2. **Zero-Install Multi-Device Access**: Other devices on the same network don't need any app installed. Simply open a browser, navigate to the desktop host's local IP and port, and begin chatting or transferring files right away.
3. **Note on Native Mobile Apps**: Real-time LAN communication requires persistent long-lived connections (Socket.IO), which drains battery and suffers from strict background termination on iOS and Android. As a result, **we currently have no plans for native mobile apps**; please use mobile browsers for instant access.

---

## 🚀 Quick Start

### 1. Download & Install

Head to [GitHub Releases](https://github.com/1111mp/synclan/releases/latest) and download the appropriate installer for your platform (macOS / Windows / Linux).

### 2. Default Service Endpoints

Once started, the application listens on port `53317` by default:

- **Local Web App**: `http://127.0.0.1:53317` (Access from local PC browser)
- **LAN Web App**: `http://<LAN-IP>:53317` (Access from phone or other devices)
- **API Documentation**: `http://127.0.0.1:53317/api/docs` (Swagger UI for developers)
- **WebSocket Node**: `ws://127.0.0.1:53317/socket` (Socket.IO real-time communication endpoint)

---

## 🛠️ Local Development Setup

If you wish to contribute or build SyncLan from source:

### Prerequisites

- **Node.js**: LTS version (v18+ recommended)
- **pnpm**: Package manager
- **Rust**: Latest Stable release (includes `rust-toolchain.toml`)
- **Tauri 2 Dependencies**: Follow the official [Tauri Prerequisites Guide](https://tauri.app/start/prerequisites/) for your OS.

### Steps

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/1111mp/synclan.git
   cd synclan
   pnpm install
   ```

2. Run the desktop app in development mode:

   ```bash
   pnpm dev
   ```

3. Build for production:
   ```bash
   pnpm build
   ```
   _(Output binaries will be placed under target/release/bundle/)_

### Useful Development Commands

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

---

## 📂 Project Structure

```text
.
├── src/                  # React frontend source (Desktop UI & Web client)
│   ├── components/       # Base UI components, message items, device list, etc.
│   ├── pages/            # View pages (Chat, Discovery, Settings, etc.)
│   ├── lib/              # API wrappers, utility functions, type definitions
│   └── locales/          # i18n internationalization setup
├── src-tauri/            # Tauri / Rust backend source
│   ├── src/server/       # Axum HTTP API, Socket.IO handlers, background workers
│   ├── src/config/       # App configurations & credentials management
│   ├── src/core/         # System tray, logging, window controls, auto-start
│   └── resources/        # Static assets, DB migration scripts
├── scripts/              # CI/CD and build scripts
├── package.json          # Node dependencies and scripts
└── Cargo.toml            # Rust workspace configuration
```

---

## ❓ Troubleshooting

### 1. Devices missing from the auto-discovery list?

- Ensure all devices are connected to the exact same Wi-Fi / LAN subnet.
- Check and temporarily disable **VPNs, global proxies**, or router **AP Isolation (Guest Network Isolation)**.
- Check Windows Firewall or macOS Network Privacy settings to ensure SyncLan is allowed to listen on the configured port.

### 2. Mobile or remote browser cannot open the web page?

- Verify you are entering the host computer's **LAN IP** (e.g., `192.168.1.X`), not `127.0.0.1`.
- Ensure the desktop client is running and the port isn't blocked by local firewalls or occupied by another app.

### 3. HTTPS shows "Untrusted Certificate" warning?

- SyncLan uses locally generated self-signed certificates. In the desktop settings, click **"Export Certificate"** and install/trust it in your browser or operating system's Trusted Root Certification Authorities store.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
