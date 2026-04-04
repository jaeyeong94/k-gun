"use client";

import { useBalance, useHoldings } from "@/hooks/use-account";
import { useAuthStore } from "@/stores/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw, PieChart, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const COLORS = [
  "#245bee",
  "#ef4444",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

function formatNumber(n: number): string {
  return n.toLocaleString("ko-KR");
}

function ProfitBadge({ rate }: { rate: number }) {
  if (rate > 0) {
    return (
      <Badge variant="destructive" className="gap-1 font-mono">
        <ArrowUpRight className="size-3" />+{rate.toFixed(2)}%
      </Badge>
    );
  }
  if (rate < 0) {
    return (
      <Badge variant="secondary" className="gap-1 font-mono text-blue-500">
        <ArrowDownRight className="size-3" />
        {rate.toFixed(2)}%
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="font-mono">
      0.00%
    </Badge>
  );
}

export default function PortfolioPage() {
  const { authenticated } = useAuthStore();
  const balance = useBalance();
  const holdings = useHoldings();

  if (!authenticated) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        로그인 후 이용 가능합니다
      </div>
    );
  }

  const bal = balance.data?.data;
  const holdingList = holdings.data?.data ?? [];
  const isLoading = balance.isLoading || holdings.isLoading;

  const totalEval = bal?.total_eval ?? 0;
  const cashRatio = totalEval > 0 ? ((bal?.deposit ?? 0) / totalEval) * 100 : 0;

  const pieData = [
    ...holdingList.map((h) => ({
      name: h.stock_name,
      value: h.eval_amount,
      code: h.stock_code,
    })),
    ...(bal && bal.deposit > 0
      ? [{ name: "현금", value: bal.deposit, code: "CASH" }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">포트폴리오</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            balance.refetch();
            holdings.refetch();
          }}
        >
          <RefreshCw className="size-4" />
        </Button>
      </div>

      {/* 요약 */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "총평가", value: bal?.total_eval },
          { label: "매입금액", value: bal?.purchase_amount },
          { label: "평가금액", value: bal?.eval_amount },
          { label: "평가손익", value: bal?.profit_loss, isProfit: true },
        ].map(({ label, value, isProfit }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-28" />
              ) : (
                <div
                  className={`text-xl font-bold font-mono ${
                    isProfit && value !== undefined
                      ? value > 0
                        ? "text-red-500"
                        : value < 0
                          ? "text-blue-500"
                          : ""
                      : ""
                  }`}
                >
                  {value !== undefined
                    ? `${isProfit && value > 0 ? "+" : ""}${formatNumber(value)}원`
                    : "-"}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* 구성 비율 차트 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="size-4" />
              구성 비율
            </CardTitle>
            <CardDescription>
              현금 {cashRatio.toFixed(1)}% / 주식{" "}
              {(100 - cashRatio).toFixed(1)}%
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <RechartsPie>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    dataKey="value"
                    nameKey="name"
                    paddingAngle={2}
                  >
                    {pieData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={COLORS[i % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `${formatNumber(Number(value))}원`}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-muted-foreground">
                데이터 없음
              </div>
            )}
          </CardContent>
        </Card>

        {/* 보유종목 상세 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>보유종목 상세</CardTitle>
            <CardDescription>
              {holdingList.length > 0
                ? `${holdingList.length}개 종목`
                : "보유 종목이 없습니다"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {holdingList.length > 0 ? (
              <div className="space-y-3">
                {holdingList.map((h, i) => (
                  <div
                    key={h.stock_code}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="size-3 rounded-full"
                        style={{
                          backgroundColor: COLORS[i % COLORS.length],
                        }}
                      />
                      <div>
                        <div className="font-medium">{h.stock_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {h.stock_code} | {formatNumber(h.quantity)}주 |
                          평균 {formatNumber(h.avg_price)}원
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-medium">
                        {formatNumber(h.eval_amount)}원
                      </div>
                      <ProfitBadge rate={h.profit_rate} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                보유 종목이 없습니다. 트레이딩 메뉴에서 매수해보세요.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
