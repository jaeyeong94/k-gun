"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth";
import { Circle } from "lucide-react";

export function StatusBar() {
  const { authenticated, mode } = useAuthStore();
  const [backendStatus, setBackendStatus] = useState<
    "connected" | "disconnected" | "checking"
  >("checking");

  useEffect(() => {
    async function checkBackend() {
      try {
        const res = await fetch("/api/strategy/auth/status", {
          signal: AbortSignal.timeout(3000),
        });
        setBackendStatus(res.ok ? "connected" : "disconnected");
      } catch {
        setBackendStatus("disconnected");
      }
    }

    checkBackend();
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="flex h-8 shrink-0 items-center gap-2 sm:gap-4 border-t bg-muted/30 px-3 sm:px-4 text-[11px] sm:text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <Circle
          className={`size-2 fill-current ${
            backendStatus === "connected"
              ? "text-green-500"
              : backendStatus === "disconnected"
                ? "text-red-500"
                : "text-yellow-500"
          }`}
        />
        <span>
          {backendStatus === "connected"
            ? "서버 연결됨"
            : backendStatus === "disconnected"
              ? "서버 연결 안됨"
              : "확인 중..."}
        </span>
      </div>

      <span className="hidden sm:inline text-muted-foreground/50">|</span>
      <span className="hidden sm:inline text-[10px] text-muted-foreground/50">
        본 서비스는 투자 권유가 아니며, 투자 책임은 본인에게 있습니다.
      </span>

      <div className="flex-1" />

      <span>
        {authenticated
          ? `${mode === "prod" ? "실전" : "모의"}투자 모드`
          : "미인증"}
      </span>
    </footer>
  );
}
