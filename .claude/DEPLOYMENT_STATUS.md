# 🚀 部署状态记录 - 血染钟楼魔典 v0.9.0

**最后检查**: 2026-04-30 Asia/Shanghai
**整体状态**: ✅ **已部署运行中**

---

## 架构

```
用户浏览器
    ↓ HTTPS
Cloudflare Pages (前端 React)
    ↓
Supabase (后端 + 数据库)
```

---

## 前端: Cloudflare Pages ✅

| 项 | 状态 | 详情 |
|----|------|------|
| 项目名 | ✅ | `grimoire-web` |
| 主域名 | ✅ | `grimoire-web.pages.dev` |
| 自定域 | ✅ | `ahri-ai-labdesign.tech` |
| Git 集成 | ✅ | Cloudflare 绑定 `Shallow-dusty/grimoire-web`，main 分支自动部署 |
| 最后部署 | ✅ | `745e0353-4af4-49a0-b1c4-c67d6f08421b` |
| 最新部署消息 | ✅ | `fix: restore Tailwind styling and mobile lobby layout` |
| 构建工具 | ✅ | Vite 6.4.1 |

**最近关键部署**:
- `grimoire-web` 项目由 `Shallow-dusty/grimoire-web` 的 `main` 分支自动部署
- `745e0353` ✅ 旧 `game-helper-demo02` 项目中的手动兜底部署，修复 Tailwind 生产样式和移动端大厅布局
- `4304c62a` ✅ 旧项目中部署前的首屏问题版本

---

## PWA 配置 ✅

| 项 | 状态 | 文件 |
|----|------|------|
| Manifest | ✅ | `dist/manifest.json` |
| Service Worker | ✅ | `dist/service-worker.js` |
| Icons (6) | ✅ | `public/img/icon-*.png` |
| Maskable | ✅ | `icon-192-maskable.png` |
| App Shortcuts | ✅ | 创建房间、加入房间 |

**缓存策略**:
- 静态资源: cache-first (7 days)
- 动态内容: network-first
- 旧缓存: 自动清理

---

## 后端: Supabase ✅

| 项 | 状态 | 配置 |
|----|------|------|
| Supabase URL | ✅ | `bxolwtynphjlmlmqsghk.supabase.co` |
| API Key | ✅ | `.env.local` 已配置 |
| PostgreSQL | ✅ | 已连接 |
| Realtime | ✅ | 实时同步已启用 |

**环境变量** (`.env.local`):
```
✅ VITE_SUPABASE_URL
✅ VITE_SUPABASE_ANON_KEY
✅ VITE_VAPID_PUBLIC_KEY
✅ VAPID_PRIVATE_KEY
```

---

## 可选功能 (未启用)

### Edge Function - 服务端数据过滤
```
代码位置: supabase/functions/filter-game-state/index.ts
文件大小: 6.6 KB
状态: 🔘 可选 (代码已就绪，按需部署)

用途: 安全增强 - 防止技术用户通过 DevTools 查看他人角色
当前: 使用客户端过滤，功能正常，适合私人/朋友间使用
如需启用:
1. 登录 https://app.supabase.com
2. 选项目 → Functions → Create new
3. 复制粘贴代码并 Deploy
4. 修改前端代码调用 Edge Function
```

---

## 快速检查命令

```bash
# 重新构建检查
npm run build

# 验证部署
wrangler pages deployment list --project-name=grimoire-web

# 检查文件完整性
node scripts/pre-deployment-check.js

# 本地预览
npm run preview
```

---

## 关键 URL

| 服务 | 链接 |
|------|------|
| 生产环境 | https://grimoire-web.pages.dev |
| 自定域 | https://ahri-ai-labdesign.tech |
| Cloudflare 控制台 | https://dash.cloudflare.com (project: grimoire-web) |
| Supabase 控制台 | https://app.supabase.com (project: bxolwtynphjlmlmqsghk) |
| GitHub 绑定 | `Shallow-dusty/grimoire-web` |
| 当前代码关系 | 见 `docs/PROJECT_STRUCTURE.md` |

---

## 版本信息

- **项目版本**: v0.9.0
- **Node 版本**: v24.12.0
- **Vite**: 6.4.1
- **React**: 18.3.1
- **Supabase**: 2.84.0
- **Wrangler**: 4.58.0

---

## 更新记录

| 日期 | 操作 | 状态 |
|------|------|------|
| 2026-04-30 | 修复生产首屏样式并重新部署 (`745e0353`) | ✅ 完成 |
| 2026-04-30 | 梳理仓库血统、部署绑定、项目结构文档 | ✅ 完成 |
| 2026-04-30 | 新建正式仓库 `Shallow-dusty/grimoire-web` 并迁移 remote/Cloudflare 绑定 | ✅ 完成 |
| 2026-01-10 | CLI 部署状态检查 | ✅ 完成 |
| 2026-01-10 | 生成部署文档 (9份) | ✅ 完成 |
| 2026-01-10 | PWA 图标生成 (12 张) | ✅ 完成 |
| 2026-01-10 | Edge Function 代码完成 | ✅ 完成 |
| 2026-01-10 | 28 项部署检查 | ✅ 全通过 |

---

## 下次检查清单

当需要重新验证部署时，按此顺序检查：

- [ ] `npm run build` - 确保构建无误
- [ ] `wrangler pages deployment list` - 验证最新部署时间
- [ ] `curl -I https://grimoire-web.pages.dev` - 检查站点在线 (仅在有网络时)
- [ ] 检查 `.env.local` VAPID 密钥未过期
- [ ] 如果部署超过 1 个月未更新，提醒用户推送代码更新

---

**注**: 此文件由 Claude Code 自动维护，记录最后检查时间和结果。  
如部署信息有变化，请更新此文件以保持准确性。
