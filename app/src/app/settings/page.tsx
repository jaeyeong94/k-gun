"use client";

import { useEffect, useState, useCallback, useSyncExternalStore } from "react";
import { useAuthStore } from "@/stores/auth";
import { useThemeStore } from "@/stores/theme";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sun,
  Moon,
  Monitor,
  Circle,
  RefreshCw,
  LogOut,
  Settings,
  Bell,
  BellOff,
} from "lucide-react";
import { useNotificationStore } from "@/stores/notifications";

// ---------------------------------------------------------------------------
// Theme selector options
// ---------------------------------------------------------------------------
const themeOptions = [
  { value: "light" as const, label: "라이트", icon: Sun, description: "밝은 테마" },
  { value: "dark" as const, label: "다크", icon: Moon, description: "어두운 테마" },
  {
    value: "system" as const,
    label: "시스템",
    icon: Monitor,
    description: "OS 설정 따르기",
  },
];

// ---------------------------------------------------------------------------
// Server health check targets
// ---------------------------------------------------------------------------
const serverTargets = [
  { name: "Strategy Builder", port: 8000, path: "/api/strategy/health" },
  { name: "Backtester", port: 8002, path: "/api/backtest/health" },
  { name: "MCP Server", port: 3846, path: "/api/mcp/health" },
];

type ServerStatus = "loading" | "online" | "offline";

interface MasterFileInfo {
  kospiCount: number | null;
  kosdaqCount: number | null;
  lastUpdated: string | null;
  isLoading: boolean;
  isCollecting: boolean;
}

// ---------------------------------------------------------------------------
// Notification settings card
// ---------------------------------------------------------------------------
function NotificationSettingsCard() {
  const { enabled, requestPermission, clearNotifications, notifications } =
    useNotificationStore();

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []); // eslint-disable-line react-hooks/set-state-in-effect

  const [permRefresh, setPermRefresh] = useState(0);
  const permissionStatus = useSyncExternalStore(
    useCallback((cb) => {
      // No native event for permission change; re-sync via permRefresh
      void permRefresh; // keep dep
      return () => {};
    }, [permRefresh]),
    () => {
      if (!("Notification" in window)) return "unsupported" as const;
      return Notification.permission as "granted" | "denied" | "default";
    },
    () => "default" as const,
  );

  const handleRequestPermission = async () => {
    await requestPermission();
    setPermRefresh((n) => n + 1);
  };

  const statusText: Record<string, string> = {
    granted: "허용됨",
    denied: "거부됨",
    default: "미설정",
    unsupported: "미지원",
  };

  const statusVariant: Record<string, "secondary" | "destructive" | "outline"> =
    {
      granted: "secondary",
      denied: "destructive",
      default: "outline",
      unsupported: "outline",
    };

  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>알림</CardTitle>
          <CardDescription>브라우저 푸시 알림 설정</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-9 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>알림</CardTitle>
        <CardDescription>브라우저 푸시 알림 설정</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">알림 권한:</span>
            <Badge variant={statusVariant[permissionStatus]}>
              {statusText[permissionStatus]}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {enabled ? (
              <Bell className="size-4 text-green-500" />
            ) : (
              <BellOff className="size-4 text-muted-foreground" />
            )}
            <span className="text-sm">
              {enabled ? "활성화" : "비활성화"}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {permissionStatus !== "granted" && permissionStatus !== "unsupported" && (
            <Button
              variant="outline"
              onClick={handleRequestPermission}
              disabled={permissionStatus === "denied"}
            >
              <Bell className="mr-2 size-4" />
              {permissionStatus === "denied"
                ? "브라우저 설정에서 허용 필요"
                : "권한 요청"}
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="outline" onClick={clearNotifications}>
              알림 기록 삭제 ({notifications.length})
            </Button>
          )}
        </div>

        {permissionStatus === "denied" && (
          <p className="text-xs text-muted-foreground">
            알림 권한이 거부되었습니다. 브라우저 주소창의 자물쇠 아이콘을 클릭하여
            알림을 허용해주세요.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function SettingsPage() {
  const {
    authenticated,
    mode,
    modeDisplay,
    canSwitchMode,
    cooldownRemaining,
    isLoading,
    logout,
    switchMode,
  } = useAuthStore();

  const { theme, setTheme } = useThemeStore();

  // Server statuses
  const [serverStatuses, setServerStatuses] = useState<
    Record<string, ServerStatus>
  >(() =>
    Object.fromEntries(serverTargets.map((t) => [t.name, "loading" as const])),
  );

  // Master file info
  const [masterFile, setMasterFile] = useState<MasterFileInfo>({
    kospiCount: null,
    kosdaqCount: null,
    lastUpdated: null,
    isLoading: true,
    isCollecting: false,
  });

  // ---------------------------------------------------------------------------
  // Server health checks
  // ---------------------------------------------------------------------------
  const checkServerHealth = useCallback(async () => {
    const results = await Promise.allSettled(
      serverTargets.map(async (target) => {
        try {
          const res = await fetch(target.path, {
            signal: AbortSignal.timeout(3000),
          });
          return { name: target.name, status: res.ok ? "online" : "offline" } as const;
        } catch {
          return { name: target.name, status: "offline" } as const;
        }
      }),
    );

    const next: Record<string, ServerStatus> = {};
    for (const result of results) {
      if (result.status === "fulfilled") {
        next[result.value.name] = result.value.status;
      }
    }
    setServerStatuses((prev) => ({ ...prev, ...next }));
  }, []);

  useEffect(() => {
    checkServerHealth();
    const interval = setInterval(checkServerHealth, 15000);
    return () => clearInterval(interval);
  }, [checkServerHealth]);

  // ---------------------------------------------------------------------------
  // Master file info
  // ---------------------------------------------------------------------------
  const fetchMasterFileInfo = useCallback(async () => {
    setMasterFile((prev) => ({ ...prev, isLoading: true }));
    try {
      const res = await fetch("/api/strategy/symbols/status");
      if (!res.ok) throw new Error();
      const data = await res.json();
      const updated = data.kospi_updated ?? data.kosdaq_updated ?? null;
      setMasterFile({
        kospiCount: data.kospi_count ?? null,
        kosdaqCount: data.kosdaq_count ?? null,
        lastUpdated: updated ? new Date(updated).toLocaleString("ko-KR") : null,
        isLoading: false,
        isCollecting: false,
      });
    } catch {
      setMasterFile((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    fetchMasterFileInfo();
  }, [fetchMasterFileInfo]);

  const collectMasterFile = async () => {
    setMasterFile((prev) => ({ ...prev, isCollecting: true }));
    try {
      const res = await fetch("/api/strategy/symbols/collect", {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      await fetchMasterFileInfo();
    } catch {
      setMasterFile((prev) => ({ ...prev, isCollecting: false }));
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="size-6" />
        <h1 className="text-2xl font-bold">설정</h1>
      </div>

      {/* ── 인증 섹션 ── */}
      <Card>
        <CardHeader>
          <CardTitle>인증</CardTitle>
          <CardDescription>KIS API 인증 상태 관리</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">상태:</span>
            {authenticated ? (
              <Badge variant={mode === "prod" ? "destructive" : "secondary"}>
                {modeDisplay}
              </Badge>
            ) : (
              <Badge variant="outline">미인증</Badge>
            )}
          </div>

          {authenticated && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={switchMode}
                disabled={isLoading || !canSwitchMode}
              >
                <RefreshCw className="mr-2 size-4" />
                {canSwitchMode
                  ? "모드 전환"
                  : `전환 대기 (${cooldownRemaining}초)`}
              </Button>
              <Button
                variant="destructive"
                onClick={logout}
                disabled={isLoading}
              >
                <LogOut className="mr-2 size-4" />
                로그아웃
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 테마 섹션 ── */}
      <Card>
        <CardHeader>
          <CardTitle>테마</CardTitle>
          <CardDescription>인터페이스 테마를 선택하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map(({ value, label, icon: Icon, description }) => {
              const selected = theme === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-muted/50 hover:bg-muted"
                  }`}
                >
                  <Icon className={`size-6 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-sm font-medium ${selected ? "text-primary" : ""}`}>
                    {label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {description}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── 알림 섹션 ── */}
      <NotificationSettingsCard />

      {/* ── 서버 상태 섹션 ── */}
      <Card>
        <CardHeader>
          <CardTitle>서버 상태</CardTitle>
          <CardDescription>백엔드 서비스 연결 상태</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {serverTargets.map((target) => {
            const status = serverStatuses[target.name];
            return (
              <div
                key={target.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Circle
                    className={`size-3 ${
                      status === "online"
                        ? "fill-green-500 text-green-500"
                        : status === "offline"
                          ? "fill-red-500 text-red-500"
                          : "fill-muted-foreground/30 text-muted-foreground/30 animate-pulse"
                    }`}
                  />
                  <span className="text-sm font-medium">{target.name}</span>
                </div>
                <Badge
                  variant={status === "online" ? "secondary" : "outline"}
                  className="text-xs"
                >
                  {status === "online"
                    ? "연결됨"
                    : status === "offline"
                      ? "연결 안됨"
                      : "확인 중..."}
                </Badge>
              </div>
            );
          })}

          <Separator />

          <Button
            variant="outline"
            size="sm"
            onClick={checkServerHealth}
            className="w-full"
          >
            <RefreshCw className="mr-2 size-4" />
            새로고침
          </Button>
        </CardContent>
      </Card>

      {/* ── 마스터 파일 섹션 ── */}
      <Card>
        <CardHeader>
          <CardTitle>마스터 파일</CardTitle>
          <CardDescription>
            종목 심볼 마스터 데이터 관리
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">KOSPI 종목 수</span>
              {masterFile.isLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <p className="text-lg font-semibold">
                  {masterFile.kospiCount != null
                    ? masterFile.kospiCount.toLocaleString()
                    : "-"}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">KOSDAQ 종목 수</span>
              {masterFile.isLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <p className="text-lg font-semibold">
                  {masterFile.kosdaqCount != null
                    ? masterFile.kosdaqCount.toLocaleString()
                    : "-"}
                </p>
              )}
            </div>
          </div>

          {masterFile.lastUpdated && (
            <p className="text-xs text-muted-foreground">
              최종 업데이트: {masterFile.lastUpdated}
            </p>
          )}

          <Button
            variant="outline"
            onClick={collectMasterFile}
            disabled={masterFile.isCollecting}
            className="w-full"
          >
            <RefreshCw
              className={`mr-2 size-4 ${masterFile.isCollecting ? "animate-spin" : ""}`}
            />
            {masterFile.isCollecting ? "수집 중..." : "마스터 파일 수집"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
