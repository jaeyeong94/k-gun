"use client";

import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, RefreshCw } from "lucide-react";

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

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">설정</h1>

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
              <Button variant="destructive" onClick={logout} disabled={isLoading}>
                <LogOut className="mr-2 size-4" />
                로그아웃
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
