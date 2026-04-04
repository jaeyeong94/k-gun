"use client";

import { useAuthStore } from "@/stores/auth";
import { useBalance, useHoldings, useMarketIndex } from "@/hooks/use-account";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LogIn,
  Wallet,
  TrendingUp,
  TrendingDown,
  BarChart3,
  RefreshCw,
} from "lucide-react";

function formatNumber(n: number): string {
  return n.toLocaleString("ko-KR");
}

function ProfitText({ value, suffix = "원" }: { value: number; suffix?: string }) {
  const color =
    value > 0
      ? "text-red-500"
      : value < 0
        ? "text-blue-500"
        : "text-muted-foreground";
  const prefix = value > 0 ? "+" : "";
  return (
    <span className={color}>
      {prefix}
      {formatNumber(value)}
      {suffix}
    </span>
  );
}

export default function DashboardPage() {
  const { authenticated, mode, isLoading, login } = useAuthStore();
  const balance = useBalance();
  const holdings = useHoldings();
  const marketIndex = useMarketIndex();

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
              className="w-full min-h-[44px]"
            >
              <LogIn className="mr-2 size-4" />
              {isLoading ? "인증 중..." : "모의투자 로그인"}
            </Button>
            <Button
              onClick={() => login("prod")}
              disabled={isLoading}
              variant="destructive"
              className="w-full min-h-[44px]"
            >
              <LogIn className="mr-2 size-4" />
              {isLoading ? "인증 중..." : "실전투자 로그인"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const bal = balance.data?.data;
  const holdingList = holdings.data?.data ?? [];
  const kospi = marketIndex.data?.kospi;
  const kosdaq = marketIndex.data?.kosdaq;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">대시보드</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="min-h-[44px] min-w-[44px]"
            onClick={() => {
              balance.refetch();
              holdings.refetch();
              marketIndex.refetch();
            }}
          >
            <RefreshCw className="size-4" />
          </Button>
          <Badge variant={mode === "prod" ? "destructive" : "secondary"}>
            {mode === "prod" ? "실전투자" : "모의투자"}
          </Badge>
        </div>
      </div>

      {/* 잔고 카드 */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">예수금</CardTitle>
            <Wallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {balance.isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">
                {bal ? `${formatNumber(bal.deposit)}원` : "-"}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">총평가</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {balance.isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">
                {bal ? `${formatNumber(bal.total_eval)}원` : "-"}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">평가손익</CardTitle>
            <BarChart3 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {balance.isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">
                {bal ? <ProfitText value={bal.profit_loss} /> : "-"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 시장 지수 */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {[
          { data: kospi, label: "코스피" },
          { data: kosdaq, label: "코스닥" },
        ].map(({ data, label }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              {data && data.change >= 0 ? (
                <TrendingUp className="size-4 text-red-500" />
              ) : (
                <TrendingDown className="size-4 text-blue-500" />
              )}
            </CardHeader>
            <CardContent>
              {marketIndex.isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : data && typeof data.value === "number" ? (
                <>
                  <div className="text-2xl font-bold font-mono">
                    {data.value.toLocaleString("ko-KR", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                  <p className="text-sm">
                    <ProfitText value={data.change ?? 0} suffix="" />{" "}
                    <span className="text-muted-foreground">
                      (<ProfitText value={data.change_rate ?? 0} suffix="%" />)
                    </span>
                  </p>
                </>
              ) : (
                <div className="text-2xl font-bold text-muted-foreground">
                  -
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 보유종목 */}
      <Card>
        <CardHeader>
          <CardTitle>보유종목</CardTitle>
          <CardDescription>
            {holdingList.length > 0
              ? `${holdingList.length}개 종목 보유`
              : "보유 종목이 없습니다"}
          </CardDescription>
        </CardHeader>
        {holdingList.length > 0 && (
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-2 text-left font-medium">종목</th>
                    <th className="py-2 text-right font-medium whitespace-nowrap">수량</th>
                    <th className="py-2 text-right font-medium whitespace-nowrap">평균단가</th>
                    <th className="py-2 text-right font-medium whitespace-nowrap">현재가</th>
                    <th className="py-2 text-right font-medium whitespace-nowrap">평가금액</th>
                    <th className="py-2 text-right font-medium whitespace-nowrap">수익률</th>
                  </tr>
                </thead>
                <tbody>
                  {holdingList.map((h) => (
                    <tr key={h.stock_code} className="border-b last:border-0">
                      <td className="py-2">
                        <div className="font-medium">{h.stock_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {h.stock_code}
                        </div>
                      </td>
                      <td className="py-2 text-right font-mono">
                        {formatNumber(h.quantity)}
                      </td>
                      <td className="py-2 text-right font-mono">
                        {formatNumber(h.avg_price)}
                      </td>
                      <td className="py-2 text-right font-mono">
                        {formatNumber(h.current_price)}
                      </td>
                      <td className="py-2 text-right font-mono">
                        {formatNumber(h.eval_amount)}
                      </td>
                      <td className="py-2 text-right font-mono">
                        <ProfitText value={h.profit_rate} suffix="%" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
