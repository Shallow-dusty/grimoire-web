# Grimoire Web - 染钟楼谜团线上魔典

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6.svg)](https://www.typescriptlang.org/)

> Grimoire Web 是一个为《染钟楼谜团》(Blood on the Clocktower)
> 设计的现代化说书人助手工具。它支持实时在线多人同步、AI
> 规则助手、智能夜间操作引导，以及自定义剧本导入，旨在提供流畅的线上和线下游戏体验。

---

## 当前状态

| 项 | 状态 |
| --- | --- |
| 版本 | v0.9.1 |
| 产品名 | Grimoire Web / 魔典 |
| 本地目录 | `/home/shallow/04.AI-Prism/02.Grimoire-Aether` |
| GitHub 仓库 | `Shallow-dusty/grimoire-web` |
| 生产环境 | https://grimoire-web.pages.dev |
| 自定义域名 | https://ahri-ai-labdesign.tech |
| 部署方式 | Cloudflare Pages 自动部署 |
| 状态 | ✅ 生产运行中（维护阶段）|

---

## ✨ 核心功能

### 🎮 游戏管理

- **实时同步**: 基于 Supabase
  Realtime，说书人的操作会实时同步给所有连接的玩家（魔典状态、投票、座位信息）
- **连接状态指示**:
  实时显示连接状态（connecting/connected/reconnecting/disconnected）

### 🔐 安全架构 (v0.7.0 NEW!)

- **双重身份系统**:
  - `realRoleId` - 真实身份（仅ST可见，用于游戏逻辑）
  - `seenRoleId` - 展示身份（玩家看到的，支持酒鬼/疯子/魔偶等欺骗机制）
- **原子入座**: 基于数据库事务的并发安全入座机制
- **消息隐私**: 私聊消息仅发送者、接收者和ST可见

### 🎮 游戏辅助

- **智能夜间助手**: 交互式夜间行动面板，引导说书人完成夜间流程
- **结构化信息卡片**: 美观的卡片式信息展示，支持折叠和主题配色
- **可视化投票历史**: 使用CSS/HTML图表展示投票趋势和详细记录
- **主动技能按钮**: 杀手/处女/艺术家等角色可主动发动技能

### 📚 角色规则手册

- **双模式显示**: 模态面板(默认) + 可选侧边栏(桌面端)
- **玩家角色高亮**: 金色Hero Card，2倍大小，脉冲动画
- **完整规则查阅**: 所有角色能力、夜间顺序、阵营信息
- **详细描述模式**: 官方完整规则说明 + 中文翻译（覆盖BMR/SV全部50+角色）

### 🎭 游戏流程优化

- **阶段指示器**: 顶部Banner实时显示当前游戏阶段、第X夜/天、连接状态
- **智能角色分配**:
  - 🎲 自动分配角色（基于Blood on the Clocktower规则）
  - ✅ 统一发放机制（说书人可随时调整）
  - 🎮 一键开始游戏
- **三阶段流程**: ASSIGNING → READY → STARTED

### 🛠️ 说书人工具箱

- **📓 内置笔记本**: 游戏中随时记录关键信息
- **🤖 虚拟玩家生成**: 填补空位用于测试
- **📊 板子参考**: 4种配置策略建议，角色强度分级
- **📄 技能描述模式**: 简略/详细切换
- **❓ 操作指引**: 快捷键和使用提示

### 📱 移动端优化 (v0.7.0 Enhanced!)

- **长按交互**: 说书人长按座位500ms弹出上下文菜单
- **触觉反馈**: 长按时触发振动反馈
- **魔典锁定**: 防止误触操作

### 🧪 沙盒模式 (v0.7.5 NEW!)

- **离线练习**: 无需网络连接，本地运行完整游戏逻辑
- **说书人训练**: 熟悉夜间流程、角色分配、投票操作
- **剧本测试**: 快速测试不同剧本配置
- **新手友好**: 无压力环境下学习游戏规则

### 🤖 AI 增强

- **多模型支持**: 集成 **DeepSeek R1 系列**、**MiniMax M2**、**Kimi K2
  Thinking** 等 6+ 先进大模型
- **智能规则助手**: 随时解答规则疑问、生成台词、提供判例建议
- **思维可视化**: DeepSeek R1 思维过程可折叠展示，提升透明度
- **私密对话**: AI 回复仅说书人可见，保护游戏信息安全

---

## 🛠️ 技术栈

| 类别            | 技术                                   |
| --------------- | -------------------------------------- |
| **前端框架**    | React 18, TypeScript 5.8 (strict mode) |
| **构建工具**    | Vite 6                                 |
| **样式**        | Tailwind CSS + Vanilla CSS             |
| **状态管理**    | Zustand + immer                        |
| **画布渲染**    | react-konva                            |
| **后端/数据库** | Supabase (PostgreSQL + Realtime + RPC) |
| **AI 集成**     | Supabase Edge Function + 兼容多模型网关 |
| **可视化**      | CSS/HTML                               |
| **测试**        | Vitest                                 |
| **代码质量**    | ESLint 9 + Husky + lint-staged         |

---

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/Shallow-dusty/grimoire-web.git
cd grimoire-web
```

> 旧 `game-helper-demo02` 仓库只作为历史代码血统保留；新开发以 `grimoire-web` 为准。

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

创建 `.env.local` 文件并填入以下密钥：

```env
# Supabase Configuration (必需)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Providers (可选 - 根据需要配置)
# AI API Keys are now stored server-side in Supabase Edge Function Secrets.
# No frontend AI keys needed.
```

> 💡 **提示**:
>
> - Supabase 请访问 [supabase.com](https://supabase.com/) 创建项目
> - AI 密钥可从对应服务商官网获取

### 4. 数据库初始化

在 Supabase 项目中执行 `supabase/migrations/supabase_migration.sql` 中的 SQL 创建必要的表结构：

- `game_rooms` - 游戏房间数据
- `seat_secrets` - 座位敏感信息（仅ST可见）
- `game_messages` - 游戏消息
- `claim_seat()` / `leave_seat()` - 原子入座/离座 RPC 函数

### 5. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000` 即可开始使用。

---

## 📖 功能速查

### 说书人操作指南

| 功能           | 位置                   | 说明                         |
| -------------- | ---------------------- | ---------------------------- |
| **切换阶段**   | Controls → Phase       | 白天/夜间/投票/结束          |
| **分配角色**   | Grimoire → 右键座位    | 分配角色、状态标记、双重身份 |
| **移动端操作** | Grimoire → 长按座位    | 500ms长按弹出菜单            |
| **夜间助手**   | Controls → Night Order | 点击「🌙 执行夜间动作」      |
| **AI 咨询**    | Controls → AI Tab      | 输入问题获取规则建议         |
| **描述模式**   | Controls → 设置        | 切换简略/详细描述            |

### 玩家操作指南

| 功能         | 位置                | 说明                        |
| ------------ | ------------------- | --------------------------- |
| **加入房间** | 主页 → 输入房间号   | 连接到说书人创建的房间      |
| **查看魔典** | 魔典面板            | 查看座位信息和自己的角色    |
| **使用技能** | Controls → 角色卡   | 点击技能按钮（杀手/处女等） |
| **私聊**     | 聊天框 → 选择接收人 | 需说书人允许悄悄话          |
| **投票**     | 投票阶段            | 举手/投票按钮               |

---

## 🆕 最新更新

### v0.9.1 (2026-06-20)

**安全加固**
- 修复玩家座位交换请求的权限验证逻辑
- 新增请求去重机制，防止重复点击导致垃圾请求
- 强化交换响应授权检查，仅目标玩家或说书人可操作
- 新增过期请求检测，防止玩家移动后应用过时操作

### v0.9.0 (2026-06-08)

**生产发布与安全加固**
- 增强 Cloudflare Pages 安全头配置（CSP、HSTS、缓存策略）
- Sentry 监控脱敏，默认关闭 PII 并清理敏感字段
- Supabase RPC/RLS 权限策略加固
- Edge Functions CORS 限制与认证增强

**本地化与资源优化**
- 完成 UI 文案国际化清理（zh-CN/en）
- 哥特纹理本地化至 `public/textures/`
- 减少外部依赖，提升加载稳定性

**游戏规则与同步修复**
- 修正胜负判定、投票边界、阶段转换逻辑
- 增强离线同步韧性，保留聊天记录
- 优化座位交换应用逻辑

查看完整更新日志：[CHANGELOG.md](./CHANGELOG.md)

---

## 📚 文档资源

### 用户文档
- [魔典使用指南](./USER_GUIDE.md) - 玩家和说书人快速上手教程
- [说书人完整手册](./STORYTELLER_MANUAL.md) - 详尽的功能说明和最佳实践

### 开发文档
- [文档索引](./docs/DOCUMENTATION_INDEX.md) - 所有项目文档和阅读顺序
- [项目结构说明](./docs/PROJECT_STRUCTURE.md) - 仓库关系、部署绑定、目录职责
- [项目架构](./docs/ARCHITECTURE.md) - 技术架构、目录结构、数据流
- [部署指南](./docs/DEPLOYMENT.md) - Cloudflare Pages + Supabase 部署
- [部署状态记录](./docs/DEPLOYMENT_STATUS.md) - 当前部署绑定和 live 核验入口
- [测试指南](./docs/TESTING.md) - 测试策略、运行方法、覆盖率
- [贡献指南](./docs/CONTRIBUTING.md) - 代码规范、PR 流程

### 其他
- [更新日志](./CHANGELOG.md) - 版本历史记录

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

详细的贡献流程请参阅 [贡献指南](./docs/CONTRIBUTING.md)。

---

## 📄 许可证

本项目采用 MIT License - 详见 [LICENSE](./LICENSE) 文件

---

## 🙏 致谢

- [Blood on the Clocktower](https://bloodontheclocktower.com/) - 原版桌游
- [Supabase](https://supabase.com/) - 后端服务
- [DeepSeek](https://www.deepseek.com/) /
  [Moonshot AI](https://www.moonshot.cn/) /
  [SiliconFlow](https://siliconflow.cn/) - AI 服务支持

---

<p align="center">Made with ❤️ for the Blood on the Clocktower community</p>
