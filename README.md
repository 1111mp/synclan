# SyncLan

**SyncLan** 是一个面向局域网的即时通讯式文件传输工具。它把「聊天」和「传文件」放在同一个界面里：在同一 Wi‑Fi / LAN 下发现设备后，像发消息一样发送文字、图片和文件；桌面端负责运行本地服务，浏览器端也可以直接访问和使用。

> 适合在办公室、宿舍、家庭网络、无公网环境或不想依赖云盘时，在多台设备之间快速交换内容。

[English](./README-en.md) | 简体中文

## 亮点

- 💬 **飞书级 IM 交互体验**：会话列表与聊天窗口的设计深度参考飞书（Lark），追求一致的精致感与操作直觉，极大地降低局域网传输工具的使用门槛。
- 🖼️ **像素级打磨的富文本编辑器**：支持文本样式编辑、图片附件行内预览和消息历史滚动加载，核心交互体验努力与飞书对齐，让局域网聊天和文件互传也能拥有现代成熟 IM 的流畅感。
- 📁 **局域网文件传输**：文件上传到本机配置的资源目录，并通过局域网地址分享给目标设备。
- 🖥️ **桌面端 + 浏览器端**：基于 Tauri 的跨平台桌面应用，同时内置 Web 静态页面服务，浏览器可访问本机服务地址使用。
- 🔎 **设备发现**：在同一网络中发现可连接设备，选择后即可开始会话。
- 🔐 **可选 HTTPS**：可导出自签名证书，并在系统信任后启用 HTTPS。
- ⚙️ **可配置体验**：支持语言、主题、开机启动、静默启动、自动更新检查、端口、上传目录、自动清理等设置。
- 🧩 **开放 API 文档**：内置 Swagger UI，方便调试或扩展自动化集成。

## 截图

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

## 工作方式与架构设计

SyncLan 采用 **“桌面端提供核心服务，浏览器端免安装加入”** 的设计模式。这与 LocalSend 等需要两端都安装客户端的工具不同：

1. **必须启动桌面端**：SyncLan 桌面应用是整个局域网通信的“基站”。启动它会同时在本机拉起 IM 通信服务（Socket.IO）和 Web 静态站点服务。
2. **多端浏览器访问**：只要有一台电脑运行了桌面端，局域网内的其他电脑或设备**无需安装任何应用**，直接打开浏览器访问该电脑的局域网 IP 和端口，就能立刻加入聊天并互传文件。
3. **关于移动端（iOS / Android）**：SyncLan 的架构需要常驻后台并运行完整的 IM 与 Web 站点服务，这种设计对移动端的电池和后台留存极不友好。因此，**本项目目前及未来均不打算开发移动端原生 App**。移动端设备请直接通过浏览器访问桌面端的服务地址来使用。

### 核心连接步骤

<p align="left">
  <img src="https://github.com/user-attachments/assets/004b8a75-1373-4ab6-bf66-696344f9d4df" width="200" />
  <img src="https://github.com/user-attachments/assets/d1d988e3-c30a-43d2-b682-1827560d079e" width="200" />
</p>

1. 在核心电脑上启动 SyncLan 桌面端。
2. 确保所有设备处于同一个局域网 / Wi‑Fi，且防火墙允许 SyncLan 使用的端口。
3. **桌面端之间**：打开「设备发现」，选择目标设备即可进入会话。
4. **无客户端设备 / 移动端**：在浏览器中直接打开桌面端暴露的局域网服务地址。

默认本地服务端口为 `53317`，本机访问地址通常为：

- Web 页面：`http://127.0.0.1:53317`
- API 文档：`http://127.0.0.1:53317/api/docs`
- Socket.IO：`ws://127.0.0.1:53317/socket`

> 端口与上传目录均可在应用设置中修改。

## 安装与使用

### 下载发布版

如果你只是想使用 SyncLan，建议从 [GitHub Releases](https://github.com/1111mp/synclan/releases/latest) 下载适合系统的安装包。

### 从源码运行

#### 环境要求

- Node.js（建议使用当前 LTS 版本）
- pnpm
- [Rust](https://rust-lang.org/learn/get-started/)（仓库包含 `rust-toolchain.toml`，会使用项目指定工具链）
- [Tauri 2](https://tauri.app/) 所需系统依赖

不同系统的 Tauri 依赖安装方式略有差异，请参考 Tauri 官方文档完成 [WebView / 构建工具链](https://tauri.app/zh-cn/start/prerequisites/)准备。

#### 安装依赖

```bash
pnpm install
```

#### 开发模式

```bash
pnpm dev
```

该命令会启动 Tauri 桌面端开发环境，并在启动前构建/启动对应前端资源。

#### 构建桌面应用

```bash
pnpm build
```

构建产物会输出到 Tauri 默认的 `src-tauri/target/release/bundle/` 目录下。

#### 仅构建 Web 页面

```bash
pnpm web:build
```

#### 仅构建桌面 UI

```bash
pnpm ui:build
```

## 常用设置说明

| 设置项             | 说明                                                             |
| ------------------ | ---------------------------------------------------------------- |
| Language           | 切换界面语言，目前包含简体中文与 English。                       |
| Appearance         | 跟随系统、浅色或深色主题。                                       |
| Launch at Login    | 桌面端开机自启动。                                               |
| Start Minimized    | 启动后最小化到后台/托盘。                                        |
| HTTP Server Port   | 本地 HTTP 服务端口，默认 `53317`。                               |
| Enable HTTPS       | 启用 HTTPS。本功能需要先导出证书并加入系统信任。                 |
| Export Certificate | 导出 SyncLan 自签名证书，用于系统信任。                          |
| Upload Directory   | 接收/上传文件的保存目录。                                        |
| Auto File Cleanup  | 自动清理上传资源，可选择不清理、保留 1 天、7 天、30 天或 90 天。 |
| Auto Check Update  | 自动检查应用更新。                                               |

## 浏览器端访问

桌面端启动后会同时提供 Web 静态资源服务。同一局域网内的其他设备可以通过桌面端设备的局域网 IP 加端口访问，例如：

```text
http://192.168.1.10:53317
```

如果无法访问，请检查：

- 两台设备是否在同一局域网 / Wi‑Fi 下。
- 桌面端是否正在运行。
- 端口是否被系统防火墙、杀毒软件或路由器隔离策略拦截。
- 如果启用了 HTTPS，访问端是否已信任导出的 SyncLan 证书。

## API 与扩展

SyncLan 后端基于 Axum 提供 HTTP API，并通过 Socket.IO 处理实时消息。启动桌面端后，可以打开：

```text
http://127.0.0.1:53317/api/docs
```

查看 OpenAPI / Swagger 文档。主要接口分组包括：

- `Synclan`：应用访问校验等基础能力。
- `Device`：设备信息与设备发现。
- `Upload`：附件上传。
- `Message`：消息发送与历史记录。

## 项目结构

```text
.
├── src/                  # React 前端源码
│   ├── components/       # 通用 UI、消息组件、设备发现等
│   ├── pages/            # 页面：欢迎页、设备会话、设置、资料等
│   ├── lib/              # API、附件、工具函数、类型等
│   └── locales/          # 多语言资源
├── src-tauri/            # Tauri / Rust 后端源码
│   ├── src/server/       # HTTP API、Socket.IO、路由、任务 worker
│   ├── src/config/       # 应用配置与加密字段
│   ├── src/core/         # 托盘、日志、窗口、开机启动等核心能力
│   └── resources/        # Web 静态资源、数据库迁移等打包资源
├── scripts/              # 更新与发布辅助脚本
├── package.json          # 前端依赖与常用脚本
└── Cargo.toml            # Rust workspace 配置
```

## 开发脚本

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

## 故障排查

### 发现不到设备

- 确认所有设备都连接到同一局域网。
- 暂时关闭 VPN、代理或访客网络隔离策略后重试。
- 检查系统防火墙是否允许 SyncLan 监听和访问配置端口。
- 修改端口后请重启本地服务或重启应用。

### 浏览器无法打开 Web 页面

- 在桌面端设备上先访问 `http://127.0.0.1:53317`，确认本机服务正常。
- 在其他设备上使用桌面端设备的局域网 IP，而不是 `127.0.0.1`。
- 确认端口与设置中的 HTTP Server Port 一致。

### HTTPS 提示证书不受信任

SyncLan 使用自签名证书。请在设置中导出证书，将其加入操作系统或浏览器的信任列表，然后重启 SyncLan 并再次访问。

## 许可证

本项目基于 [MIT License](LICENSE) 开源。
