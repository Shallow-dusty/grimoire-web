# 验收标准清单

> 本文档提供所有 Phase 的统一验收标准和检查清单

---

## 📋 验收流程

### 任务级验收（每个 Task）

完成任务后，执行以下检查：

```bash
# 1. 代码检查
npm run lint                    # 无警告
npx tsc --noEmit               # 无类型错误

# 2. 测试检查
npm run test                    # 所有测试通过
npm run test:coverage           # 覆盖率达标

# 3. 构建检查
npm run build                   # 构建成功
du -sh dist/                    # Bundle 体积检查

# 4. E2E 检查（如果适用）
npm run test:e2e -- <spec>     # E2E 测试通过

# 5. 视觉检查（如果适用）
npm run dev                     # 手工浏览验证
```

### Phase 级验收

完成 Phase 后，执行以下检查：

```bash
# 1. 运行完整测试套件
npm run test:src:logic
npm run test:src:ui
npm run test:tests
npm run test:e2e

# 2. 生成覆盖率报告
npm run test:coverage
# 检查 coverage/lcov-report/index.html

# 3. 部署到 staging
npm run build
# 部署并手工测试

# 4. 更新文档
# 确保所有文档同步更新
```

---

## ✅ Phase 1 验收清单

### 1.1 Playwright 视觉回归测试

**代码交付**：
- [ ] `e2e/visual/lobby-visual.spec.ts` 存在且通过
- [ ] `e2e/visual/grimoire-visual.spec.ts` 存在且通过
- [ ] `e2e/visual/controls-visual.spec.ts` 存在且通过
- [ ] `e2e/visual/voting-visual.spec.ts` 存在且通过
- [ ] `e2e/visual/night-visual.spec.ts` 存在且通过
- [ ] `e2e/visual/interaction-zones.spec.ts` 存在且通过

**功能验收**：
- [ ] 至少 50 个视觉快照测试
- [ ] 跨浏览器测试通过（Chromium + Firefox + Mobile Chrome）
- [ ] CI 集成完成（GitHub Actions 或本地 hook）
- [ ] 快照基线提交到 git

**质量验收**：
```bash
# 运行视觉测试
npm run test:e2e -- e2e/visual/

# 期望输出
# ✅ 50+ passed
# ❌ 0 failed
```

---

### 1.2 UI 图像资源重绘

**资源交付**：
- [ ] `public/img/game/seat-node-default.png` 存在
- [ ] `public/img/game/seat-node-selected.png` 存在
- [ ] `public/img/game/seat-node-dead.png` 存在
- [ ] `public/img/game/seat-node-poisoned.png` 存在
- [ ] `public/img/game/seat-node-drunk.png` 存在
- [ ] `public/img/game/role-card-template.png` 存在
- [ ] `public/img/game/vote-button-yes.png` 存在
- [ ] `public/img/game/vote-button-no.png` 存在
- [ ] `public/img/game/phase-icon-night.png` 存在
- [ ] `public/img/game/phase-icon-day.png` 存在
- [ ] `public/img/game/phase-icon-voting.png` 存在
- [ ] `public/img/backgrounds/grimoire-bg-v2.png` 存在
- [ ] `public/img/backgrounds/lobby-bg-v2.png` 存在

**质量验收**：
```bash
# 检查图像尺寸
file public/img/game/*.png

# 检查文件大小（每个 < 200KB）
du -h public/img/game/*.png | awk '{if($1 > "200K") print "❌", $0; else print "✅", $0}'

# 检查 2x Retina 版本
ls public/img/game/*@2x.png
```

**文档交付**：
- [ ] `docs/design-system.md` 存在
- [ ] 设计系统文档包含色彩规范
- [ ] 设计系统文档包含字体规范
- [ ] 设计系统文档包含图像使用指南

---

### 1.3 UI Bug 修复与验证

**文档交付**：
- [ ] `docs/ui-audit-report.md` 存在
- [ ] UI 审计报告列出所有发现的问题
- [ ] UI 审计报告标记优先级（P0/P1/P2）

**代码交付**：
- [ ] `src/utils/debugOverlay.ts` 存在（开发环境 Debug 工具）
- [ ] 所有 P0 问题修复完成
- [ ] 所有 P1 问题修复完成（或记录延期原因）

**功能验收**：
- [ ] 座位节点点击热区准确（视觉测试验证）
- [ ] 说书人菜单触发区域正确（视觉测试验证）
- [ ] 投票按钮响应区域正确（视觉测试验证）
- [ ] Hover 状态正常（无闪烁、无延迟）
- [ ] Z-index 层叠正确（模态框不被遮挡）
- [ ] 动画流畅（无卡顿）

**质量验收**：
```bash
# 运行交互验证测试
npm run test:e2e -- e2e/visual/interaction-zones.spec.ts

# 期望输出
# ✅ All interaction zones validated
```

---

### Phase 1 总体验收

**代码质量**：
- [ ] `npm run lint` 通过，无警告
- [ ] `npx tsc --noEmit` 通过，无类型错误
- [ ] 测试覆盖率 ≥ 87%

**功能完整性**：
- [ ] 70+ 自动化测试通过（视觉测试 50+ + 交互测试 20+）
- [ ] 20+ 高质量图像资源
- [ ] UI 审计报告记录的所有 P0/P1 问题修复

**部署就绪**：
- [ ] `npm run build` 成功
- [ ] Staging 环境部署成功
- [ ] 手工测试通过（大厅、魔典、投票、夜间流程）

**文档完整**：
- [ ] UI 审计报告完成
- [ ] 设计系统文档完成
- [ ] 所有新测试有注释

---

## ✅ Phase 2 验收清单

### 2.1 剧本扩展系统

**代码交付**：
- [ ] `src/constants/scripts/experimental/` 目录存在
- [ ] 至少 5 个新剧本定义文件
- [ ] `src/components/script/ScriptSelector.tsx` 更新（支持筛选）

**功能验收**：
- [ ] 剧本选择 UI 可以筛选（官方/实验性/社区）
- [ ] 剧本卡片显示难度标记
- [ ] 自定义剧本 JSON 导入校验正常
- [ ] 剧本分享码生成/解析正常

**质量验收**：
- [ ] 每个新剧本有单元测试
- [ ] 角色能力自动化正确
- [ ] 夜间顺序准确

---

### 2.2 游戏回放与分析

**代码交付**：
- [ ] `src/store/slices/replay.ts` 存在
- [ ] `src/components/replay/ReplayPlayer.tsx` 存在
- [ ] `src/components/replay/StatisticsPanel.tsx` 存在

**功能验收**：
- [ ] 游戏事件自动录制
- [ ] 回放播放器控制正常（播放/暂停/快进）
- [ ] 时间轴跳转正常
- [ ] 个人统计页面显示正确
- [ ] LocalStorage 存储正常（最近 10 场）

**质量验收**：
```bash
# 测试回放系统
npm run test -- replay.test.ts

# 检查存储大小（每场 < 50KB）
# 在浏览器 DevTools Console 执行：
# localStorage.getItem('gameReplays')
```

---

### 2.3 社交功能

**代码交付**：
- [ ] `src/components/profile/UserProfile.tsx` 存在
- [ ] `src/components/lobby/RoomHistory.tsx` 存在

**功能验收**：
- [ ] 房间历史记录显示正确
- [ ] 房间收藏功能正常
- [ ] 个人主页显示统计数据
- [ ] 分享链接生成正常
- [ ] QR 码生成正常

---

### Phase 2 总体验收

**功能完整性**：
- [ ] 5+ 新剧本可选
- [ ] 回放系统可用
- [ ] 社交功能上线

**性能验收**：
- [ ] 回放播放流畅（不卡顿）
- [ ] 统计计算快速（< 100ms）

**版本标记**：
- [ ] `package.json` 版本号更新为 `1.0.0`
- [ ] `CHANGELOG.md` 记录 Phase 2 功能

---

## ✅ Phase 3 验收清单

### 3.1 性能优化

**Bundle 体积**：
```bash
npm run build
du -sh dist/assets/*.js

# 期望输出
# ✅ Total < 800KB
```

**性能指标**：
```bash
# 使用 Lighthouse 测试
npx lighthouse http://localhost:3000 --view

# 期望指标：
# ✅ FCP < 1s
# ✅ LCP < 2.5s
# ✅ TBT < 200ms
# ✅ CLS < 0.1
```

**大房间测试**：
- [ ] 创建 20 人房间
- [ ] 操作流畅（无卡顿）
- [ ] 内存占用正常（< 200MB）

---

### 3.2 测试覆盖率提升

**覆盖率目标**：
```bash
npm run test:coverage

# 期望输出：
# Statements   : 90.00%+
# Branches     : 85.00%+
# Functions    : 92.00%+
# Lines        : 90.00%+
```

**薄弱模块补强**：
- [ ] `connection.ts` 覆盖率 ≥ 85%
- [ ] `voting.ts` 覆盖率 ≥ 85%
- [ ] `DetectivePinboard.tsx` 覆盖率 ≥ 75%

---

### 3.3 监控与可观测性

**功能验收**：
- [ ] Sentry 自定义事件追踪正常
- [ ] 监控仪表板可访问
- [ ] 应用内反馈表单正常

**事件追踪验证**：
```bash
# 在 Sentry Dashboard 检查以下事件：
# - Room Created
# - Game Started
# - AI Query
# - Replay Viewed
```

---

### Phase 3 总体验收

**性能达标**：
- [ ] Bundle < 800KB
- [ ] FCP < 1s
- [ ] 20 人房间流畅

**质量达标**：
- [ ] 覆盖率 ≥ 90%
- [ ] 无已知 P0/P1 bug

**版本标记**：
- [ ] `package.json` 版本号更新为 `1.1.0`
- [ ] `CHANGELOG.md` 记录 Phase 3 优化

---

## 🚀 最终发布验收

### 生产环境部署

**部署前检查**：
- [ ] 所有 Phase 1-3 验收通过
- [ ] Staging 环境运行稳定（7 天无严重 bug）
- [ ] 性能指标达标
- [ ] 安全审计通过

**部署步骤**：
```bash
# 1. 打 tag
git tag -a v1.1.0 -m "Release v1.1.0"
git push origin v1.1.0

# 2. 构建生产版本
npm run build

# 3. 部署到 Cloudflare Pages
# (自动部署 or wrangler pages deploy)

# 4. 验证生产环境
curl -I https://grimoire-web.pages.dev
curl -I https://ahri-ai-labdesign.tech
```

**部署后验证**：
- [ ] 生产环境可访问
- [ ] 关键流程手工测试通过
- [ ] Sentry 无严重错误
- [ ] 性能指标正常

---

## 📊 质量门禁总结

所有 Phase 完成后，项目应满足：

### 代码质量
- ✅ Lint 通过，无警告
- ✅ TypeScript 严格模式，无类型错误
- ✅ 测试覆盖率 ≥ 90%

### 功能完整
- ✅ README 承诺的所有功能已实现
- ✅ 70+ 视觉测试 + 100+ 单元测试 + 50+ E2E 测试
- ✅ 5+ 新剧本 + 回放系统 + 社交功能

### 性能达标
- ✅ Bundle < 800KB
- ✅ FCP < 1s
- ✅ 20 人房间流畅

### 生产就绪
- ✅ 部署成功，无回滚
- ✅ 7 天稳定运行
- ✅ 用户反馈积极

---

**使用本清单时，逐项勾选，确保无遗漏。**
