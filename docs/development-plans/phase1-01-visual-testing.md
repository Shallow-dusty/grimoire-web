# Phase 1.1: Playwright 视觉回归测试

> **优先级**：P0（Phase 1 第一个任务，必须先完成）
> **预计工时**：40-50 小时
> **依赖**：无（可以立即开始）

---

## 🎯 目标

建立完整的 Playwright 视觉回归测试体系，解决"UI 元素有 bug 但难以手工验证"的核心痛点。

### 具体目标

1. ✅ 创建 50+ 视觉快照测试，覆盖所有关键 UI 状态
2. ✅ 验证点击热区准确性（座位、按钮、菜单）
3. ✅ 跨浏览器一致性测试（Chromium/Firefox/Mobile Chrome）
4. ✅ CI 集成，自动检测 UI 意外变化
5. ✅ 为后续 UI 修复提供测试基础设施

---

## 📊 当前状态

### 已有基础

**现有 E2E 测试**：
- `e2e/home.spec.ts` - 大厅基本流程
- `e2e/sandbox.spec.ts` - 沙盒模式
- `e2e/multiplayer-flow.spec.ts` - 多人游戏流程
- `e2e/game-setup-flow.spec.ts` - 游戏设置
- `e2e/accessibility.spec.ts` - 无障碍测试

**Playwright 配置**：
- `playwright.config.ts` - 基础配置已完成
- 支持 Chromium、Firefox、Mobile Chrome
- 已配置 `baseURL`、`trace`、`screenshot`

### 缺失的部分

- ❌ 无视觉快照测试
- ❌ 无点击热区验证
- ❌ 未配置视觉比对参数
- ❌ 无 CI 自动化

---

## 🛠️ 实施任务

### Task 1.1.1: 配置 Playwright 视觉测试基础

**目标**：增强 `playwright.config.ts`，添加视觉测试专用配置

**输入**：
- 读取：`playwright.config.ts`
- 参考：https://playwright.dev/docs/test-snapshots

**输出**：
- 修改：`playwright.config.ts`
- 新建：`.github/workflows/visual-regression.yml`（可选）

**实施步骤**：

1. **增强 playwright.config.ts**

```typescript
// playwright.config.ts
export default defineConfig({
  // ... 现有配置 ...
  
  // 新增：视觉测试配置
  expect: {
    toHaveScreenshot: {
      // 容忍少量抗锯齿差异
      maxDiffPixels: 100,
      
      // 像素差异阈值（0-1）
      threshold: 0.2,
      
      // 动画禁用
      animations: 'disabled',
      
      // 固定视口（确保一致性）
      fullPage: false,
    },
  },
  
  use: {
    // ... 现有配置 ...
    
    // 新增：视觉测试专用
    screenshot: 'only-on-failure',
    
    // 等待字体加载
    fonts: 'ready',
    
    // 固定时区
    timezoneId: 'Asia/Shanghai',
    
    // 固定 locale
    locale: 'zh-CN',
  },
});
```

2. **创建视觉测试目录**

```bash
mkdir -p e2e/visual
mkdir -p e2e/visual-snapshots
```

3. **更新 .gitignore**

```gitignore
# Playwright 视觉测试
e2e/visual-snapshots/
!e2e/visual-snapshots/.gitkeep
test-results/
playwright-report/
```

**注意**：快照基线需要提交到 git，但测试结果不提交。

**验证**：

```bash
# 测试配置是否正确
npm run test:e2e -- --list

# 期望输出：配置加载成功，无错误
```

**预计工时**：2-3 小时

---

### Task 1.1.2: 创建大厅视觉测试

**目标**：捕获大厅页面所有状态的视觉快照

**输入**：
- 读取：`src/components/lobby/Lobby.tsx`
- 参考：`e2e/home.spec.ts`

**输出**：
- 新建：`e2e/visual/lobby-visual.spec.ts`

**实施步骤**：

**1. 创建测试文件**

```typescript
// e2e/visual/lobby-visual.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Lobby Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // 等待大厅加载完成
    await page.waitForSelector('[data-testid="lobby-container"]', { 
      state: 'visible' 
    });
    
    // 等待字体加载（确保文本渲染一致）
    await page.evaluate(() => document.fonts.ready);
  });

  test('should match lobby empty state', async ({ page }) => {
    // 确保没有房间列表
    await expect(page.getByText(/no rooms/i)).toBeVisible();
    
    // 截图比对
    await expect(page).toHaveScreenshot('lobby-empty-state.png');
  });

  test('should match lobby with room list', async ({ page }) => {
    // 创建模拟房间数据
    await page.evaluate(() => {
      // 注入测试数据到 localStorage 或通过 API
      localStorage.setItem('mockRooms', JSON.stringify([
        { id: '1', name: 'Test Room 1', playerCount: 5 },
        { id: '2', name: 'Test Room 2', playerCount: 7 },
      ]));
    });
    
    // 刷新页面
    await page.reload();
    await page.waitForSelector('[data-testid="room-list"]');
    
    // 截图比对
    await expect(page).toHaveScreenshot('lobby-with-rooms.png');
  });

  test('should match create room modal', async ({ page }) => {
    // 打开创建房间模态框
    await page.getByRole('button', { name: /create room/i }).click();
    
    // 等待模态框动画完成
    await page.waitForTimeout(300);
    
    // 截图比对
    await expect(page).toHaveScreenshot('lobby-create-room-modal.png');
  });

  test('should match join room modal', async ({ page }) => {
    // 打开加入房间模态框
    await page.getByRole('button', { name: /join room/i }).click();
    
    // 等待模态框动画完成
    await page.waitForTimeout(300);
    
    // 截图比对
    await expect(page).toHaveScreenshot('lobby-join-room-modal.png');
  });

  test('should match room history panel', async ({ page }) => {
    // 注入房间历史数据
    await page.evaluate(() => {
      localStorage.setItem('roomHistory', JSON.stringify([
        { roomId: '123', roomName: 'Previous Game', lastJoined: Date.now() - 3600000 },
      ]));
    });
    
    // 打开房间历史面板
    await page.getByRole('button', { name: /history/i }).click();
    await page.waitForTimeout(300);
    
    // 截图比对
    await expect(page).toHaveScreenshot('lobby-room-history.png');
  });
});
```

**2. 添加 data-testid 到组件**（如果需要）

```typescript
// src/components/lobby/Lobby.tsx
export function Lobby() {
  return (
    <div data-testid="lobby-container">
      {/* ... */}
      <div data-testid="room-list">
        {/* ... */}
      </div>
    </div>
  );
}
```

**3. 生成快照基线**

```bash
# 首次运行，生成快照基线
npm run test:e2e -- e2e/visual/lobby-visual.spec.ts --update-snapshots

# 提交快照到 git
git add e2e/visual-snapshots/lobby-visual.spec.ts/
git commit -m "test: add lobby visual regression baselines"
```

**验证**：

```bash
# 运行视觉测试
npm run test:e2e -- e2e/visual/lobby-visual.spec.ts

# 期望输出：5 passed
```

**预计工时**：6-8 小时

---

### Task 1.1.3: 创建魔典视觉测试

**目标**：捕获魔典页面不同座位数配置的视觉快照

**输入**：
- 读取：`src/components/game/Grimoire.tsx`
- 参考：`e2e/sandbox.spec.ts`

**输出**：
- 新建：`e2e/visual/grimoire-visual.spec.ts`

**关键测试场景**：
1. 5 人魔典布局
2. 7 人魔典布局
3. 10 人魔典布局
4. 15 人魔典布局
5. 座位节点各种状态（默认/选中/死亡/中毒/醉酒）
6. 说书人菜单显示状态

**代码示例**：

```typescript
// e2e/visual/grimoire-visual.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Grimoire Visual Regression', () => {
  test('should match grimoire with 5 players', async ({ page }) => {
    // 进入沙盒模式
    await page.goto('/sandbox');
    
    // 设置 5 人配置
    await page.getByRole('button', { name: /5 players/i }).click();
    await page.waitForTimeout(500); // 等待布局动画
    
    // 截图比对
    await expect(page).toHaveScreenshot('grimoire-5-players.png');
  });

  test('should match grimoire with 10 players', async ({ page }) => {
    await page.goto('/sandbox');
    await page.getByRole('button', { name: /10 players/i }).click();
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('grimoire-10-players.png');
  });

  test('should match seat node - dead state', async ({ page }) => {
    await page.goto('/sandbox');
    
    // 点击座位打开菜单
    await page.locator('[data-testid="seat-node-0"]').click();
    
    // 标记为死亡
    await page.getByRole('button', { name: /mark dead/i }).click();
    await page.waitForTimeout(300);
    
    // 聚焦该座位并截图
    await page.locator('[data-testid="seat-node-0"]').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-testid="seat-node-0"]')).toHaveScreenshot('seat-node-dead.png');
  });

  test('should match storyteller menu', async ({ page }) => {
    await page.goto('/sandbox');
    
    // 长按座位（移动端）或右键（桌面）
    await page.locator('[data-testid="seat-node-0"]').click({ button: 'right' });
    await page.waitForTimeout(300);
    
    // 截图比对整个菜单
    await expect(page.locator('[data-testid="storyteller-menu"]')).toHaveScreenshot('storyteller-menu.png');
  });
});
```

**预计工时**：10-12 小时

---

### Task 1.1.4: 创建控制面板视觉测试

**目标**：捕获控制面板各个 tab 的视觉快照

**输出**：
- 新建：`e2e/visual/controls-visual.spec.ts`

**关键测试场景**：
1. Phase 控制 tab
2. Night Order tab
3. AI Assistant tab
4. Notes tab
5. Settings tab
6. Reference tab

**预计工时**：8-10 小时

---

### Task 1.1.5: 创建投票视觉测试

**输出**：
- 新建：`e2e/visual/voting-visual.spec.ts`

**关键测试场景**：
1. 投票界面初始状态
2. 投票进行中
3. 投票结果展示
4. 投票历史图表

**预计工时**：6-8 小时

---

### Task 1.1.6: 创建夜间操作视觉测试

**输出**：
- 新建：`e2e/visual/night-visual.spec.ts`

**关键测试场景**：
1. 夜间操作面板
2. 不同角色的夜间交互
3. 夜间顺序列表

**预计工时**：6-8 小时

---

### Task 1.1.7: 创建交互热区验证测试 ⭐

**目标**：验证点击区域准确性（最核心的任务）

**输出**：
- 新建：`e2e/visual/interaction-zones.spec.ts`

**实施步骤**：

```typescript
// e2e/visual/interaction-zones.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Interaction Zones Validation', () => {
  test('座位节点点击热区验证', async ({ page }) => {
    await page.goto('/sandbox');
    
    const seatNode = page.locator('[data-testid="seat-node-0"]');
    const boundingBox = await seatNode.boundingBox();
    
    if (!boundingBox) throw new Error('Seat node not found');
    
    // 测试中心点击
    await page.mouse.click(
      boundingBox.x + boundingBox.width / 2,
      boundingBox.y + boundingBox.height / 2
    );
    
    // 验证事件触发（例如：菜单打开）
    await expect(page.locator('[data-testid="seat-menu"]')).toBeVisible();
    
    // 测试边缘点击（应该仍然有效）
    await page.mouse.click(
      boundingBox.x + 10, // 左边缘 +10px
      boundingBox.y + 10  // 上边缘 +10px
    );
    
    await expect(page.locator('[data-testid="seat-menu"]')).toBeVisible();
    
    // 测试外部点击（不应触发）
    await page.mouse.click(
      boundingBox.x - 10, // 外部
      boundingBox.y - 10
    );
    
    // 菜单应该关闭
    await expect(page.locator('[data-testid="seat-menu"]')).not.toBeVisible();
  });

  test('投票按钮点击热区验证', async ({ page }) => {
    // 进入投票阶段
    await page.goto('/sandbox');
    await page.getByRole('button', { name: /start voting/i }).click();
    
    const voteButton = page.locator('[data-testid="vote-yes-button"]');
    const boundingBox = await voteButton.boundingBox();
    
    if (!boundingBox) throw new Error('Vote button not found');
    
    // 测试整个按钮区域可点击
    const testPoints = [
      { x: boundingBox.x + 5, y: boundingBox.y + 5 }, // 左上角
      { x: boundingBox.x + boundingBox.width - 5, y: boundingBox.y + 5 }, // 右上角
      { x: boundingBox.x + boundingBox.width / 2, y: boundingBox.y + boundingBox.height / 2 }, // 中心
    ];
    
    for (const point of testPoints) {
      await page.mouse.click(point.x, point.y);
      
      // 验证投票注册
      await expect(page.locator('[data-testid="vote-count"]')).toContainText('1');
      
      // 重置
      await page.reload();
    }
  });

  test('说书人菜单触发区域验证', async ({ page }) => {
    await page.goto('/sandbox');
    
    const seatNode = page.locator('[data-testid="seat-node-0"]');
    
    // 测试长按触发（移动端）
    await seatNode.hover();
    await page.mouse.down();
    await page.waitForTimeout(500); // 长按 500ms
    await page.mouse.up();
    
    // 验证菜单弹出
    await expect(page.locator('[data-testid="storyteller-menu"]')).toBeVisible();
    
    // 测试点击外部关闭
    await page.mouse.click(0, 0); // 点击左上角
    await expect(page.locator('[data-testid="storyteller-menu"]')).not.toBeVisible();
  });
});
```

**验证**：

```bash
npm run test:e2e -- e2e/visual/interaction-zones.spec.ts

# 期望：所有热区验证通过
```

**预计工时**：8-10 小时

---

### Task 1.1.8: CI 集成（可选）

**目标**：在 GitHub Actions 中自动运行视觉测试

**输出**：
- 新建：`.github/workflows/visual-regression.yml`

**代码示例**：

```yaml
# .github/workflows/visual-regression.yml
name: Visual Regression Tests

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  visual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium firefox
        
      - name: Run visual regression tests
        run: npm run test:e2e -- e2e/visual/
        
      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: visual-test-results
          path: test-results/
```

**预计工时**：2-3 小时

---

## ✅ 验收标准

### 功能验收

- [ ] 至少 50 个视觉快照测试
- [ ] 覆盖大厅、魔典、控制面板、投票、夜间操作
- [ ] 交互热区验证测试完成
- [ ] 跨浏览器测试通过（Chromium + Firefox + Mobile Chrome）
- [ ] CI 集成完成（可选）

### 质量验收

```bash
# 运行所有视觉测试
npm run test:e2e -- e2e/visual/

# 期望输出
# ✅ 50+ passed
# ❌ 0 failed
# ⏱️ < 5 min
```

### 快照基线

```bash
# 检查快照文件
ls -R e2e/visual-snapshots/

# 期望输出：50+ .png 文件
```

### 文档

- [ ] 每个测试文件有顶部注释说明测试目的
- [ ] 复杂测试有内联注释

---

## 🧪 测试策略

### 快照稳定性

**问题**：快照测试容易因环境差异失败

**解决**：
1. 固定字体（等待 `document.fonts.ready`）
2. 固定时区和 locale
3. 禁用动画
4. 设置合理的 `maxDiffPixels` 和 `threshold`
5. 使用固定的测试数据

### 测试数据管理

**问题**：需要大量模拟数据

**解决**：
1. 使用 `page.evaluate()` 注入 localStorage 数据
2. 创建测试工厂函数生成一致的数据
3. 优先使用沙盒模式（不需要网络请求）

### 跨浏览器差异

**问题**：不同浏览器渲染可能有微小差异

**解决**：
1. 为每个浏览器保存单独的快照基线
2. 设置 `threshold: 0.2`（20% 容忍度）
3. 聚焦功能测试，不纠结像素级完美

---

## 📦 交付物清单

### 代码文件
- [ ] `e2e/visual/lobby-visual.spec.ts`
- [ ] `e2e/visual/grimoire-visual.spec.ts`
- [ ] `e2e/visual/controls-visual.spec.ts`
- [ ] `e2e/visual/voting-visual.spec.ts`
- [ ] `e2e/visual/night-visual.spec.ts`
- [ ] `e2e/visual/interaction-zones.spec.ts`

### 配置文件
- [ ] `playwright.config.ts`（增强）
- [ ] `.github/workflows/visual-regression.yml`（可选）

### 快照基线
- [ ] `e2e/visual-snapshots/*/`（50+ PNG 文件）

### 文档
- [ ] 每个测试文件的注释文档

---

## ⏱️ 时间分配

| Task | 预计工时 | 优先级 |
|------|----------|--------|
| 1.1.1 配置基础 | 2-3h | P0 |
| 1.1.2 大厅测试 | 6-8h | P0 |
| 1.1.3 魔典测试 | 10-12h | P0 |
| 1.1.4 控制面板测试 | 8-10h | P1 |
| 1.1.5 投票测试 | 6-8h | P1 |
| 1.1.6 夜间操作测试 | 6-8h | P1 |
| 1.1.7 交互热区验证 | 8-10h | P0 ⭐ |
| 1.1.8 CI 集成 | 2-3h | P2 |
| **总计** | **48-62h** | - |

**建议顺序**：1.1.1 → 1.1.2 → 1.1.7 → 1.1.3 → 1.1.4/5/6 → 1.1.8

---

## 🚨 常见问题

### Q1: 快照测试一直失败，即使没有改代码

**原因**：环境差异（字体、时区、随机数据）

**解决**：
```typescript
// 在 test.beforeEach 中添加
await page.evaluate(() => {
  // 固定随机种子
  Math.random = () => 0.5;
  
  // 固定日期
  Date.now = () => 1640000000000;
});
```

### Q2: 视觉测试太慢

**原因**：每次截图都要等待页面加载

**解决**：
- 使用并行测试（`fullyParallel: true`）
- 减少 `waitForTimeout`
- 使用 `test.describe.configure({ mode: 'parallel' })`

### Q3: 如何调试失败的快照

**方法**：
```bash
# 生成对比报告
npm run test:e2e -- e2e/visual/ --reporter=html

# 打开报告
npm run test:e2e:report

# 查看差异图像（红色区域 = 差异）
```

---

**完成本任务后，Phase 1.1 验收清单应全部勾选。**
