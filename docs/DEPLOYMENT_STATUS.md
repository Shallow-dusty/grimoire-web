# 部署状态记录 | Deployment Status

本文档记录 Grimoire Web 的部署绑定和最近一次已知状态。线上状态会随
Cloudflare Pages、Supabase 和 DNS 变化而漂移；需要发布或排障时，以 live
CLI/API 检查为准。

## 状态边界

- 最后线上核验: 2026-06-08 Asia/Shanghai
- 最近本地整理: 2026-06-08 Asia/Shanghai
- 当前发布分支: `main`
- 本地源码版本: `package.json` 中的 `0.9.0`
- 线上可用性: `https://grimoire-web.pages.dev` 和 `https://ahri-ai-labdesign.tech` 均返回 HTTP 200
- 前端发布状态: PR #1 已合并到 `main`，merge commit `4b0e540`; GitHub Actions 和 Cloudflare Pages checks 均通过，两个生产域名均返回 `<html lang="zh-CN">`。
- 后端发布状态: 生产前端当前指向 Supabase ref `bxolwtynphjlmlmqsghk`，但该项目状态为 `INACTIVE`; Edge Function endpoint 返回 `Project paused`，Management API restore 返回 `Project has been paused for more than 90 days and cannot be restored.` 因此当前 Supabase migration/functions 不能发布到这个既有项目。

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
| 生产 Supabase ref | `bxolwtynphjlmlmqsghk` (`Game-Helper`) |
| 生产 Supabase 状态 | `INACTIVE`; paused 超过 90 天，Management API restore 拒绝恢复 |
| 数据库与实时同步 | PostgreSQL + Realtime |
| Edge Functions | `filter-game-state`, `ask-ai`, `game-operation`, `push-subscription` |
| 前端公开环境变量 | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY` |
| 服务端密钥位置 | Supabase Secrets / Edge Function runtime |

不要把 provider API key、VAPID private key 或 Supabase service role key 写入仓库、文档或
Cloudflare Pages 前端环境变量。AI provider 密钥应只在 Supabase Edge Function 侧读取。

当前恢复/发布阻塞：

- `supabase functions deploy filter-game-state --project-ref bxolwtynphjlmlmqsghk` 在打包后失败，因为项目 service 为 `INACTIVE`。
- `supabase migration list --linked` 在项目暂停状态下无法创建远端登录角色；本机也没有 `SUPABASE_DB_PASSWORD`。
- 继续发布后端需要新建/迁移 Supabase 生产项目，或在 Supabase 控制台/支持侧恢复可用项目，然后重新配置 Cloudflare Pages 环境变量、Supabase secrets、migration 和 Edge Functions。

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
curl -L https://grimoire-web.pages.dev | rg '<html'
```

Supabase 侧需要用 Supabase CLI 或控制台核验项目、迁移和函数部署状态。不要只凭本文件判断生产状态。
