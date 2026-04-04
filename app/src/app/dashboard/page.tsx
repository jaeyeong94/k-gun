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
import { LogIn, Wallet, TrendingUp, BarChart3 } from "lucide-react";

export default function DashboardPage() {
  const { authenticated, mode, isLoading, login } = useAuthStore();

  if (!authenticated) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">K-Gun</CardTitle>
            <CardDescription>
              한국투자증권 Open API 트레이딩 컨트롤패널
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button
              onClick={() => login("vps")}
              disabled={isLoading}
              className="w-full"
            >
              <LogIn className="mr-2 size-4" />
              {isLoading ? "인증 중..." : "모의투자 로그인"}
            </Button>
            <Button
              onClick={() => login("prod")}
              disabled={isLoading}
              variant="destructive"
              className="w-full"
            >
              <LogIn className="mr-2 size-4" />
              {isLoading ? "인증 중..." : "실전투자 로그인"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <Badge variant={mode === "prod" ? "destructive" : "secondary"}>
          {mode === "prod" ? "실전투자" : "모의투자"}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">예수금</CardTitle>
            <Wallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              /my-status로 확인 가능
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">총평가</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Phase 2에서 구현
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">평가손익</CardTitle>
            <BarChart3 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Phase 2에서 구현
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
