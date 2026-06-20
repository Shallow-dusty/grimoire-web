# 项目状态快照 | Project Status Snapshot

> Snapshot: 2026-06-20 Asia/Shanghai
> Scope: local checkout in `/home/shallow/04.AI-Prism/02.Grimoire-Aether`.
> Refresh policy: this is a mutable state snapshot. Before push, deploy, or release decisions, re-run the commands in the validation and deployment sections.

## 当前结论

- 项目已进入 **v0.9.1 维护阶段**，功能完整度达 95%，已投产运行。
- 当前本地源码版本：`grimoire-web@0.9.1`（待更新 package.json）。
- 生产环境运行正常：`https://grimoire-web.pages.dev` 和 `https://ahri-ai-labdesign.tech`。
- 本地领先远程 1 个 commit（`123d08f` - 座位交换加固），待推送。
- 测试状态：587 单元测试 + 97 集成测试通过，覆盖率 84.36%。
- **Supabase 后端阻塞**：生产项目 `bxolwtynphjlmlmqsghk` 状态为 `INACTIVE`（暂停超过 90 天），无法部署 Edge Functions 和数据库迁移。

## 本地验证状态

最近一次完整验证（2026-06-20）：

```bash
npm run lint          # ✅ Pass
npx tsc --noEmit      # ✅ Pass
npm run test          # ✅ 684 tests passed
npm run build         # ✅ Pass
```

测试覆盖：
- 单元测试：587 个用例通过（23 个测试文件）
- 集成测试：97 个用例通过
- E2E 测试：44 passed / 1 skipped（Chromium + Firefox + Mobile Chrome）
- 覆盖率：84.36% 语句、87.32% 函数

完整质量门禁见 `docs/RELEASE_READINESS.md` 和 `docs/TESTING.md`。

## 开发进度

### 已完成（v0.9.0 - 2026-06-08 上线）

核心功能与上线加固（已拆分为高粒度提交）：
- ✅ 安全加固：Supabase RPC/RLS、Edge Functions CORS/Auth、Sentry 脱敏
- ✅ 国际化：UI 文案清理、zh-CN/en locale 补全
- ✅ 资源优化：哥特纹理本地化、生产元数据头配置
- ✅ 游戏规则修复：胜负判定、投票边界、座位交换、阶段转换
- ✅ 离线同步韧性：聊天保留、操作队列去重
- ✅ E2E 稳定化：房间选择流程、沙盒测试覆盖
- ✅ 文档整理：部署状态、项目结构、发布清单

### 最近更新（v0.9.1 - 2026-06-20）

- ✅ 座位交换权限加固（`123d08f`）：
  - 修复玩家无法发起合法交换请求的权限检查 bug
  - 新增请求去重逻辑，防止重复点击导致垃圾请求
  - 强化响应授权验证，确保仅目标玩家或说书人可操作
  - 新增过期请求检测，防止玩家移动后应用过时操作

### 当前状态

**项目定性**：功能完整（95%），已投产运行，进入维护阶段。

**剩余工作**：
- ⚠️ Supabase 后端恢复（阻塞项）：需新建/迁移可用项目，或联系 Supabase 支持
- 📈 可选优化：测试覆盖率提升至 90%+（当前 84.36%）
- 🔍 用户反馈驱动的 bug 修复与功能微调

## Git 状态

当前分支：`main`

本地领先远程：1 个 commit
- `123d08f` - fix: harden player seat swap requests (2026-06-14)

最近主要提交：
- `0b23ea2` - docs: record production publish status
- `4b0e540` - Merge pull request #1 (v0.9.0 上线 PR)
- `d845ead` - docs: add project status snapshot

清洁状态：无未提交变更，工作区干净。
## 文档状态

文档入口：`docs/DOCUMENTATION_INDEX.md`

核心文档：
- `docs/PROJECT_STATUS.md`（本文档）- 项目状态快照
- `docs/DEPLOYMENT_STATUS.md` - 部署绑定与后端状态
- `docs/RELEASE_READINESS.md` - 发布清单
- `docs/TESTING.md` - 测试矩阵与命令
- `docs/ARCHITECTURE.md` - 技术架构
- `docs/PROJECT_STRUCTURE.md` - 仓库关系与目录职责

归档文档：
- `docs/analysis/` - 历史分析报告（2026-01-10，v0.8.0 时期，仅供参考）
- `docs/aether-archive/` - 早期 Grimoire-Aether 相关文档

## 文档状态

文档入口：`docs/DOCUMENTATION_INDEX.md`

核心文档：
- `docs/PROJECT_STATUS.md`（本文档）- 项目状态快照
- `docs/DEPLOYMENT_STATUS.md` - 部署绑定与后端状态
- `docs/RELEASE_READINESS.md` - 发布清单
- `docs/TESTING.md` - 测试矩阵与命令
- `docs/ARCHITECTURE.md` - 技术架构
- `docs/PROJECT_STRUCTURE.md` - 仓库关系与目录职责

归档文档：
- `docs/analysis/` - 历史分析报告（2026-01-10，v0.8.0 时期，仅供参考）
- `docs/aether-archive/` - 早期 Grimoire-Aether 相关文档
