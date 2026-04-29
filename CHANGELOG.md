# Changelog

本文件记录 Grimoire Web 的重要维护记录。项目遵循简化的 Conventional Commits 风格。

## Unreleased

### Fixed

- 恢复生产环境 Tailwind CSS 生成，修复首页按钮、输入框、间距和布局样式丢失的问题。
- 收窄全局 CSS reset，避免覆盖 Tailwind 工具类的 margin/padding。
- 调整移动端大厅布局，允许小屏纵向滚动，避免首屏内容被裁切。

### Documentation

- 新增项目结构说明和文档索引。
- 更新当前仓库血统、Cloudflare Pages 绑定和手动部署状态。
- 统一项目叙事：`game-helper-demo02` 为历史代码血统，废弃 `Grimoire-Aether` 保留为归档参考，`grimoire-web` 为正式仓库。

## 0.8.0

### Added

- 哥特式 UI 风格、大厅音频、沙盒模式和多项沉浸式交互。
- AI 规则助手、夜间流程辅助、角色规则手册和复盘能力。

### Changed

- 拆分说书人/玩家界面外壳。
- 引入更细粒度的 Zustand selector 和 XState 阶段管理。

### Fixed

- 修复多项房间同步、投票流程、移动端交互和生产资源路径问题。
