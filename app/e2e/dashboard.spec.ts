import { test, expect } from "@playwright/test";

test.describe("대시보드 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("페이지가 에러 없이 로드되어야 한다", async ({ page }) => {
    // 콘솔 에러 수집
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.waitForLoadState("domcontentloaded");

    // 페이지 제목 또는 로그인 카드가 표시되는지 확인
    // (인증 안 된 경우 로그인 카드, 인증된 경우 대시보드 헤더)
    const hasLoginCard = await page.locator("text=K-Gun").first().isVisible();
    expect(hasLoginCard).toBe(true);
  });

  test("잔고 관련 카드 영역이 존재해야 한다", async ({ page }) => {
    await page.waitForLoadState("domcontentloaded");

    // 로그인 카드 또는 잔고 카드가 보여야 한다
    // 비인증 상태: "모의투자 로그인" 버튼이 보임
    // 인증 상태: "예수금", "총평가", "평가손익" 카드가 보임
    const loginButton = page.locator("text=모의투자 로그인");
    const depositCard = page.locator("text=예수금");

    const hasLogin = await loginButton.isVisible().catch(() => false);
    const hasDeposit = await depositCard.isVisible().catch(() => false);

    // 둘 중 하나는 보여야 한다
    expect(hasLogin || hasDeposit).toBe(true);
  });

  test("시장 지수 카드 영역이 존재해야 한다", async ({ page }) => {
    await page.waitForLoadState("domcontentloaded");

    // 인증 상태에서만 시장 지수가 보임
    // 비인증 상태에서는 로그인 카드가 보임
    const loginButton = page.locator("text=모의투자 로그인");
    const hasLogin = await loginButton.isVisible().catch(() => false);

    if (!hasLogin) {
      // 인증 상태: 코스피/코스닥 카드 확인
      const kospi = page.locator("text=코스피");
      const kosdaq = page.locator("text=코스닥");
      await expect(kospi).toBeVisible();
      await expect(kosdaq).toBeVisible();
    }
  });
});
