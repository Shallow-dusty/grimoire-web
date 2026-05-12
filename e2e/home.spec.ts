import { test, expect, type Locator, type Page } from '@playwright/test';

const enterRegex = /进入魔典|Enter Grimoire|以玩家身份进入|Enter as Player/i;
const createRoomRegex = /创建仪式|Create Ritual/i;
const sandboxModeRegex = /沙盒模式|Sandbox Mode/i;

const clickSafely = async (locator: Locator) => {
  await expect(locator).toBeVisible();
  await locator.scrollIntoViewIfNeeded().catch(() => undefined);
  await locator.click({ timeout: 2000 }).catch(async () => {
    await locator.evaluate((element: HTMLElement) => element.click());
  });
};

const submitLobbyForm = async (page: Page) => {
  await page.locator('form').first().evaluate((form: HTMLFormElement) => {
    form.requestSubmit();
  });
};

const gotoHome = async (page: Page, path = '/') => {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await expect(page.locator('#root')).toBeVisible({ timeout: 10000 });
      return;
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await page.waitForTimeout(800);
      }
    }
  }
  throw lastError;
};

const loginToRoomSelection = async (page: Page, path = '/') => {
  await gotoHome(page, path);
  const nicknameInput = page.locator('input[type="text"]').first();
  await nicknameInput.fill('E2E Tester');
  const enterButton = page.getByRole('button', { name: enterRegex });
  const createButton = page.getByRole('button', { name: createRoomRegex });

  await clickSafely(enterButton);
  const firstTry = await createButton.isVisible({ timeout: 10000 }).catch(() => false);
  if (!firstTry) {
    const stillInLobby = await enterButton.isVisible({ timeout: 1000 }).catch(() => false);
    if (stillInLobby) {
      await clickSafely(enterButton);
      await submitLobbyForm(page);
    }
    await expect(createButton).toBeVisible({ timeout: 12000 });
  }
};

test.describe('大厅与房间选择', () => {
  test.describe.configure({ timeout: 60_000 });

  test('首页应显示标题与进入按钮', async ({ page }) => {
    await gotoHome(page);
    await expect(page).toHaveTitle(/血染钟楼|Grimoire/i);
    await expect(page.getByRole('button', { name: enterRegex })).toBeVisible();
  });

  test('昵称为空时进入按钮禁用，输入后可用', async ({ page }) => {
    await gotoHome(page);
    const nicknameInput = page.locator('input[type="text"]').first();
    const enterButton = page.getByRole('button', { name: enterRegex });

    await expect(enterButton).toBeDisabled();
    await nicknameInput.fill('Tester');
    await expect(enterButton).toBeEnabled();
  });

  test('提交昵称后应进入房间选择页', async ({ page }) => {
    await loginToRoomSelection(page);
    await expect(page.getByRole('button', { name: createRoomRegex })).toBeVisible();
    await expect(page.getByPlaceholder('8888')).toBeVisible();
  });

  test('房间选择页应可进入沙盒模式', async ({ page }) => {
    await loginToRoomSelection(page);

    const sandboxButton = page.getByRole('button', { name: sandboxModeRegex }).first();
    const sandboxVisible = await sandboxButton.isVisible({ timeout: 1200 }).catch(() => false);
    if (!sandboxVisible) {
      const expandButton = page.getByRole('button', { name: /展开|Expand|收起|Collapse/i }).first();
      const expandVisible = await expandButton.isVisible({ timeout: 1200 }).catch(() => false);
      if (expandVisible) {
        await clickSafely(expandButton);
      }
    }

    await clickSafely(sandboxButton);

    await expect(page.getByText(sandboxModeRegex).first()).toBeVisible();
  });

  test('创建房间快捷方式应进入说书人并自动创建默认房间', async ({ page }) => {
    await gotoHome(page, '/?action=create-room');

    await expect(page.getByRole('button', { name: /进入魔典|Enter Grimoire/i })).toBeVisible();
    await page.locator('input[type="text"]').first().fill('Shortcut Host');
    await clickSafely(page.getByRole('button', { name: /进入魔典|Enter Grimoire/i }));

    await expect.poll(async () => {
      return page.evaluate(() => localStorage.getItem('grimoire_last_room'));
    }, { timeout: 15000 }).toMatch(/^[A-Z0-9]{4}$/);
    await expect(page).not.toHaveURL(/action=create-room/);
  });

  test('加入房间快捷方式应聚焦房间号输入', async ({ page }) => {
    await loginToRoomSelection(page, '/?action=join-room');

    await expect(page.getByPlaceholder('8888')).toBeFocused();
  });
});
