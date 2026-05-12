# 项目结构说明 | Project Structure

本文档记录 Grimoire Web 当前代码线、部署绑定和目录职责，避免再混淆 `game-helper-demo02`、`Grimoire-Aether` 与本地目录名。

## 项目身份

| 项 | 当前结论 |
| --- | --- |
| 产品名 | Grimoire Web / 魔典 |
| 本地目录 | `/home/shallow/04.AI-Prism/02.Grimoire-Aether` |
| 代码血统 | 从 `Shallow-dusty/game-helper-demo02` 克隆并持续演进 |
| 正式 GitHub 仓库 | `Shallow-dusty/grimoire-web` |
| 当前本地 Git remote | `origin -> git@github.com:Shallow-dusty/grimoire-web.git` |
| Cloudflare Pages 项目 | `grimoire-web` |
| Cloudflare Git 绑定 | `Shallow-dusty/grimoire-web` |
| 生产域名 | `https://grimoire-web.pages.dev` |
| 自定义域名 | `https://ahri-ai-labdesign.tech` |
| 当前部署方式 | GitHub push 自动部署；Wrangler 手动部署作为兜底 |
| 归档仓库 | `Shallow-dusty/game-helper-demo02` 与 `Shallow-dusty/Grimoire-Aether` 均已归档 |

项目叙事：

- `game-helper-demo02`: 最早可运行代码线，项目从这里克隆并演进，现作为历史来源归档保留。
- `Grimoire-Aether`: 早期命名尝试，概念更成熟但实现被废弃，归档内容保留在 `docs/aether-archive/` 作为参考。
- `grimoire-web`: 当前正式仓库，承接修复后的生产版本、文档叙事和后续开发。
- `Grimoire Web / 魔典`: 面向用户和活动申请的产品名。

## 顶层目录

```text
.
├── src/                         # React + TypeScript 前端源码
├── backend/                     # 服务端路由/操作草案
├── supabase/                    # 数据库迁移、schema、Edge Functions
├── public/                      # 静态资源，生产环境直接发布
├── blood-on-the-clocktower/     # 规则资料和角色指南
├── tests/                       # 跨模块集成测试
├── e2e/                         # Playwright 端到端测试
├── scripts/                     # 构建、检查、资源处理脚本
├── docs/                        # 项目维护文档
├── .github/                     # GitHub Actions 工作流
├── .codex/                      # 本地自动化技能/测试辅助资料
├── .husky/                      # Git hook 入口
└── .vscode/                     # 推荐编辑器设置
```

生成物和本地缓存不属于项目结构来源。`dist/`, `coverage/`,
`playwright-report/`, `test-results/`, `.wrangler/tmp/`,
`node_modules/.vite/` 和 `node_modules/.vite-temp/` 都已通过 `.gitignore`
或工具约定排除，可用 `npm run clean` 清理。

## `src/` 目录

```text
src/
├── App.tsx                      # 路由级入口和模式切换
├── index.tsx                    # React 挂载、监控、Service Worker 注册
├── index.css                    # Tailwind v4 入口和全局设计变量
├── components/
│   ├── app/                     # StorytellerShell / PlayerShell / GameShell
│   ├── lobby/                   # 首页登录、大厅、房间选择
│   ├── game/                    # 魔典画布、座位、投票、夜晚行动、角色弹窗
│   ├── controls/                # 说书人/玩家控制面板
│   ├── script/                  # 剧本编辑与参考
│   ├── sandbox/                 # 单机沙盒模式
│   ├── history/                 # 历史记录与复盘
│   ├── modals/                  # 跨场景弹窗
│   ├── settings/                # 设置弹窗
│   └── ui/                      # Button/Card/Dialog/Toast 等基础组件
├── store/                       # Zustand 切片和游戏状态操作
├── hooks/                       # 自定义 Hook 和 selector
├── lib/                         # 规则逻辑、状态机、AI/报告/监控工具
├── services/                    # 离线队列、推送通知服务
├── constants/                   # 角色、剧本、音频、游戏配置
├── config/                      # 环境变量读取和运行时校验
├── i18n/                        # zh-CN / en 文案资源
├── assets/                      # 源码内遗留资产；生产图片优先放 public/
├── styles/                      # 样式辅助文件
└── types/                       # TypeScript 类型定义
```

## `supabase/` 目录

```text
supabase/
├── config.toml                   # Supabase CLI 项目配置
├── functions/
│   ├── ask-ai/                   # AI 规则助手服务端入口
│   ├── filter-game-state/        # 按用户过滤游戏状态
│   ├── game-operation/           # 离线操作回放/去重
│   └── push-subscription/        # Web Push 订阅入口
├── migrations/                   # 数据库迁移
└── schema/                       # schema 快照和安全补丁
```

AI provider key、VAPID private key 和 Supabase service role key 不属于前端
环境变量，必须放在 Supabase Secrets / Edge Function runtime。

## 文档组织

主要入口：

- `README.md`: 项目介绍、功能概览、快速开始。
- `docs/DOCUMENTATION_INDEX.md`: 所有项目文档的索引和阅读顺序。
- `docs/PROJECT_STRUCTURE.md`: 当前文件，记录目录结构和仓库/部署关系。
- `docs/ARCHITECTURE.md`: 技术架构、数据流、核心模块。
- `docs/DEPLOYMENT.md`: 生产部署和环境变量。
- `docs/DEPLOYMENT_STATUS.md`: 部署绑定和最近一次已知状态；生产排障时仍需 live 核验。
- `docs/TESTING.md`: 测试策略和命令。
- `CHANGELOG.md`: 版本和维护记录。

规则资料位于 `blood-on-the-clocktower/`，不属于工程实现文档，但对 AI 规则助手、说书人手册和申请材料有参考价值。

## 维护约定

- 不把 `dist/`、`coverage/`、`playwright-report/`、`test-results/` 提交到 Git。
- 清理可再生成产物时运行 `npm run clean`，不要删除 `node_modules/` 或 `.env.local`。
- 生产部署前必须运行 `npm run build` 和 `node scripts/pre-deployment-check.js`，至少跑首页 E2E：`npm run test:e2e -- --project=chromium e2e/home.spec.ts`。
- Tailwind v4 使用 `@import "tailwindcss"; @config "../tailwind.config.ts";`，不要恢复 CDN Tailwind。
- 首页和房间选择是申请材料截图的第一印象，移动端必须保留可滚动布局。
