"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Zap,
  FlaskConical,
  Search,
  MessageSquare,
  Signal,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";

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
  const { authenticated, mode } = useAuthStore();
  const balance = useBalance();
  const holdings = useHoldings();
  const marketIndex = useMarketIndex();
  const router = useRouter();

  useEffect(() => {
    if (!authenticated) {
      router.replace("/login");
    }
  }, [authenticated, router]);

  if (!authenticated) {
    return null;
  }

  const bal = balance.data?.data;
  const holdingList = holdings.data?.data ?? [];
  const kospi = marketIndex.data?.kospi;
  const kosdaq = marketIndex.data?.kosdaq;

  return (
    <div className="space-y-6">
      <PageHeader icon={LayoutDashboard} title="대시보드">
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
      </PageHeader>

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

      {/* 최근 신호 & 빠른 액션 */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* 최근 신호 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Signal className="size-4" />
              최근 신호
            </CardTitle>
            <CardDescription>최근 트레이딩 신호 결과</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { stock: "삼성전자", action: "BUY" as const, strength: 0.82, time: "14:30" },
                { stock: "SK하이닉스", action: "HOLD" as const, strength: 0.45, time: "13:15" },
                { stock: "NAVER", action: "SELL" as const, strength: 0.71, time: "11:00" },
              ].map((signal) => (
                <div
                  key={`${signal.stock}-${signal.time}`}
                  className="flex items-center justify-between rounded-lg border p-2.5"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        signal.action === "BUY"
                          ? "destructive"
                          : signal.action === "SELL"
                            ? "secondary"
                            : "outline"
                      }
                      className="font-mono text-[10px]"
                    >
                      {signal.action === "BUY"
                        ? "매수"
                        : signal.action === "SELL"
                          ? "매도"
                          : "보류"}
                    </Badge>
                    <span className="text-sm font-medium">{signal.stock}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>강도 {(signal.strength * 100).toFixed(0)}%</span>
                    <span>{signal.time}</span>
                  </div>
                </div>
              ))}
              <p className="text-center text-[11px] text-muted-foreground/60">
                예시 데이터입니다. 전략 실행 시 실제 신호가 표시됩니다.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 빠른 액션 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="size-4" />
              빠른 액션
            </CardTitle>
            <CardDescription>자주 사용하는 기능 바로가기</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "전략 실행", href: "/trading", icon: Zap, color: "text-red-500 bg-red-500/10" },
                { label: "백테스트", href: "/backtest", icon: FlaskConical, color: "text-purple-500 bg-purple-500/10" },
                { label: "종목 탐색", href: "/explorer", icon: Search, color: "text-blue-500 bg-blue-500/10" },
                { label: "AI 질문", href: "/chat", icon: MessageSquare, color: "text-green-500 bg-green-500/10" },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 hover:border-primary/30"
                >
                  <div className={`flex size-9 items-center justify-center rounded-lg ${action.color}`}>
                    <action.icon className="size-4" />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
