# 部署状态记录 | Deployment Status

本文档记录 Grimoire Web 的部署绑定和最近一次已知状态。线上状态会随
Cloudflare Pages、Supabase 和 DNS 变化而漂移；需要发布或排障时，以 live
CLI/API 检查为准。

## 状态边界

- 最后线上核验: 2026-04-30 Asia/Shanghai
- 最近本地整理: 2026-05-12 Asia/Shanghai
- 当前本地分支: `revive/autonomous-polish-2026-05`
- 本地源码版本: `package.json` 中的 `0.8.0`
- 线上可用性: 本次整理未重新联网核验

## 前端部署

| 项 | 当前记录 |
| --- | --- |
| Cloudflare Pages 项目 | `grimoire-web` |
| Git 绑定 | `Shallow-dusty/grimoire-web` |
| 生产分支 | `main` |
| 构建命令 | `npm run build` |
| 输出目录 | `dist` |
| Pages 域名 | `https://grimoire-web.pages.dev` |
| 自定义域名 | `https://ahri-ai-labdesign.tech` |

历史关键点：

- 2026-04-30: 新建正式仓库 `Shallow-dusty/grimoire-web` 并迁移 Cloudflare Pages 绑定。
- 2026-04-30: 自定义域名 `ahri-ai-labdesign.tech` 迁移到 `grimoire-web` Pages 项目。
- 旧 `game-helper-demo02` Pages 部署只作为迁移兜底和历史来源，不是当前主线。

## 后端与数据

| 项 | 当前记录 |
| --- | --- |
| 后端平台 | Supabase |
| 数据库与实时同步 | PostgreSQL + Realtime |
| Edge Functions | `filter-game-state`, `ask-ai`, `game-operation`, `push-subscription` |
| 前端公开环境变量 | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY` |
| 服务端密钥位置 | Supabase Secrets / Edge Function runtime |

不要把 provider API key、VAPID private key 或 Supabase service role key 写入仓库、文档或
Cloudflare Pages 前端环境变量。AI provider 密钥应只在 Supabase Edge Function 侧读取。

## 本地发布检查

```bash
npm run lint
npx tsc --noEmit
npm run test:src:logic
npm run test:src:ui
npm run test:tests
npm run test:e2e
npm run build
node scripts/pre-deployment-check.js
```

如果只做快速部署前烟测，至少运行：

```bash
npm run build
node scripts/pre-deployment-check.js
npm run test:e2e -- --project=chromium e2e/home.spec.ts
```

## Live 核验命令

```bash
git remote -v
wrangler pages deployment list --project-name=grimoire-web
curl -I https://grimoire-web.pages.dev
curl -I https://ahri-ai-labdesign.tech
```

Supabase 侧需要用 Supabase CLI 或控制台核验项目、迁移和函数部署状态。不要只凭本文件判断生产状态。
