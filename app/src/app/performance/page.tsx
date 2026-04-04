"use client";

import { useState, useMemo } from "react";
import {
  usePerformanceAll,
  type PerformanceRecord,
} from "@/hooks/use-performance";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  LineChart as LineChartIcon,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

// --- Helpers ---

function formatNumber(n: number): string {
  return n.toLocaleString("ko-KR");
}

function formatPct(v: number): string {
  return `${(v * 100).toFixed(2)}%`;
}

function ProfitText({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
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
      {formatPct(value)}
      {suffix}
    </span>
  );
}

// --- Metrics calculation ---

interface Metrics {
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  totalTrades: number;
  avgDailyReturn: number;
}

function calcMetrics(records: PerformanceRecord[]): Metrics {
  if (records.length === 0) {
    return {
      totalReturn: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      totalTrades: 0,
      avgDailyReturn: 0,
    };
  }

  const dailyReturns = records.map((r) => r.dailyReturn);
  const totalReturn = records[records.length - 1].cumulativeReturn;
  const avgDailyReturn =
    dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;

  // Sharpe ratio (annualized, assuming 252 trading days)
  const variance =
    dailyReturns.reduce((sum, r) => sum + (r - avgDailyReturn) ** 2, 0) /
    dailyReturns.length;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio =
    stdDev > 0 ? (avgDailyReturn / stdDev) * Math.sqrt(252) : 0;

  // Max drawdown
  let peak = 0;
  let maxDrawdown = 0;
  for (const r of records) {
    const cum = r.cumulativeReturn;
    if (cum > peak) peak = cum;
    const drawdown = peak - cum;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  const totalTrades = records.reduce((sum, r) => sum + r.tradeCount, 0);

  return {
    totalReturn,
    sharpeRatio,
    maxDrawdown,
    totalTrades,
    avgDailyReturn,
  };
}

// --- Strategy list (matches API seed) ---

const STRATEGIES = [
  { id: "sma_crossover", name: "SMA 교차" },
  { id: "momentum", name: "모멘텀" },
  { id: "mean_reversion", name: "평균회귀" },
];

// --- Components ---

function MetricCard({
  title,
  value,
  icon: Icon,
  colorClass,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold font-mono ${colorClass}`}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

function DailyReturnChart({
  records,
  title,
}: {
  records: PerformanceRecord[];
  title: string;
}) {
  const data = records.map((r) => ({
    date: r.date,
    dailyReturn: Math.round(r.dailyReturn * 10000) / 100,
    cumulativeReturn: Math.round(r.cumulativeReturn * 10000) / 100,
  }));

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>데이터가 없습니다</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const lastCum = data[data.length - 1].cumulativeReturn;
  const isProfit = lastCum >= 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <span
          className={`text-sm font-medium font-mono ${isProfit ? "text-red-500" : "text-blue-500"}`}
        >
          {isProfit ? "+" : ""}
          {lastCum.toFixed(2)}%
        </span>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
            >
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#a3a3a3" }}
                tickFormatter={(v) => String(v).slice(5)}
                interval="preserveStartEnd"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#a3a3a3" }}
                tickFormatter={(v) => `${v}%`}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: 12,
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value, name) => [
                  `${Number(value).toFixed(2)}%`,
                  name === "cumulativeReturn" ? "누적 수익률" : "일간 수익률",
                ]}
                labelFormatter={(label) => String(label)}
              />
              <Legend
                formatter={(v) =>
                  v === "cumulativeReturn" ? "누적 수익률" : "일간 수익률"
                }
              />
              <Line
                type="monotone"
                dataKey="cumulativeReturn"
                stroke={isProfit ? "#ef4444" : "#3b82f6"}
                strokeWidth={2}
                dot={false}
                name="cumulativeReturn"
              />
              <Line
                type="monotone"
                dataKey="dailyReturn"
                stroke="#a3a3a3"
                strokeWidth={1}
                dot={false}
                strokeDasharray="3 3"
                name="dailyReturn"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function ComparisonTable({
  liveMetrics,
  backtestMetrics,
}: {
  liveMetrics: Metrics;
  backtestMetrics: Metrics;
}) {
  const rows = [
    {
      label: "총 수익률",
      live: formatPct(liveMetrics.totalReturn),
      backtest: formatPct(backtestMetrics.totalReturn),
    },
    {
      label: "샤프 비율",
      live: liveMetrics.sharpeRatio.toFixed(2),
      backtest: backtestMetrics.sharpeRatio.toFixed(2),
    },
    {
      label: "최대 낙폭",
      live: formatPct(liveMetrics.maxDrawdown),
      backtest: formatPct(backtestMetrics.maxDrawdown),
    },
    {
      label: "평균 일간 수익률",
      live: formatPct(liveMetrics.avgDailyReturn),
      backtest: formatPct(backtestMetrics.avgDailyReturn),
    },
    {
      label: "총 거래 수",
      live: formatNumber(liveMetrics.totalTrades),
      backtest: formatNumber(backtestMetrics.totalTrades),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">실전 vs 백테스트 비교</CardTitle>
        <CardDescription>동일 전략의 실전/백테스트 성과 비교</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px] text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2 text-left font-medium">지표</th>
                <th className="py-2 text-right font-medium">
                  <Badge variant="destructive" className="text-xs">
                    실전
                  </Badge>
                </th>
                <th className="py-2 text-right font-medium">
                  <Badge variant="secondary" className="text-xs">
                    백테스트
                  </Badge>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b last:border-0">
                  <td className="py-2 font-medium">{row.label}</td>
                  <td className="py-2 text-right font-mono">{row.live}</td>
                  <td className="py-2 text-right font-mono">{row.backtest}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Main Page ---

export default function PerformancePage() {
  const [strategyId, setStrategyId] = useState(STRATEGIES[0].id);
  const { liveQuery, backtestQuery } = usePerformanceAll(strategyId);

  const liveRecords = liveQuery.data ?? [];
  const backtestRecords = backtestQuery.data ?? [];
  const isLoading = liveQuery.isLoading || backtestQuery.isLoading;

  const liveMetrics = useMemo(() => calcMetrics(liveRecords), [liveRecords]);
  const backtestMetrics = useMemo(
    () => calcMetrics(backtestRecords),
    [backtestRecords],
  );

  // Use live metrics if available, otherwise backtest
  const primaryMetrics =
    liveRecords.length > 0 ? liveMetrics : backtestMetrics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader icon={LineChartIcon} title="성과 추적" />

      {/* Strategy Selector */}
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-2">
            <Label>전략 선택</Label>
            <select
              value={strategyId}
              onChange={(e) => setStrategyId(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              {STRATEGIES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Metric Cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="총 수익률"
            value={formatPct(primaryMetrics.totalReturn)}
            icon={primaryMetrics.totalReturn >= 0 ? TrendingUp : TrendingDown}
            colorClass={
              primaryMetrics.totalReturn >= 0 ? "text-red-500" : "text-blue-500"
            }
          />
          <MetricCard
            title="샤프 비율"
            value={primaryMetrics.sharpeRatio.toFixed(2)}
            icon={BarChart3}
            colorClass={
              primaryMetrics.sharpeRatio >= 1
                ? "text-red-500"
                : primaryMetrics.sharpeRatio >= 0
                  ? "text-foreground"
                  : "text-blue-500"
            }
          />
          <MetricCard
            title="최대 낙폭"
            value={formatPct(primaryMetrics.maxDrawdown)}
            icon={Activity}
            colorClass="text-blue-500"
          />
          <MetricCard
            title="총 거래 수"
            value={formatNumber(primaryMetrics.totalTrades)}
            icon={BarChart3}
            colorClass="text-foreground"
          />
        </div>
      )}

      {/* Tabs: Chart, Comparison */}
      <Tabs defaultValue="chart">
        <TabsList>
          <TabsTrigger value="chart">수익률 차트</TabsTrigger>
          <TabsTrigger value="comparison">실전 vs 백테스트</TabsTrigger>
        </TabsList>

        <TabsContent value="chart">
          {isLoading ? (
            <Card>
              <CardContent className="py-12">
                <Skeleton className="mx-auto h-[300px] w-full" />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {liveRecords.length > 0 && (
                <DailyReturnChart
                  records={liveRecords}
                  title="실전 수익률"
                />
              )}
              {backtestRecords.length > 0 && (
                <DailyReturnChart
                  records={backtestRecords}
                  title="백테스트 수익률"
                />
              )}
              {liveRecords.length === 0 && backtestRecords.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center gap-3 py-16">
                    <LineChartIcon className="size-12 text-muted-foreground/30" />
                    <div className="text-center">
                      <p className="font-medium text-muted-foreground">성과 데이터가 없습니다</p>
                      <p className="mt-1 text-sm text-muted-foreground/70">
                        전략을 실행하거나 백테스트를 수행하면 성과 데이터가 표시됩니다
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="comparison">
          {isLoading ? (
            <Card>
              <CardContent className="py-12">
                <Skeleton className="mx-auto h-[200px] w-full" />
              </CardContent>
            </Card>
          ) : liveRecords.length > 0 || backtestRecords.length > 0 ? (
            <ComparisonTable
              liveMetrics={liveMetrics}
              backtestMetrics={backtestMetrics}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-16">
                <BarChart3 className="size-12 text-muted-foreground/30" />
                <div className="text-center">
                  <p className="font-medium text-muted-foreground">비교할 데이터가 없습니다</p>
                  <p className="mt-1 text-sm text-muted-foreground/70">
                    실전 또는 백테스트 데이터가 있어야 비교할 수 있습니다
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
