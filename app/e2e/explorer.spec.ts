import { test, expect } from "@playwright/test";

test.describe("종목 탐색 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/explorer");
  });

  test("검색 입력창이 동작해야 한다", async ({ page }) => {
    // 검색 입력 필드 확인
    const searchInput = page.locator(
      'input[placeholder*="종목 코드 또는 이름으로 검색"]'
    );
    await expect(searchInput).toBeVisible();

    // 검색어 입력
    await searchInput.fill("삼성");
    await expect(searchInput).toHaveValue("삼성");

    // 검색 결과 영역이 나타나는지 확인
    const searchResults = page.getByText("검색 결과", { exact: true });
    await expect(searchResults).toBeVisible({ timeout: 5000 });
  });

  test("인기 종목 버튼이 클릭 가능해야 한다", async ({ page }) => {
    // 인기 종목 섹션 확인
    await expect(page.locator("text=인기 종목")).toBeVisible();

    // 삼성전자 버튼 클릭
    const samsungButton = page.locator("button", { hasText: "삼성전자" });
    await expect(samsungButton).toBeVisible();
    await samsungButton.click();

    // 클릭 후 종목 상세 섹션이 나타나는지 확인 (현재가 카드)
    const priceSection = page.locator("text=현재가").or(page.locator("text=실시간 시세"));
    await expect(priceSection.first()).toBeVisible({ timeout: 10000 });
  });

  test("종목 상세 섹션이 클릭 후 나타나야 한다", async ({ page }) => {
    // SK하이닉스 버튼 클릭
    const skButton = page.locator("button", { hasText: "SK하이닉스" });
    await skButton.click();

    // 신호 확인 링크가 나타나는지 확인
    const signalLink = page.locator("text=신호 확인");
    await expect(signalLink).toBeVisible({ timeout: 10000 });
  });
});
