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
import {
  Shield,
  AlertTriangle,
  BarChart3,
  Wallet,
  TrendingUp,
} from "lucide-react";
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

interface ConcentrationItem {
  name: string;
  code: string;
  ratio: number;
  value: number;
}

function ConcentrationWarning({
  items,
}: {
  items: ConcentrationItem[];
}) {
  const warnings = items.filter((item) => item.ratio > 30);

  if (warnings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Shield className="size-4 text-green-500" />
            집중도 경고
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Badge variant="outline" className="text-green-600 border-green-300">
              안전
            </Badge>
            단일 종목 30% 초과 없음
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 dark:border-amber-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <AlertTriangle className="size-4 text-amber-500" />
          집중도 경고
        </CardTitle>
        <CardDescription>
          단일 종목이 포트폴리오의 30%를 초과합니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {warnings.map((item) => (
            <div
              key={item.code}
              className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-2 dark:border-amber-800 dark:bg-amber-950/30"
            >
              <div>
                <span className="font-medium">{item.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {item.code}
                </span>
              </div>
              <Badge variant="destructive" className="font-mono">
                {item.ratio.toFixed(1)}%
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function RiskPage() {
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
  const deposit = bal?.deposit ?? 0;
  const cashRatio = totalEval > 0 ? (deposit / totalEval) * 100 : 0;

  // Portfolio composition data
  const compositionData = [
    ...holdingList.map((h) => ({
      name: h.stock_name,
      value: h.eval_amount,
      code: h.stock_code,
    })),
    ...(deposit > 0 ? [{ name: "현금", value: deposit, code: "CASH" }] : []),
  ];

  // Concentration data
  const concentrationItems: ConcentrationItem[] = holdingList.map((h) => ({
    name: h.stock_name,
    code: h.stock_code,
    ratio: totalEval > 0 ? (h.eval_amount / totalEval) * 100 : 0,
    value: h.eval_amount,
  }));

  // Largest position
  const largestPosition =
    holdingList.length > 0
      ? holdingList.reduce((max, h) =>
          h.eval_amount > max.eval_amount ? h : max,
        )
      : null;

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
        <Shield className="size-6" />
        리스크 대시보드
      </h1>

      {/* Metrics Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <BarChart3 className="mr-1 inline size-3" />
              보유 종목 수
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-xl font-bold font-mono">
                {holdingList.length}개
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <TrendingUp className="mr-1 inline size-3" />
              최대 포지션
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : largestPosition ? (
              <div>
                <div className="text-base font-bold truncate">
                  {largestPosition.stock_name}
                </div>
                <div className="text-xs font-mono text-muted-foreground">
                  {formatNumber(largestPosition.eval_amount)}원
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">-</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <Wallet className="mr-1 inline size-3" />
              현금 비율
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-xl font-bold font-mono">
                {cashRatio.toFixed(1)}%
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              총 평가금액
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <div className="text-xl font-bold font-mono">
                {formatNumber(totalEval)}원
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Donut Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">포트폴리오 구성</CardTitle>
            <CardDescription>
              자산별 비중 현황
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="mx-auto h-[220px] w-[220px] rounded-full" />
            ) : compositionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPie>
                  <Pie
                    data={compositionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    dataKey="value"
                    nameKey="name"
                    paddingAngle={2}
                  >
                    {compositionData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `${formatNumber(Number(value))}원`}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                보유 자산이 없습니다
              </div>
            )}
            {compositionData.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {compositionData.map((item, i) => (
                  <div key={item.code} className="flex items-center gap-1.5 text-xs">
                    <div
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span>{item.name}</span>
                    <span className="font-mono text-muted-foreground">
                      {totalEval > 0
                        ? ((item.value / totalEval) * 100).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Concentration Warning */}
        <div className="space-y-4">
          <ConcentrationWarning items={concentrationItems} />

          {/* Position Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">종목별 비중</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : concentrationItems.length > 0 ? (
                <div className="space-y-2">
                  {concentrationItems
                    .sort((a, b) => b.ratio - a.ratio)
                    .map((item) => (
                      <div
                        key={item.code}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.code}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full ${
                                item.ratio > 30
                                  ? "bg-amber-500"
                                  : "bg-primary"
                              }`}
                              style={{
                                width: `${Math.min(item.ratio, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="w-14 text-right font-mono text-xs">
                            {item.ratio.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
                  보유 종목이 없습니다
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
