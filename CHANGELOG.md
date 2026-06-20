# Changelog

本文件记录 Grimoire Web 的重要维护记录。项目遵循简化的 Conventional Commits 风格。

## [0.9.1] - 2026-06-20

### Fixed

- 加固玩家座位交换请求权限验证，修复玩家无法发起合法交换请求的问题
- 新增座位交换请求去重逻辑，防止重复点击导致请求堆积
- 强化交换响应授权检查，确保仅目标玩家或说书人可响应请求
- 新增过期请求检测，防止玩家移动后应用过时的交换操作

### Documentation

- 更新项目状态至 2026-06-20，记录 v0.9.0 上线后的维护阶段
- 完善部署状态记录，标注 Supabase 后端 INACTIVE 状态
- 整理归档策略，明确历史文档与当前状态的边界

## [0.9.0] - 2026-06-08

### Fixed

- 恢复生产环境 Tailwind CSS 生成，修复首页按钮、输入框、间距和布局样式丢失的问题
- 收窄全局 CSS reset，避免覆盖 Tailwind 工具类的 margin/padding
- 调整移动端大厅布局，允许小屏纵向滚动，避免首屏内容被裁切
- 修复自定义脚本导入后角色定义未进入选择、参考和自动分配流程的问题

### Security

- 加固 Supabase RPC 权限策略，收紧 seat 相关 RPC 函数的身份校验
- 限制 Edge Functions CORS 策略，增强 AI 请求认证
- Sentry 监控脱敏，默认关闭 PII 并清理 token/secret/session 等敏感字段

### Documentation

- 将部署状态记录从 `.claude/` 移入 `docs/DEPLOYMENT_STATUS.md`，明确 live 核验边界
- 将旧战略路线图归档到 `docs/analysis/`，避免旧覆盖率和旧部署绑定混入当前状态
- 同步测试指南、项目结构、PWA 和性能文档的当前目录与验证边界
- 新增项目结构说明和文档索引
- 更新当前仓库血统、Cloudflare Pages 绑定和手动部署状态
- 统一项目叙事：`game-helper-demo02` 为历史代码血统，废弃 `Grimoire-Aether` 保留为归档参考，`grimoire-web` 为正式仓库

### Chores

- 新增 `npm run clean` 用于清理 `dist/`、`coverage/`、Playwright 报告和本地构建缓存
- 新增生产安全头配置（CSP、HSTS、缓存策略）
- 本地化哥特纹理资源至 `public/textures/`

## 0.8.0

### Added

- 哥特式 UI 风格、大厅音频、沙盒模式和多项沉浸式交互。
- AI 规则助手、夜间流程辅助、角色规则手册和复盘能力。

### Changed

- 拆分说书人/玩家界面外壳。
- 引入更细粒度的 Zustand selector 和 XState 阶段管理。

### Fixed

- 修复多项房间同步、投票流程、移动端交互和生产资源路径问题。
