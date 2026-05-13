# 测试指南 | Testing Guide

> **测试框架**: Vitest + Testing Library + Playwright

本文档介绍 Grimoire Web 的测试策略、运行方法和最佳实践。

---

## 📊 当前测试状态

| 指标 | 数值 |
|------|------|
| Vitest 测试文件 | 118 |
| E2E 测试文件 | 5 |
| 最近完整本地 gate | 2026-05-12: 2,197 个 Vitest 用例 + 45 个默认 E2E 用例通过 |
| 覆盖率 | 运行 `npm run test:coverage` 后以 `coverage/` 产物为准 |

---

## 🏃 运行测试

### 基础命令

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监视模式 (开发时使用)
npm run test:watch

# 运行单个测试文件
npx vitest run src/components/game/BloodPact.test.tsx

# 运行匹配模式的测试
npx vitest run --testNamePattern="renders"
```

### 分组运行

```bash
# 仅运行逻辑测试 (store, lib, hooks)
npm run test:src:logic

# 仅运行 UI 测试 (components)
npm run test:src:ui

# 运行集成测试
npm run test:tests

# 运行 E2E（默认多浏览器矩阵）
npm run test:e2e

# 运行 WebKit/Safari 需要本机已安装 Playwright WebKit 系统依赖
PW_INCLUDE_WEBKIT=1 npm run test:e2e -- --project=webkit

# 覆盖默认并发 worker 数（默认 4）
PW_WORKERS=2 npm run test:e2e
```

---

## 📁 测试文件结构

```
src/
├── components/
│   └── game/
│       ├── BloodPact.tsx
│       └── BloodPact.test.tsx    # 组件测试
├── store/
│   └── slices/
│       ├── game.ts
│       └── game.test.ts          # Store 测试
├── lib/
│   ├── gameLogic.ts
│   └── gameLogic.test.ts         # 工具函数测试
└── hooks/
    ├── useLongPress.ts
    └── useLongPress.test.ts      # Hook 测试

tests/                            # 集成测试
├── integration/
│   └── gameFlow.test.ts
e2e/                              # Playwright E2E 测试
```

---

## 🧪 测试类型

### 1. 单元测试

测试独立函数和模块：

```typescript
// lib/utils.test.ts
import { toRomanNumeral } from './utils';

describe('toRomanNumeral', () => {
  it('converts 1 to I', () => {
    expect(toRomanNumeral(1)).toBe('I');
  });

  it('converts 4 to IV', () => {
    expect(toRomanNumeral(4)).toBe('IV');
  });
});
```

### 2. 组件测试

使用 Testing Library 测试 React 组件：

```typescript
// components/ui/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

### 3. Store 测试

测试 Zustand store：

```typescript
// store/slices/game.test.ts
import { useGameStore } from '../index';

describe('gameSlice', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
  });

  it('adds a seat', () => {
    useGameStore.getState().addSeat({ userName: 'Player1' });
    expect(useGameStore.getState().seats).toHaveLength(1);
  });
});
```

### 4. Hook 测试

使用 renderHook 测试自定义 Hook：

```typescript
// hooks/useLongPress.test.ts
import { renderHook, act } from '@testing-library/react';
import { useLongPress } from './useLongPress';

describe('useLongPress', () => {
  it('triggers onLongPress after delay', async () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();

    const { result } = renderHook(() => useLongPress({ onLongPress }));

    act(() => {
      result.current.onTouchStart();
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onLongPress).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
```

---

## 🎭 Mocking 指南

### Mock 外部模块

```typescript
// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));
```

### Mock Zustand Store

```typescript
vi.mock('../store', () => ({
  useGameStore: vi.fn(() => ({
    seats: [],
    phase: 'day',
    addSeat: vi.fn(),
  })),
}));
```

### Mock React Konva

```typescript
vi.mock('react-konva', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  return {
    Group: React.forwardRef(({ children }, ref) => (
      <div data-testid="konva-group">{children}</div>
    )),
    Circle: () => <div data-testid="konva-circle" />,
    Text: ({ text }) => <span>{text}</span>,
  };
});
```

### Mock 定时器

```typescript
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

it('delays execution', async () => {
  const callback = vi.fn();
  setTimeout(callback, 1000);

  vi.advanceTimersByTime(1000);
  expect(callback).toHaveBeenCalled();
});
```

---

## 📈 覆盖率报告

### 生成报告

```bash
npm run test:coverage
```

### 查看报告

覆盖率报告生成在 `coverage/` 目录：

```
coverage/
├── index.html          # HTML 报告 (浏览器打开)
├── lcov.info          # LCOV 格式
└── coverage-final.json # JSON 格式
```

### 覆盖率目标

| 指标 | 目标 |
|------|------|
| 行覆盖率 | 80% |
| 分支覆盖率 | 70% |
| 函数覆盖率 | 80% |

不要在文档中手写长期“当前覆盖率”。覆盖率会随测试和源码变化漂移，当前值以最新
`coverage/` 报告为准；该目录是生成物，可用 `npm run clean` 清理。

---

## ✅ 测试最佳实践

### DO ✅

```typescript
// 1. 描述性测试名称
it('renders error message when validation fails', () => {});

// 2. 测试行为而非实现
expect(screen.getByText('Error')).toBeInTheDocument();

// 3. 使用 data-testid 选择元素
<div data-testid="error-message">Error</div>
screen.getByTestId('error-message');

// 4. 清理副作用
afterEach(() => {
  vi.clearAllMocks();
});
```

### DON'T ❌

```typescript
// 1. 避免测试实现细节
expect(component.state.isLoading).toBe(true); // ❌

// 2. 避免脆弱的选择器
container.querySelector('.css-1234'); // ❌

// 3. 避免过度 mock
vi.mock('./everything'); // ❌
```

---

## 🔧 配置文件

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['node_modules', 'test/**'],
    },
  },
});
```

### src/test/setup.ts

```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});
```

---

## 🐛 调试测试

### 使用 console.log

```typescript
it('debug test', () => {
  const result = someFunction();
  console.log('Result:', result);
  expect(result).toBe(expected);
});
```

### 使用 screen.debug

```typescript
it('debug DOM', () => {
  render(<MyComponent />);
  screen.debug(); // 打印整个 DOM
  screen.debug(screen.getByRole('button')); // 打印特定元素
});
```

### 运行单个测试

```bash
npx vitest run --testNamePattern="specific test name"
```

---

## 🎭 E2E 测试 (Playwright)

### 运行 E2E 测试

```bash
# 运行所有 E2E 测试
npm run test:e2e

# 使用 UI 模式调试
npm run test:e2e:ui

# 调试模式
npm run test:e2e:debug

# 查看测试报告
npm run test:e2e:report

# 运行特定浏览器
npx playwright test --project=chromium
```

### E2E 测试文件结构

```
e2e/
├── accessibility.spec.ts    # 基础可访问性测试
├── home.spec.ts             # 首页与大厅测试
├── game-setup-flow.spec.ts  # 真实开局流程测试
├── multiplayer-flow.spec.ts # 多座位真实流程仿真
└── sandbox.spec.ts          # 沙盒模式测试
```

`game-setup-flow.spec.ts` 在 Mobile Chrome 项目中跳过；该移动端创建房间路径由
`home.spec.ts` 的快捷创建用例和 `multiplayer-flow.spec.ts` 的完整多人链路覆盖。

### E2E 测试示例

```typescript
import { test, expect } from '@playwright/test';

test.describe('首页', () => {
  test('应该显示创建房间按钮', async ({ page }) => {
    await page.goto('/');
    const createButton = page.getByRole('button', { name: /创建|新建/i });
    await expect(createButton).toBeVisible();
  });
});
```

### 浏览器配置

项目配置了以下浏览器测试：

| 浏览器 | 用途 |
|--------|------|
| Chromium | 桌面端 Chrome |
| Firefox | 桌面端 Firefox |
| Mobile Chrome | 移动端 Android |
| WebKit | 桌面端 Safari，需 `PW_INCLUDE_WEBKIT=1` |
| Mobile Safari | 移动端 iOS，需 `PW_INCLUDE_WEBKIT=1` |

---

## 📚 相关资源

- [Vitest 文档](https://vitest.dev/)
- [Testing Library 文档](https://testing-library.com/)
- [Playwright 文档](https://playwright.dev/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
