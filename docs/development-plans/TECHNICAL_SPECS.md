# 技术规格与约束

> 本文档定义 Grimoire Web 开发的技术约束、架构决策和编码规范

---

## 🏗️ 技术栈约束

### 前端框架

**已选定技术**：
- React 18.3.1
- TypeScript 5.8.2 (strict mode)
- Vite 6.2.0

**约束**：
- ✅ 必须保持 TypeScript strict mode
- ✅ 所有新组件使用函数式组件 + Hooks
- ❌ 禁止使用 Class 组件
- ❌ 禁止使用 `any` 类型（除非极特殊情况并注释说明）

### 状态管理

**已选定技术**：
- Zustand 5.0.10 + Immer 11.0.1（数据状态）
- XState 5.25.0（阶段状态机）

**约束**：
- ✅ 游戏阶段转换必须通过 XState phaseMachine
- ✅ 数据变更必须通过 Zustand actions（不直接修改 state）
- ✅ 使用 Immer 的 draft 模式修改嵌套数据
- ❌ 禁止绕过状态机直接修改 gameState.phase

**示例**：
```typescript
// ✅ 正确：通过 action
set((state) => {
  state.gameState.seats[0].isDead = true;
});

// ❌ 错误：直接修改
useGameStore.getState().gameState.seats[0].isDead = true;
```

### UI 框架

**已选定技术**：
- Tailwind CSS 4.1.18
- Framer Motion 12.23.24（动画）
- Radix UI（无障碍组件）

**约束**：
- ✅ 优先使用 Tailwind 工具类
- ✅ 复杂动画使用 Framer Motion
- ✅ 可访问性组件优先使用 Radix UI
- ❌ 禁止内联样式（除非动态计算）
- ❌ 禁止全局 CSS（除了 index.css）

### 测试框架

**已选定技术**：
- Vitest 4.0.14（单元/集成测试）
- Playwright 1.57.0（E2E 测试）
- Testing Library 16.3.0（组件测试）

**约束**：
- ✅ 所有新功能必须有单元测试
- ✅ 关键流程必须有 E2E 测试
- ✅ 测试覆盖率 ≥ 85%（Phase 1 后）→ 90%（Phase 3 后）
- ❌ 禁止跳过失败的测试（`test.skip`）

---

## 📁 目录结构约束

### 强制规范

```
src/
├── components/           # React 组件
│   ├── game/            # 游戏核心组件
│   ├── controls/        # 控制面板
│   ├── ui/              # 通用 UI 组件
│   └── ...
├── store/               # Zustand store
│   ├── slices/          # 状态切片
│   └── store.ts         # Store 入口
├── lib/                 # 工具库
│   ├── roleAutomation/  # 角色自动化
│   ├── machines/        # XState 状态机
│   └── gameLogic.ts     # 游戏逻辑
├── hooks/               # 自定义 Hooks
├── types/               # TypeScript 类型定义
├── constants/           # 常量
├── i18n/                # 国际化
└── services/            # 外部服务
```

**约束**：
- ✅ 新组件必须放在对应的分类目录
- ✅ 工具函数放在 `lib/`，通用 Hooks 放在 `hooks/`
- ❌ 禁止在组件文件中定义复杂业务逻辑（应抽取到 `lib/`）
- ❌ 禁止创建新的顶层目录（除非有充分理由）

---

## 🎨 设计系统约束

### 色彩规范

**主色调**：暗黑哥特 + 暖色调

```css
/* 背景 */
--bg-primary: #F7F4EF;      /* 暖色背景 */
--bg-surface: #FBF9F5;      /* 表面 */
--bg-dark: #1F2421;         /* 暗色区域 */

/* 文本 */
--text-primary: #1F2421;    /* 主文本 */
--text-muted: #5C635D;      /* 次要文本 */
--text-inverse: #FFFFFF;    /* 反色文本 */

/* 强调色 */
--accent: #C4612F;          /* 赤陶色（主要强调）*/
--accent-hover: #A94E22;    /* hover 状态 */
--accent-tint: #F2E3D6;     /* 浅色变体 */

/* 边框 */
--border: #E7E1D7;          /* 暖色细线 */
```

**约束**：
- ✅ 所有新 UI 元素必须使用上述色值
- ❌ 禁止使用冷色调（蓝色、紫色、冷灰色）
- ❌ 禁止使用纯黑 `#000000`（使用 `--bg-dark`）

### 字体规范

**已选定字体**：
- 标题：Fraunces / DM Serif Display / Playfair Display（display serif）
- 正文/UI：Inter（300-500 weight）
- 代码：JetBrains Mono（如果需要）

**约束**：
- ✅ 标题使用 serif，正文使用 sans-serif
- ✅ 标题中可以斜体强调关键词
- ❌ 禁止使用超过 3 种字体
- ❌ 禁止使用 Comic Sans、Arial 等常规字体

### 图像规范

**格式要求**：
- 普通图像：PNG（透明）或 WebP（优化体积）
- 图标：SVG（矢量）
- 背景：JPEG（大尺寸）或 WebP

**尺寸要求**：
- 图标：32x32、64x64（2x）、96x96（3x）
- 卡片图像：200x280（1x）、400x560（2x）
- 背景：1920x1080（最大）

**约束**：
- ✅ 所有图像必须提供 2x Retina 版本
- ✅ 优先使用 WebP（体积优化）
- ✅ 单个图像 < 200KB
- ❌ 禁止使用未压缩的 PNG

---

## 🔧 代码规范

### 命名约定

**文件名**：
- 组件：PascalCase（`SeatNode.tsx`）
- 工具函数：camelCase（`gameLogic.ts`）
- 常量文件：camelCase（`roles.ts`）
- 类型文件：camelCase（`types.ts`）

**变量/函数**：
- 变量：camelCase（`seatCount`）
- 函数：camelCase（`calculateWinner`）
- 组件：PascalCase（`GrimoireView`）
- 类型：PascalCase（`GameState`）
- 常量：UPPER_SNAKE_CASE（`MAX_PLAYERS`）

**约束**：
- ✅ 布尔变量以 `is`/`has`/`should` 开头
- ✅ 事件处理函数以 `handle`/`on` 开头
- ❌ 禁止使用单字母变量（除了循环中的 `i`/`j`）
- ❌ 禁止使用拼音命名

### 代码组织

**组件结构**：
```typescript
// 1. Imports
import { ... } from 'react';

// 2. Types/Interfaces
interface SeatNodeProps {
  ...
}

// 3. Constants
const DEFAULT_SIZE = 64;

// 4. Component
export function SeatNode({ ... }: SeatNodeProps) {
  // 4.1 Hooks
  const [state, setState] = useState(...);
  
  // 4.2 Derived values
  const isActive = ...;
  
  // 4.3 Event handlers
  const handleClick = () => { ... };
  
  // 4.4 Effects
  useEffect(() => { ... }, []);
  
  // 4.5 Render
  return (
    ...
  );
}

// 5. Helper functions (如果需要)
function helperFn() { ... }
```

**约束**：
- ✅ 按上述顺序组织代码
- ✅ 复杂逻辑抽取为独立函数
- ❌ 禁止组件函数超过 200 行
- ❌ 禁止嵌套超过 3 层的条件判断

### 注释规范

**必须注释**：
- 复杂算法（胜负判定、角色能力）
- 业务规则（游戏规则、特殊处理）
- 已知问题/临时解决方案（标记 `[HACK]`/`[TODO]`）
- 公共 API/工具函数

**示例**：
```typescript
/**
 * 计算游戏胜负
 * 
 * 规则：
 * 1. 所有恶魔死亡 → 好人阵营胜利
 * 2. 只剩 2 人（含 1 恶魔）→ 邪恶阵营胜利
 * 3. 圣徒被处决 → 邪恶阵营胜利
 * 
 * @param gameState 当前游戏状态
 * @returns 胜利阵营或 null（游戏继续）
 */
export function calculateWinner(gameState: GameState): Team | null {
  // ...
}
```

**约束**：
- ✅ 使用 JSDoc 格式
- ✅ 注释必须有实际价值（不写废话）
- ❌ 禁止注释掉的代码（应该删除）
- ❌ 禁止无用注释（如 `// 循环`）

---

## 🧪 测试规范

### 单元测试

**覆盖要求**：
- 工具函数：100%
- Store slices：≥ 90%
- Hooks：≥ 85%
- 组件：≥ 70%（重点测试逻辑，不测试样式）

**命名约定**：
```
src/lib/gameLogic.ts → tests/lib/gameLogic.test.ts
```

**测试结构**：
```typescript
describe('calculateWinner', () => {
  describe('when all demons are dead', () => {
    it('should return Good team victory', () => {
      // Arrange
      const gameState = createMockGameState({ ... });
      
      // Act
      const result = calculateWinner(gameState);
      
      // Assert
      expect(result).toBe('good');
    });
  });
});
```

**约束**：
- ✅ 使用 Arrange-Act-Assert 模式
- ✅ 测试描述使用自然语言
- ✅ 每个分支必须有测试
- ❌ 禁止测试实现细节（测试行为，不测试内部状态）

### E2E 测试

**覆盖要求**：
- 关键用户流程必须有 E2E 测试
- 至少覆盖 Chromium 和 Firefox

**命名约定**：
```
e2e/lobby.spec.ts
e2e/visual/grimoire-visual.spec.ts
```

**测试结构**：
```typescript
test('should create room and join as player', async ({ page }) => {
  // 1. 访问大厅
  await page.goto('/');
  
  // 2. 创建房间
  await page.getByRole('button', { name: /create room/i }).click();
  
  // 3. 验证房间创建成功
  await expect(page.getByText(/room created/i)).toBeVisible();
});
```

**约束**：
- ✅ 使用语义化选择器（`getByRole`/`getByText`）
- ✅ 等待元素可见后再交互
- ❌ 禁止使用 CSS 选择器（如 `.seat-node`）
- ❌ 禁止硬编码等待时间（使用 `waitFor`）

---

## 🚀 性能约束

### Bundle 体积

**目标**：
- Phase 1: < 1.5MB（当前基线）
- Phase 3: < 800KB（优化后）

**约束**：
- ✅ 大型依赖必须动态导入（code splitting）
- ✅ 图像必须懒加载
- ❌ 禁止引入超过 100KB 的新依赖（除非必需）

### 渲染性能

**目标**：
- 60 FPS（16.67ms/frame）
- 大房间（15+ 玩家）流畅运行

**约束**：
- ✅ 使用 React.memo 优化列表渲染
- ✅ 事件处理函数使用 useCallback
- ✅ 大列表使用虚拟滚动
- ❌ 禁止在 render 中执行重计算（使用 useMemo）

### 网络性能

**目标**：
- FCP < 1s
- LCP < 2.5s

**约束**：
- ✅ 关键资源预加载
- ✅ 字体子集化
- ❌ 禁止同步加载大文件

---

## 🔐 安全约束

### 数据安全

**约束**：
- ✅ 敏感数据（角色卡）仅说书人可见
- ✅ 私聊消息仅相关方可见
- ✅ RPC 函数必须验证权限
- ❌ 禁止在客户端存储明文密码/token

### XSS 防护

**约束**：
- ✅ 用户输入必须过滤（昵称、聊天）
- ✅ 使用 React 的自动转义
- ❌ 禁止 `dangerouslySetInnerHTML`（除非必需并过滤）

### CORS 策略

**约束**：
- ✅ Edge Functions 必须限制 CORS
- ✅ 仅允许来自 `grimoire-web.pages.dev` 和自定义域名的请求

---

## 🌐 国际化约束

### i18n 规范

**约束**：
- ✅ 所有 UI 文案必须通过 `t()` 函数
- ✅ 支持 zh-CN 和 en
- ❌ 禁止硬编码文案

**示例**：
```typescript
// ✅ 正确
<button>{t('common.confirm')}</button>

// ❌ 错误
<button>确认</button>
```

---

## 📦 依赖管理约束

### 版本锁定

**约束**：
- ✅ 使用 `package-lock.json` 锁定版本
- ✅ 定期更新依赖（每月检查）
- ❌ 禁止使用 `^` 范围版本（除非特殊需要）

### 新增依赖审查

**标准**：
- 是否有更好的替代方案？
- 是否可以自己实现（如果很简单）？
- 体积是否可接受（< 100KB）？
- 是否活跃维护？

---

## 🔄 Git 工作流约束

### Commit 规范

**格式**：
```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型**：
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档变更
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具变更

**约束**：
- ✅ subject 必须是祈使句（"add" 而非 "added"）
- ✅ 每个 commit 只做一件事
- ✅ 引用相关文档（`Ref: docs/development-plans/xxx.md`）
- ❌ 禁止 WIP commit 推送到 main

### 分支策略

**约束**：
- ✅ `main` 分支保持稳定，可随时部署
- ✅ 新功能在 feature 分支开发（可选）
- ❌ 禁止直接在 main 上开发（除非小修复）

---

## 📞 例外处理

如果必须违反上述约束，必须：
1. 在代码中添加 `// [EXCEPTION]` 注释说明原因
2. 在 PR 中解释为什么需要例外
3. 得到审查者批准

**示例**：
```typescript
// [EXCEPTION] 使用 any 类型因为第三方库类型定义不完整
const result: any = externalLib.process(...);
```

---

**本文档是开发过程中的强制约束，所有新代码必须遵守。**
