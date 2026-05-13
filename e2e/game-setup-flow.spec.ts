import { test, expect, type Locator, type Page } from '@playwright/test';

const enterRegex = /进入魔典|Enter Grimoire|以玩家身份进入|Enter as Player/i;
const createRoomRegex = /创建仪式|Create Ritual/i;
const confirmAudioSetupRegex = /confirmsetup|confirm setup|确认|完成/i;
const onlineAudioModeRegex = /onlinemode|online mode|在线/i;
const enterGrimoireRegex = /entergrimoire|enter grimoire|进入魔典|开始|→/i;

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

const gotoHome = async (page: Page) => {
  let lastError: unknown;
  const appReady = page
    .getByRole('button', { name: enterRegex })
    .or(page.getByRole('button', { name: createRoomRegex }))
    .first();

  for (let attempt = 1; attempt <= 3; attempt++) {
    await page.goto('/', { waitUntil: 'commit', timeout: 15000 }).catch(error => {
      lastError = error;
    });

    try {
      await expect(appReady).toBeVisible({ timeout: 10000 });
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

const loginToRoomSelection = async (page: Page, name: string) => {
  let lastError: unknown;
  const createButton = page.getByRole('button', { name: createRoomRegex });

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      if (await createButton.isVisible({ timeout: 750 }).catch(() => false)) {
        return;
      }
      await gotoHome(page);
      const nicknameInput = page.locator('input[type="text"]').first();
      await nicknameInput.fill(name);
      const enterButton = page.getByRole('button', { name: enterRegex });

      await clickSafely(enterButton);
      const firstTry = await createButton.isVisible({ timeout: 10000 }).catch(() => false);
      if (!firstTry) {
        const stillInLobby = await enterButton.isVisible({ timeout: 1000 }).catch(() => false);
        if (stillInLobby) {
          await clickSafely(enterButton);
          await submitLobbyForm(page);
        }
      }
      await expect(createButton).toBeVisible({ timeout: 12000 });
      return;
    } catch (error) {
      lastError = error;
      if (await createButton.isVisible({ timeout: 750 }).catch(() => false)) {
        return;
      }
      if (attempt < 3 && !page.isClosed()) {
        await page.waitForTimeout(900);
      }
    }
  }
  throw lastError;
};

const dismissAudioSetupIfNeeded = async (page: Page) => {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const overlay = page.locator('div.fixed.inset-0.z-\\[100\\]').first();
    const hasOverlay = await overlay.isVisible({ timeout: 1200 }).catch(() => false);
    if (!hasOverlay) return;

    const onlineModeButton = page.getByRole('button', { name: onlineAudioModeRegex }).first();
    const confirmSetupButton = page.getByRole('button', { name: confirmAudioSetupRegex }).first();
    const enterGrimoireButton = page.getByRole('button', { name: enterGrimoireRegex }).first();

    if (await confirmSetupButton.isVisible({ timeout: 800 }).catch(() => false)) {
      if (await onlineModeButton.isVisible({ timeout: 500 }).catch(() => false)) {
        await clickSafely(onlineModeButton);
      }
      await clickSafely(confirmSetupButton);
      continue;
    }

    if (await enterGrimoireButton.isVisible({ timeout: 800 }).catch(() => false)) {
      await clickSafely(enterGrimoireButton);
      continue;
    }

    await page.keyboard.press('Escape').catch(() => undefined);
    await page.waitForTimeout(300);
  }
};

test.describe('真实开局流程', () => {
  test('应支持创建房间并进入开局等待区', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name === 'Mobile Chrome',
      'Mobile creation coverage lives in home.spec.ts and multiplayer-flow.spec.ts; this duplicate path is navigation-flaky on mobile.'
    );
    test.setTimeout(75_000);

    await loginToRoomSelection(page, 'FlowTester');

    await clickSafely(page.getByRole('button', { name: createRoomRegex }));
    await expect.poll(async () => {
      return page.evaluate(() => localStorage.getItem('grimoire_last_room'));
    }).toMatch(/^[A-Z0-9]{4}$/);
    const roomCode = await page.evaluate(() => localStorage.getItem('grimoire_last_room'));

    await dismissAudioSetupIfNeeded(page);

    const seatButton = page.locator('button').filter({ hasText: /OPEN|座位|Seat/i }).first();
    const roomHeading = page.getByRole('heading', { name: /[A-Z0-9]{4}/ }).first();
    await expect.poll(async () => {
      const seatVisible = await seatButton.isVisible().catch(() => false);
      const headingVisible = await roomHeading.isVisible().catch(() => false);
      return seatVisible || headingVisible;
    }, { timeout: 15000 }).toBe(true);
    await expect(roomHeading).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/FlowTester/i)).toBeVisible({ timeout: 10000 });
    expect(roomCode).toBeTruthy();
  });
});
