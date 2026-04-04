import fs from "fs";
import path from "path";

const CONFIG_ROOT = path.join(
  process.env.HOME ?? "/root",
  "KIS",
  "config",
);

/**
 * 서버 사이드에서 KIS 인증 상태를 확인합니다.
 * Zustand 없이 토큰 파일 존재 여부로 판단합니다.
 */
export function getServerAuthStatus(): {
  authenticated: boolean;
  mode: "vps" | "prod" | null;
} {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const tokenPath = path.join(CONFIG_ROOT, `KIS${today}`);

  if (!fs.existsSync(tokenPath)) {
    return { authenticated: false, mode: null };
  }

  try {
    const content = fs.readFileSync(tokenPath, "utf-8");
    const hasToken = content.includes("token:");
    const validDateMatch = content.match(/valid-date:\s*(.+)/);

    if (!hasToken || !validDateMatch) {
      return { authenticated: false, mode: null };
    }

    const validDate = validDateMatch[1].trim();
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    if (validDate <= now) {
      return { authenticated: false, mode: null };
    }

    // 모드 판별: KIS_MODE 파일 확인
    const modePath = path.join(CONFIG_ROOT, "KIS_MODE");
    let mode: "vps" | "prod" = "vps";
    if (fs.existsSync(modePath)) {
      const modeContent = fs.readFileSync(modePath, "utf-8").trim();
      if (modeContent === "prod") mode = "prod";
    }

    return { authenticated: true, mode };
  } catch {
    return { authenticated: false, mode: null };
  }
}
