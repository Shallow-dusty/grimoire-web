# 开发计划文档索引

> 本目录包含 Grimoire Web v0.9.1 → v1.1.0 的完整开发计划
> 所有计划设计为可交由 Codex 自动执行

---

## 📚 文档结构

### 总览文档
- **本文档** - 开发计划索引与快速导航
- `EXECUTION_GUIDE.md` - Codex 执行指南（如何使用这些计划）

### Phase 1: 视觉测试与图像重绘（P0 优先级）
- `phase1-overview.md` - Phase 1 总体规划
- `phase1-01-visual-testing.md` - Playwright 视觉回归测试
- `phase1-02-image-redesign.md` - UI 图像资源重绘
- `phase1-03-ui-bugfix.md` - UI Bug 修复与验证

### Phase 2: 核心功能扩展
- `phase2-overview.md` - Phase 2 总体规划
- `phase2-01-script-expansion.md` - 剧本扩展系统
- `phase2-02-replay-system.md` - 游戏回放与分析
- `phase2-03-social-features.md` - 社交功能（不含好友）

### Phase 3: 性能优化与工程质量
- `phase3-overview.md` - Phase 3 总体规划
- `phase3-01-performance.md` - 性能优化
- `phase3-02-test-coverage.md` - 测试覆盖率提升
- `phase3-03-monitoring.md` - 监控与可观测性

### 附录
- `TECHNICAL_SPECS.md` - 技术规格与约束
- `VALIDATION_CHECKLIST.md` - 验收标准清单
- `MIGRATION_GUIDE.md` - 现有功能迁移指南

---

## 🚀 快速开始

### 给 Codex 的执行顺序

**严格按以下顺序执行**：

1. **Phase 1.1 - 视觉测试**（必须先完成）
   ```bash
   # 读取计划
   cat docs/development-plans/phase1-01-visual-testing.md
   
   # 执行开发
   codex /goal "实现 Playwright 视觉回归测试，按 phase1-01 文档要求"
   ```

2. **Phase 1.2 - 图像重绘**（可与 1.1 并行）
   ```bash
   cat docs/development-plans/phase1-02-image-redesign.md
   codex /goal "重绘 UI 图像资源，按 phase1-02 文档要求"
   ```

3. **Phase 1.3 - UI 修复**（依赖 1.1 的测试结果）
   ```bash
   cat docs/development-plans/phase1-03-ui-bugfix.md
   codex /goal "修复视觉测试发现的 UI bug，按 phase1-03 文档要求"
   ```

4. **Phase 2.1 - 剧本扩展**
   ```bash
   cat docs/development-plans/phase2-01-script-expansion.md
   codex /goal "实现剧本扩展系统，按 phase2-01 文档要求"
   ```

5. **Phase 2.2 - 回放系统**
   ```bash
   cat docs/development-plans/phase2-02-replay-system.md
   codex /goal "实现游戏回放与分析，按 phase2-02 文档要求"
   ```

6. **Phase 2.3 - 社交功能**
   ```bash
   cat docs/development-plans/phase2-03-social-features.md
   codex /goal "实现社交功能（房间历史、战绩），按 phase2-03 文档要求"
   ```

7. **Phase 3.1 - 性能优化**
   ```bash
   cat docs/development-plans/phase3-01-performance.md
   codex /goal "性能优化，按 phase3-01 文档要求"
   ```

8. **Phase 3.2 - 测试覆盖**
   ```bash
   cat docs/development-plans/phase3-02-test-coverage.md
   codex /goal "提升测试覆盖率至 90%+，按 phase3-02 文档要求"
   ```

9. **Phase 3.3 - 监控增强**
   ```bash
   cat docs/development-plans/phase3-03-monitoring.md
   codex /goal "增强监控与可观测性，按 phase3-03 文档要求"
   ```

---

## 📋 每个计划文档的标准结构

所有计划文档遵循统一格式，便于 Codex 解析：

```markdown
# [任务名称]

## 🎯 目标
- 明确的可验证目标

## 📊 当前状态
- 基线数据
- 已有基础

## 🛠️ 实施任务
### Task X.X: [具体任务]
- **输入**：需要读取的文件/数据
- **输出**：产出物
- **验证**：如何验证完成
- **代码示例**：（如果需要）

## ✅ 验收标准
- [ ] 可检查的标准 1
- [ ] 可检查的标准 2

## 🧪 测试要求
- 必须编写的测试
- 测试覆盖率目标

## 📦 交付物清单
- 文件 1
- 文件 2
```

---

## 🔄 依赖关系图

```
Phase 1.1 (视觉测试)
    ↓
Phase 1.3 (UI 修复) ←─── Phase 1.2 (图像重绘)
    ↓
┌──────────────────────────────┐
│  Phase 1 完成检查点          │
│  - 视觉测试通过              │
│  - 图像重绘完成              │
│  - UI bug 全部修复           │
└──────────────────────────────┘
    ↓
Phase 2.1 (剧本扩展)
    ↓
Phase 2.2 (回放系统)
    ↓
Phase 2.3 (社交功能)
    ↓
┌──────────────────────────────┐
│  Phase 2 完成检查点          │
│  - 5+ 新剧本                 │
│  - 回放功能可用              │
│  - 社交功能上线              │
└──────────────────────────────┘
    ↓
Phase 3.1 (性能优化)
    ↓
Phase 3.2 (测试覆盖) ←─── Phase 3.3 (监控)
    ↓
┌──────────────────────────────┐
│  Phase 3 完成检查点          │
│  - Bundle < 800KB            │
│  - 覆盖率 90%+               │
│  - 监控仪表板上线            │
└──────────────────────────────┘
    ↓
v1.1.0 Release
```

---

## 📊 进度追踪

### 总体进度

| Phase | 状态 | 进度 | 预计工时 | 实际工时 |
|-------|------|------|----------|----------|
| Phase 1.1 | 🔲 待开始 | 0% | 40-50h | - |
| Phase 1.2 | 🔲 待开始 | 0% | 30-40h | - |
| Phase 1.3 | 🔲 待开始 | 0% | 20-30h | - |
| Phase 2.1 | 🔲 待开始 | 0% | 40-50h | - |
| Phase 2.2 | 🔲 待开始 | 0% | 50-60h | - |
| Phase 2.3 | 🔲 待开始 | 0% | 20-30h | - |
| Phase 3.1 | 🔲 待开始 | 0% | 30-40h | - |
| Phase 3.2 | 🔲 待开始 | 0% | 30-40h | - |
| Phase 3.3 | 🔲 待开始 | 0% | 20-30h | - |
| **总计** | 🔲 待开始 | **0%** | **280-370h** | **0h** |

状态图例：
- 🔲 待开始
- 🔄 进行中
- ✅ 已完成
- ⏸️ 已暂停
- ❌ 已取消

---

## 🎯 Codex 使用建议

### 最佳实践

1. **逐个任务执行**
   - 不要一次执行整个 Phase
   - 每完成一个 Task 就 commit
   - 保持高粒度 git 提交

2. **验证后再继续**
   - 每个 Task 完成后运行验证命令
   - 确保测试通过
   - 检查交付物清单

3. **遇到阻塞时**
   - 记录阻塞原因
   - 跳过该 Task，标记 ⏸️
   - 继续后续不依赖的任务

4. **定期同步**
   - 每完成一个 Phase 推送到远程
   - 更新本文档的进度表
   - 记录实际工时

---

## 📞 支持与反馈

如果 Codex 执行过程中遇到问题：

1. **文档不清晰**
   - 在对应文档末尾添加 `## 问题反馈` 节
   - 记录问题描述

2. **技术阻塞**
   - 检查 `TECHNICAL_SPECS.md` 是否有约束说明
   - 查看 `MIGRATION_GUIDE.md` 寻找已有实现参考

3. **验收标准模糊**
   - 参考 `VALIDATION_CHECKLIST.md`
   - 运行 `npm run test` 确认测试通过

---

## 🔧 开发环境要求

### 必需工具
- Node.js 18+
- npm 9+
- Playwright（已安装）
- Git

### 推荐工具
- VS Code + Playwright Test 插件
- Chrome DevTools
- Lighthouse（性能测试）

### 环境变量
参考项目根目录 `.env.example`

---

## 📝 变更日志

| 日期 | 变更 | 负责人 |
|------|------|--------|
| 2026-06-20 | 初始化开发计划文档体系 | Claude Code |

---

**下一步**：阅读 `EXECUTION_GUIDE.md` 了解如何使用这些计划。
