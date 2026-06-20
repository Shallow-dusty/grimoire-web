# Codex 执行指南

> 本指南说明如何使用 `docs/development-plans/` 中的计划文档

---

## 🎯 文档设计原则

所有计划文档遵循以下原则，确保 Codex 可以独立执行：

1. **目标明确**：每个任务有清晰的可验证目标
2. **输入输出明确**：列出需要读取的文件和产出物
3. **验证标准明确**：提供可执行的验证命令
4. **代码示例完整**：关键实现有完整代码片段
5. **依赖关系清晰**：标注前置任务和阻塞条件

---

## 📖 如何阅读计划文档

### 标准文档结构

```markdown
# [任务名称]

## 🎯 目标
[3-5 个可验证的明确目标]

## 📊 当前状态
[基线数据、已有基础、相关文件路径]

## 🛠️ 实施任务

### Task X.X.X: [具体任务名]

**输入**：
- 需要读取的文件：`src/xxx.ts`
- 参考实现：`src/yyy.ts`

**输出**：
- 新建文件：`e2e/visual/xxx.spec.ts`
- 修改文件：`playwright.config.ts`

**实施步骤**：
1. 步骤 1
2. 步骤 2
3. 步骤 3

**代码示例**：
\```typescript
// 完整可运行的代码示例
\```

**验证**：
\```bash
# 可执行的验证命令
npm run test:e2e -- xxx.spec.ts
\```

## ✅ 验收标准
- [ ] 可检查的标准 1（带验证命令）
- [ ] 可检查的标准 2（带文件路径）

## 🧪 测试要求
- 必须编写的测试类型
- 测试覆盖率目标（数值）

## 📦 交付物清单
- [ ] 文件 1：`path/to/file1.ts`
- [ ] 文件 2：`path/to/file2.ts`
- [ ] 文档：`docs/xxx.md`（如果需要）
```

---

## 🚀 Codex 执行流程

### 基本流程

```bash
# 1. 读取计划文档
cat docs/development-plans/phaseX-XX-task-name.md

# 2. 确认当前状态
npm run test              # 确保基线测试通过
npm run lint              # 确保代码质量
git status                # 确保工作区干净

# 3. 执行开发任务
codex /goal "实现 [任务名称]，按 phaseX-XX 文档要求"

# 4. 验证交付
# 运行文档中的验证命令
npm run test:e2e -- xxx.spec.ts
npm run build
npm run lint

# 5. 检查交付物
# 对照"交付物清单"逐一检查文件是否存在

# 6. 提交代码
git add .
git commit -m "feat: [任务名称] - [简短描述]

- 完成目标 1
- 完成目标 2

Ref: docs/development-plans/phaseX-XX-task-name.md"

# 7. 推送（可选，建议每完成一个 Phase 推送一次）
git push origin main
```

---

## 📋 任务状态管理

### 更新进度表

每完成一个任务，更新 `README.md` 中的进度表：

```markdown
| Phase 1.1 | ✅ 已完成 | 100% | 40-50h | 45h |
```

### 状态标记说明

- 🔲 **待开始**：未开始
- 🔄 **进行中**：Codex 正在执行
- ✅ **已完成**：通过验收标准
- ⏸️ **已暂停**：遇到阻塞，暂时跳过
- ❌ **已取消**：不再需要

---

## ⚠️ 常见问题处理

### 1. 依赖的文件不存在

**症状**：文档中提到的 `src/xxx.ts` 不存在

**解决**：
1. 检查文件路径是否正确（相对路径 vs 绝对路径）
2. 查看 git 历史：`git log --all --full-history -- src/xxx.ts`
3. 搜索类似功能：`grep -r "function xxx" src/`
4. 如果确实不存在，记录问题到文档末尾的"问题反馈"节

### 2. 验证命令失败

**症状**：执行文档中的验证命令返回错误

**解决**：
1. 检查是否完成了所有前置步骤
2. 查看错误信息是否与预期不符
3. 运行基线测试：`npm run test`（确认不是环境问题）
4. 如果是文档问题，记录到"问题反馈"

### 3. 代码示例无法运行

**症状**：复制文档中的代码示例后报错

**解决**：
1. 检查 import 语句是否正确
2. 查看类型定义是否已更新
3. 参考项目中类似的实现
4. 如果示例有误，记录问题

### 4. 测试覆盖率不达标

**症状**：完成任务后覆盖率低于目标

**解决**：
1. 运行 `npm run test:coverage`
2. 查看未覆盖的分支：`coverage/lcov-report/index.html`
3. 补充边缘场景测试
4. 如果目标不合理，记录反馈

---

## 🔄 任务执行策略

### 串行执行（推荐）

**适用场景**：大部分任务

```bash
# 严格按顺序执行
Task 1.1.1 → Task 1.1.2 → Task 1.1.3 → ...
```

**优点**：
- 依赖关系清晰
- 问题易于定位
- Git 历史干净

### 并行执行（高级）

**适用场景**：明确标注"可并行"的任务

```bash
# 例如：Phase 1.1 和 Phase 1.2 可以并行
Task 1.1.x (视觉测试) || Task 1.2.x (图像重绘)
```

**注意事项**：
- 使用 Git 分支隔离
- 合并前确保没有冲突
- 并行任务不能有依赖关系

### 跳过执行（应急）

**适用场景**：遇到阻塞且无法立即解决

```bash
# 标记任务为 ⏸️ 暂停
# 跳到下一个不依赖该任务的任务
```

**注意事项**：
- 记录跳过原因
- 在 `README.md` 中标注
- 后续需要回来补完

---

## 🎯 验收标准解读

### 类型 1：测试通过

```markdown
✅ 验收标准
- [ ] 所有新增测试通过：`npm run test:e2e -- visual/*.spec.ts`
```

**验证方式**：
```bash
npm run test:e2e -- visual/*.spec.ts
# 期望输出：X passed, 0 failed
```

### 类型 2：覆盖率达标

```markdown
✅ 验收标准
- [ ] 测试覆盖率 ≥ 85%：`npm run test:coverage`
```

**验证方式**：
```bash
npm run test:coverage
# 查看输出中的 Statements 行
# Statements   : 85.00% ( XXX/YYYY )
```

### 类型 3：文件产出

```markdown
✅ 验收标准
- [ ] 创建文件 `e2e/visual/lobby-visual.spec.ts`
```

**验证方式**：
```bash
test -f e2e/visual/lobby-visual.spec.ts && echo "✅ 文件存在" || echo "❌ 文件不存在"
```

### 类型 4：性能指标

```markdown
✅ 验收标准
- [ ] Bundle 体积 < 800KB：检查 `dist/` 目录
```

**验证方式**：
```bash
npm run build
du -sh dist/assets/*.js | awk '{if($1 > "800K") print "❌", $0; else print "✅", $0}'
```

---

## 📊 进度追踪实践

### 每日更新

**建议时间**：每天结束时

**更新内容**：
1. 更新 `README.md` 进度表
2. 填写实际工时
3. 标记任务状态

**示例 commit**：
```bash
git commit -m "chore: update development progress (Day 3)

- Phase 1.1: Task 1.1.1 ✅ 完成
- Phase 1.1: Task 1.1.2 🔄 进行中 (60%)
- 今日工时: 6h
- 累计工时: 18h / 280h (6.4%)

[skip ci]"
```

### 每周回顾

**建议时间**：每周五

**回顾内容**：
1. 完成的任务数
2. 遇到的主要问题
3. 下周计划
4. 进度是否符合预期

**输出**：在 `docs/development-plans/weekly-reports/` 创建周报

---

## 🔧 开发环境配置

### 必需检查

在开始任何任务前，确保：

```bash
# 1. Node.js 版本正确
node -v  # 期望 v18+

# 2. 依赖已安装
npm install

# 3. 基线测试通过
npm run test

# 4. Lint 通过
npm run lint

# 5. 构建成功
npm run build

# 6. E2E 测试可运行
npm run test:e2e -- e2e/home.spec.ts
```

### Playwright 特殊配置

对于 Phase 1 的视觉测试：

```bash
# 安装浏览器（如果未安装）
npx playwright install chromium firefox

# 更新快照（首次运行）
npm run test:e2e -- --update-snapshots

# 查看视觉差异
npm run test:e2e -- --debug
```

---

## 🎓 最佳实践

### 1. 小步快跑

- **每个 Task 单独 commit**，不要攒大 commit
- Commit 消息清晰，引用文档路径
- 保持 main 分支始终可构建

### 2. 测试先行

- 编写功能代码前，先写测试
- 红 → 绿 → 重构循环
- 测试覆盖率是硬性要求

### 3. 代码审查

- 每完成一个 Phase，自我审查代码
- 检查是否有重复代码
- 确保命名一致性

### 4. 文档同步

- 代码变更后，更新相关文档
- 新增功能必须有 README 说明
- 复杂逻辑添加代码注释

---

## 📞 获取帮助

### 文档问题

如果计划文档有以下问题：
- 描述不清晰
- 代码示例错误
- 验证命令无效
- 依赖文件不存在

**处理方式**：
在对应文档末尾添加：

```markdown
## 📝 问题反馈

### [日期] - [问题简述]

**问题描述**：
[详细描述]

**建议修改**：
[你的建议]

**临时解决方案**：
[如何绕过该问题]
```

### 技术阻塞

如果遇到技术难题：
1. 查阅 `TECHNICAL_SPECS.md`（技术约束）
2. 查阅 `MIGRATION_GUIDE.md`（已有实现参考）
3. 搜索项目代码：`grep -r "关键词" src/`
4. 记录阻塞，继续下一个任务

---

## 🎯 成功标准

### 单个任务完成标准

- ✅ 所有"验收标准"勾选
- ✅ 所有"交付物清单"产出
- ✅ 测试覆盖率达标
- ✅ Lint 无警告
- ✅ 构建成功

### Phase 完成标准

- ✅ 该 Phase 所有任务完成
- ✅ Phase 总体目标达成
- ✅ 推送到远程仓库
- ✅ 更新 `README.md` 进度表

### 最终交付标准

- ✅ 所有 3 个 Phase 完成
- ✅ 所有测试通过（单元 + 集成 + E2E）
- ✅ 覆盖率 ≥ 90%
- ✅ 性能指标达标
- ✅ 生产环境部署成功

---

## 📚 参考资料

- **项目文档**：`docs/` 目录
- **技术架构**：`docs/ARCHITECTURE.md`
- **测试指南**：`docs/TESTING.md`
- **部署指南**：`docs/DEPLOYMENT.md`

---

**准备就绪？** 开始第一个任务：
```bash
cat docs/development-plans/phase1-01-visual-testing.md
```
