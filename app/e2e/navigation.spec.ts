import { test, expect } from "@playwright/test";

// 사이드바 네비게이션 항목 (app-sidebar.tsx의 menuGroups 기반)
const sidebarLinks = [
  { title: "대시보드", href: "/dashboard" },
  { title: "전략 빌더", href: "/strategy" },
  { title: "백테스트", href: "/backtest" },
  { title: "트레이딩", href: "/trading" },
  { title: "종목 탐색", href: "/explorer" },
  { title: "워치리스트", href: "/watchlist" },
  { title: "포트폴리오", href: "/portfolio" },
  { title: "리스크", href: "/risk" },
  { title: "성과 추적", href: "/performance" },
  { title: "매매 저널", href: "/journal" },
  { title: "AI 챗봇", href: "/chat" },
  { title: "포지션 계산기", href: "/tools" },
  { title: "시장 캘린더", href: "/calendar" },
  { title: "뉴스", href: "/news" },
  { title: "설정", href: "/settings" },
];

test.describe("사이드바 네비게이션", () => {
  test("모든 사이드바 링크가 올바른 페이지로 이동해야 한다", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);

    for (const link of sidebarLinks) {
      // 사이드바에서 링크 클릭
      const sidebarLink = page.locator(`a[href="${link.href}"]`).first();
      await sidebarLink.click();

      // URL이 올바르게 변경되었는지 확인
      await expect(page).toHaveURL(new RegExp(link.href));
    }
  });

  test("루트 경로(/)가 대시보드로 리다이렉트되어야 한다", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
