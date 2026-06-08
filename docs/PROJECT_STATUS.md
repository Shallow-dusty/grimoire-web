# 项目状态快照 | Project Status Snapshot

> Snapshot: 2026-06-08 Asia/Shanghai
> Scope: local checkout `revive/autonomous-polish-2026-05` in `/home/shallow/04.AI-Prism/02.Grimoire-Aether`.
> Refresh policy: this is a mutable state snapshot. Before push, deploy, or release decisions, re-run the commands in the validation and deployment sections.

## 当前结论

- 本地 checkout 已完成 2026-06-08 release-hardening 整理，核心质量门禁通过。
- 工作区在写入本快照前为 clean；本快照应作为独立文档提交。
- 当前本地源码版本为 `grimoire-web@0.9.0`。
- 当前分支仍未推送全部本地提交：写入本快照前，`revive/autonomous-polish-2026-05` 领先 `origin/revive/autonomous-polish-2026-05` 37 个提交。
- 线上站点可访问，但仍是旧构建：`https://grimoire-web.pages.dev` 与 `https://ahri-ai-labdesign.tech` 均返回 HTTP 200，线上 HTML 仍为 `<html lang="en">`；本地 `index.html` 已是 `<html lang="zh-CN">`。

## 本地验证状态

本快照期间重新运行并通过：

```bash
npm run lint
npx tsc --noEmit
npm run build
node scripts/pre-deployment-check.js
```

结果：

- `npm run lint`: pass
- `npx tsc --noEmit`: pass
- `npm run build`: pass
- `node scripts/pre-deployment-check.js`: 43/43 pass
- `npm run build` 仍输出 Browserslist/caniuse-lite 数据过期提示；这是非失败告警，若要清零构建告警，可运行 `npx update-browserslist-db@latest` 后重新跑 build/pre-deploy。

同日已记录的完整 gate 见 `docs/RELEASE_READINESS.md` 和 `docs/TESTING.md`：

- `npm run test:src:logic`: pass
- `npm run test:src:ui`: pass
- `npm run test:tests`: 118 个 Vitest 文件 / 2,237 个用例通过
- 默认 `npm run test:e2e`: 44 passed / 1 skipped，修复 `e2e/home.spec.ts` 后无 flaky

## 开发进度

已完成并拆分为高粒度提交的主线工作：

- 文档状态与 release gate 记录刷新。
- Web 发布面整理：HTML meta/a11y、Cloudflare headers/cache、manifest 文案、Vite production cleanup。
- Sentry/monitoring 敏感信息清理。
- Supabase Edge Functions CORS/Auth/rate-limit hardening。
- 数据库 seat/v2 RPC 与 room member policy 安全迁移。
- 哥特纹理等本地资源纳入仓库。
- i18n、UI 文案和 locale 清理。
- sync/offline queue/chat state 修复。
- game rules、phase/voting、seat swap、临时 UI timer/nickname 边界修复。
- E2E room-selection shortcut flow 稳定化。

剩余项：

- 推送当前分支或打开/更新 PR。
- 将当前 checkout 发布到 Cloudflare Pages 后，再复核线上 HTML、PWA manifest、headers 和 Supabase 函数状态。
- 如需零告警构建，刷新 Browserslist 数据库并提交锁文件变化。
- WebKit/Mobile Safari 仍是可选矩阵，依赖宿主机 Playwright WebKit 系统依赖。

## 文档状态

- 当前文档入口为 `docs/DOCUMENTATION_INDEX.md`。
- 当前状态类文档：
  - `docs/PROJECT_STATUS.md`: 本快照，覆盖项目状态、进度、Git 和验证边界。
  - `docs/DEPLOYMENT_STATUS.md`: Cloudflare/Supabase 绑定与线上/本地部署边界。
  - `docs/RELEASE_READINESS.md`: release checklist 与最近完整 gate 记录。
  - `docs/TESTING.md`: 测试矩阵、命令和最近测试计数。
- `docs/DEPLOYMENT.md` 是生产部署主文档；`docs/DEPLOYMENT_GUIDE_v0.9.0.md` 是 v0.9.0 checklist wrapper。
- `docs/analysis/*` 中仍保留历史 v0.8.0/路线图指标，索引已标记为归档/旧分析，不应作为当前状态来源。

## Git 状态

写入本快照前的 live 状态：

```bash
git status --short --branch
# ## revive/autonomous-polish-2026-05...origin/revive/autonomous-polish-2026-05 [ahead 37]

git rev-list --count origin/revive/autonomous-polish-2026-05..HEAD
# 37

git rev-list --count origin/main..HEAD
# 54

git diff --shortstat origin/revive/autonomous-polish-2026-05..HEAD
# 123 files changed, 3330 insertions(+), 882 deletions(-)
```

最近提交边界：

- `823a2fd docs: record full local release gate`
- `dfab82a test(e2e): stabilize room selection shortcut flow`
- `79ae73c fix(ui): clear transient timers and bound nickname input`
- `6f18a45 fix(seats): apply accepted swap requests`
- `a1d1337 fix(game-flow): correct phase queue and voting edges`

后续提交本快照后，分支会再增加 1 个未推送提交。
