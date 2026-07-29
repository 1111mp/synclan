# 💬 SyncLan

**局域网即时通讯式文件传输工具**

把「飞书级 IM 体验」带入局域网文件传输。随时随地，即开即用。

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Tauri](https://img.shields.io/badge/Tauri-v2-blue.svg?logo=tauri)
![Rust](https://img.shields.io/badge/Rust-1.97+-orange.svg?logo=rust)
![React](https://img.shields.io/badge/React-19-61dafb.svg?logo=react)

[English](./README.md) | 简体中文

---

**SyncLan** 是一个面向局域网的即时通讯式文件传输工具。它打破了传统文件传输工具“纯拖拽”的冰冷感，把**「聊天」**和**「传文件」**完美融入同一界面：在同一 Wi‑Fi / LAN 下自动发现设备后，像使用 IM 软件一样发送文本、富文本、图片和文件。

桌面端作为“通信基站”运行服务，局域网内的其他设备（手机、平板、其他电脑）**无需安装客户端，直接通过浏览器访问即可使用**。

> 💡 **适用场景**：办公室跨设备协作、宿舍/家庭网络分享、无公网环境传输，或任何不想依赖第三方云盘与社交软件转存内容的场景。

---

## ✨ 特性亮点

- 💬 **飞书级 IM 交互体验**：深度参考飞书（Lark）的会话列表与聊天窗口设计，追求极致的视觉交互细节，零学习成本。
- 🖼️ **像素级打磨的富文本编辑器**：支持文本样式排版、图片/附件行内实时预览、消息历史滚动加载，打造现代成熟 IM 的流畅感。
- 📁 **高效局域网传输**：文件直传并保存至本地配置目录，基于局域网高速带宽，不受公网网速限制。
- 🖥️ **桌面端 + 零安装 Web 端**：基于 Tauri 2 的轻量级跨平台桌面应用，同时内置 Web 服务，手机/其他电脑浏览器扫码或输入 IP 即可接入。
- 🔎 **自动设备发现**：基于局域网广播自动搜索在线设备，一键建立会话。
- 🔐 **安全 HTTPS 支持**：内置自签名证书导出功能，信任后可开启全站 HTTPS 传输。
- ⚙️ **高度可定制**：支持多语言（中/英）、深浅色主题、开机自启、静默启动、自动清理过期文件等。
- 🧩 **开放 API 文档**：内置 Swagger UI (`/api/docs`)，方便开发者进行二次开发或自动化集成。

---

## 📸 界面预览

### 桌面端体验

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

### 移动端浏览器适配

<p align="center">
  <img src="https://github.com/user-attachments/assets/8c050155-caa0-4cba-a1ac-df043715cbca" width="24%" />
  <img src="https://github.com/user-attachments/assets/a3d54954-cdd2-47fa-9f32-e80a30e28663" width="24%" />
  <img src="https://github.com/user-attachments/assets/193e57b6-d895-495d-80bb-9e50d49b00bc" width="24%" />
  <img src="https://github.com/user-attachments/assets/f62224cb-5aff-4608-9412-9a09b2c54f00" width="24%" />
</p>

---

## 🎨 UI 设计与规范

SyncLan 前端 UI 主要基于 [shadcn/ui](https://ui.shadcn.com/) 搭建，遵循现代 Web 设计规范。

> 🤝 **欢迎贡献**：项目目前仍在持续优化 UI 细节。如果你有更好的 UI/UX 建议、交互改进方案或 Figma / Sketch 设计稿，非常欢迎提交 ISSUE 或 Pull Request！

---

## 🏗️ 架构设计与工作方式

SyncLan 采用 **“桌面端为服务中心，移动/Web 端免安装接入”** 的设计哲学：

```text
[ 桌面客户端 (Tauri) ] ---- 监听端口 (默认 53317) ---- Socket.IO / Web Server
       |                                                         |
       +---> 设备发现 (发现 LAN 内其他 SyncLan 桌面端)                 |
       |                                                         |
       +---> 局域网其他设备 (手机 / 平板 / 电脑) ---------> [ 浏览器访问 IP:53317 ]
```

1. **桌面端作为通信基站**：启动桌面端后，后台会自动拉起 IM 通信服务（Axum + Socket.IO）与静态 Web 站点服务。
2. **多端免安装访问**：局域网内的其他设备无需安装任何 App，只需打开浏览器访问桌面端显示的局域网 IP 加端口即可直接发送消息与传输文件。
3. **关于移动端 App 的说明**：因为局域网实时通信需要常驻后台与 Socket 长连接，这对 iOS 和 Android 的后台保活与电池消耗极不友好。因此 SyncLan **暂无规划开发移动端原生 App**，移动端请直接通过浏览器快捷访问。

---

## 🚀 快速开始

### 1. 下载安装

请直接前往 [GitHub Releases](https://github.com/1111mp/synclan/releases/latest) 下载适合你操作系统的安装包（macOS / Windows / Linux）。

### 2. 默认服务入口

应用启动后，默认监听端口为 `53317`：

- **Web 页面**：`http://127.0.0.1:53317` （本机浏览器访问入口）
- **局域网 Web**：`http://<局域网-IP>:53317` （手机/其他设备访问入口）
- **API 文档**：`http://127.0.0.1:53317/api/docs` （Swagger UI 开发者文档）
- **WebSocket**：`ws://127.0.0.1:53317/socket` （Socket.IO 实时通信节点）

---

## 🛠️ 本地开发环境搭建

如果你希望参与开发或自行从源码构建：

### 前置需求

- **Node.js**：LTS 版本 (推荐 v18+)
- **pnpm**：包管理器
- **Rust**：最新 Stable 版本（项目包含 `rust-toolchain.toml`）
- **Tauri 2 依赖**：请参考 [Tauri 官方准备指南](https://tauri.app/zh-cn/start/prerequisites/) 配置系统依赖。

### 步骤

1. 克隆项目并安装依赖：

   ```bash
   git clone https://github.com/1111mp/synclan.git
   cd synclan
   pnpm install
   ```

2. 启动桌面端开发模式：

   ```bash
   pnpm dev
   ```

3. 构建发布版本：
   ```bash
   pnpm build
   ```
   _(产物将输出至 `target/release/bundle/`)_

### 常用开发命令

| 命令                                                   | 说明                            |
| ------------------------------------------------------ | ------------------------------- |
| `pnpm dev`                                             | 启动 Tauri 开发模式。           |
| `pnpm build`                                           | 构建桌面端安装包。              |
| `pnpm app:dev`                                         | 构建 Web 端并启动桌面 UI 预览。 |
| `pnpm app:build`                                       | 构建 Web 端与桌面 UI。          |
| `pnpm web:dev`                                         | 启动浏览器端 Vite 开发服务。    |
| `pnpm web:build`                                       | 构建浏览器端资源。              |
| `pnpm ui:dev`                                          | 启动桌面 UI Vite 开发服务。     |
| `pnpm ui:build`                                        | 类型检查并构建桌面 UI。         |
| `pnpm typecheck`                                       | TypeScript 类型检查。           |
| `pnpm oxlint`                                          | 运行前端 lint。                 |
| `pnpm format:check`                                    | 检查前端格式。                  |
| `pnpm test`                                            | 运行 Vitest。                   |
| `cargo test -p synclan`                                | 运行 Rust 测试。                |
| `cargo fmt --all -- --check`                           | 检查 Rust 格式。                |
| `cargo clippy -p synclan --all-targets -- -D warnings` | 运行 Rust Clippy。              |

---

## 📂 项目目录结构

```text
.
├── src/                  # React 前端源码 (桌面 UI & Web 端)
│   ├── components/       # 基础 UI 组件、消息体、设备列表等
│   ├── pages/            # 页面视图 (会话、发现、设置等)
│   ├── lib/              # API 封装、工具函数、类型定义
│   └── locales/          # i18n 多语言国际化配置
├── src-tauri/            # Tauri / Rust 后端源码
│   ├── src/server/       # Axum HTTP API、Socket.IO、后台任务 Worker
│   ├── src/config/       # 应用配置与安全凭证管理
│   ├── src/core/         # 系统托盘、日志系统、窗口控制、自启动
│   └── resources/        # 打包静态资源、数据库 Migration 脚本
├── scripts/              # CI/CD 与构建更新辅助脚本
├── package.json          # Node 依赖与脚本定义
└── Cargo.toml            # Rust Workspace 配置
```

---

## ❓ 常见问题排查 (Troubleshooting)

### 1. 设备发现列表中找不到对方设备？

- 请确认两台设备处于同一个 Wi-Fi / 局域网网段下。
- 检查并暂时关闭电脑上的 **VPN、全局代理** 或无线路由器的 **访客隔离 (AP Isolation)** 功能。
- 检查 Windows 防火墙或 macOS 网络权限，确保允许 SyncLan 监听配置端口。

### 2. 手机/其他电脑浏览器打不开 Web 页面？

- 请确认输入的是桌面端电脑的 **局域网 IP**（如 `192.168.1.X`），而不是 `127.0.0.1`。
- 确保桌面端程序保持运行状态，且端口未被占用或防火墙拦截。

### 3. 开启 HTTPS 后提示“证书不受信任”？

- SyncLan 生成的是本地自签名证书。请在桌面端设置中选择 **“导出证书”**，将其安装至目标设备的系统/浏览器受信任根证书颁发机构列表中。

---

## 📄 开源许可证

本项目基于 [MIT License](LICENSE) 许可协议开源。
