## v0.1.5

### Features & Improvements

- Add grouped avatar selection with DiceBear Avataaars and Marbles styles.
- Unify the design of settings, profile, welcome, device management, and data restoration pages, with improved responsive layouts and theme controls.
- Remember the sidebar's expanded or collapsed state and show unread message counts in both states.
- Improve syntax highlighting and message list rendering performance for conversations with large amounts of code.
- Add loading placeholders, error messages, and retry actions for images and videos. Improve media sizing and long-message expansion and collapse.
- Improve file download states and feedback, prevent duplicate downloads, and refine English and Chinese text.

### Bug Fixes

- Fix the expanded message composer failing to close on the first backdrop click.
- Fix window dragging from page headers and align the desktop launch background with the app's dark theme.
- Fix copying web version information over HTTP on local networks.
- Fix message images failing to scale to the available width.
- Fix duplicate resource entries in desktop bundles.

### Other Updates

- Add regression coverage for page interactions, message rendering, and media loading, along with code rendering performance fixtures.
- Update frontend and Rust dependencies and upgrade the Node.js version used in CI.

## v0.1.4

### 新增与优化

- 新增可展开的消息输入框，支持展开编辑长消息，并提供平滑的展开与收起动画。
- 优化侧边栏、设备列表、搜索框及设置页面的视觉样式，统一浮层与主题选择的交互体验。

### 问题修复

- 修复粘贴图片时图片被自动发送的问题。
- 修复进入或切换会话时，消息列表未能正确滚动到最新消息的问题。
- 修复应用或消息任务重启时的身份冲突，避免消息分发任务启动失败。
- 修复消息处理任务的中间件顺序问题。
- 修复网页端直接访问或刷新子路由时返回 HTTP 404 状态码的问题。

### 其他更新

- 完善前端、桌面端端到端测试及消息投递集成测试。
- 更新前端与 Rust 依赖。

## v0.1.3

### 问题修复

- 修复浏览器 BFCache 导致的页面显示陈旧问题（ae6ecfb）
- 修复了网页端/浏览器环境下系统通知无法正常调用的问题。
