"use client";

import { useEffect, useCallback } from "react";
import { useBacktestStore } from "@/stores/backtest";
import { useStrategies, useRunBacktest } from "@/hooks/use-backtest";
import { EquityChart } from "@/components/backtest/equity-chart";
import { MetricsGrid } from "@/components/backtest/metrics-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Play,
  Settings,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Loader2,
} from "lucide-react";
import type { BacktestStrategy as Strategy, TradeInfo } from "@/types/backtest";
import { StockSearchInput } from "@/components/stock/stock-search-input";

// --- Helpers ---

function formatNumber(n: number): string {
  return n.toLocaleString("ko-KR");
}

function formatPct(v: number): string {
  return `${(v * 100).toFixed(2)}%`;
}

function ProfitText({
  value,
  suffix = "원",
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
      {typeof value === "number" && suffix === "%"
        ? `${(value * 100).toFixed(2)}`
        : formatNumber(value)}
      {suffix}
    </span>
  );
}

// --- Strategy Selector ---

function StrategySelector({
  strategies,
  selectedId,
  onSelect,
}: {
  strategies: Strategy[];
  selectedId: string;
  onSelect: (strategy: Strategy) => void;
}) {
  const grouped = strategies.reduce(
    (acc, s) => {
      const cat = s.category || "기타";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(s);
      return acc;
    },
    {} as Record<string, Strategy[]>,
  );

  return (
    <div className="space-y-2">
      <Label>전략 선택</Label>
      <select
        value={selectedId}
        onChange={(e) => {
          const strat = strategies.find((s) => s.id === e.target.value);
          if (strat) onSelect(strat);
        }}
        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      >
        <option value="">전략을 선택하세요</option>
        {Object.entries(grouped).map(([category, strats]) => (
          <optgroup key={category} label={category}>
            {strats.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

// --- Param Slider ---

function ParamSlider({
  label,
  value,
  min,
  max,
  step,
  description,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  description?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <span className="font-mono text-xs text-muted-foreground">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
      />
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

// --- Summary Cards ---

function SummaryCards({
  totalReturn,
  sharpeRatio,
  maxDrawdown,
  winRate,
}: {
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
}) {
  const cards = [
    {
      title: "총 수익률",
      value: formatPct(totalReturn),
      icon: totalReturn >= 0 ? TrendingUp : TrendingDown,
      colorClass: totalReturn >= 0 ? "text-red-500" : "text-blue-500",
    },
    {
      title: "샤프 비율",
      value: sharpeRatio.toFixed(2),
      icon: BarChart3,
      colorClass:
        sharpeRatio >= 1
          ? "text-red-500"
          : sharpeRatio >= 0
            ? "text-foreground"
            : "text-blue-500",
    },
    {
      title: "최대 낙폭",
      value: formatPct(maxDrawdown),
      icon: Activity,
      colorClass: "text-blue-500",
    },
    {
      title: "승률",
      value: formatPct(winRate),
      icon: Target,
      colorClass:
        winRate >= 0.5
          ? "text-red-500"
          : winRate > 0
            ? "text-foreground"
            : "text-blue-500",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{c.title}</CardTitle>
            <c.icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-mono ${c.colorClass}`}>
              {c.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// --- Trade Table ---

// Buy→Sell 매칭으로 손익 + 누적 NAV 계산
function computeTradesWithPnl(trades: TradeInfo[], initialCapital: number): (TradeInfo & { pnl?: number; pnlRate?: number; nav: number })[] {
  const result: (TradeInfo & { pnl?: number; pnlRate?: number; nav: number })[] = [];
  const openPositions: Map<string, { price: number; quantity: number }> = new Map();
  let nav = initialCapital;

  for (const t of trades) {
    const isBuy = t.direction.toLowerCase() === "buy";
    if (isBuy) {
      openPositions.set(t.symbol, { price: t.price, quantity: t.quantity });
      result.push({ ...t, nav });
    } else {
      const entry = openPositions.get(t.symbol);
      if (entry) {
        const pnl = (t.price - entry.price) * t.quantity;
        const pnlRate = ((t.price - entry.price) / entry.price) * 100;
        nav += pnl;
        result.push({ ...t, pnl, pnlRate, nav });
        openPositions.delete(t.symbol);
      } else {
        result.push({ ...t, nav });
      }
    }
  }
  return result;
}

function TradeTable({ trades, initialCapital }: { trades: TradeInfo[]; initialCapital: number }) {
  if (trades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">거래 내역</CardTitle>
          <CardDescription>거래 기록이 없습니다</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">거래 내역</CardTitle>
        <CardDescription>{trades.length}건의 거래</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-[400px] overflow-auto">
          <table className="w-full min-w-[550px] text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2 text-left font-medium whitespace-nowrap">시간</th>
                <th className="py-2 text-left font-medium whitespace-nowrap">종목</th>
                <th className="py-2 text-center font-medium whitespace-nowrap">방향</th>
                <th className="py-2 text-right font-medium whitespace-nowrap">수량</th>
                <th className="py-2 text-right font-medium whitespace-nowrap">가격</th>
                <th className="py-2 text-right font-medium whitespace-nowrap">손익</th>
                <th className="py-2 text-right font-medium whitespace-nowrap">수익률</th>
                <th className="py-2 text-right font-medium whitespace-nowrap">누적 NAV</th>
              </tr>
            </thead>
            <tbody>
              {computeTradesWithPnl(trades, initialCapital).map((t, i) => {
                const isBuy = t.direction.toLowerCase() === "buy";
                return (
                  <tr key={`${t.symbol}-${t.time}-${i}`} className="border-b last:border-0">
                    <td className="py-2 font-mono text-xs text-muted-foreground">
                      {t.time.slice(0, 16).replace("T", " ")}
                    </td>
                    <td className="py-2">{t.symbol}</td>
                    <td className="py-2 text-center">
                      <Badge variant={isBuy ? "destructive" : "secondary"}>
                        {isBuy ? "매수" : "매도"}
                      </Badge>
                    </td>
                    <td className="py-2 text-right font-mono">
                      {formatNumber(t.quantity)}
                    </td>
                    <td className="py-2 text-right font-mono">
                      {formatNumber(t.price)}원
                    </td>
                    <td className="py-2 text-right font-mono">
                      {t.pnl != null ? (
                        <ProfitText value={t.pnl} />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-2 text-right font-mono">
                      {t.pnlRate != null ? (
                        <ProfitText value={t.pnlRate / 100} suffix="%" />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-2 text-right font-mono text-xs">
                      {formatNumber(Math.round(t.nav))}원
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Main Page ---

export default function BacktestPage() {
  const store = useBacktestStore();
  const { data: strategies, isLoading: strategiesLoading } = useStrategies();
  const mutation = useRunBacktest();

  const selectedStrategy = strategies?.find(
    (s) => s.id === store.strategyId,
  );

  // Auto-select first strategy when loaded
  useEffect(() => {
    if (strategies && strategies.length > 0 && !store.strategyId) {
      store.applyStrategyDefaults(strategies[0]);
    }
  }, [strategies, store.strategyId, store.applyStrategyDefaults]);

  const handleRun = useCallback(() => {
    if (!store.strategyId) return;
    const request = store.buildRequest();
    store.setIsRunning(true);
    store.setError(null);
    store.setResult(null);

    mutation.mutate(request, {
      onSuccess: (data) => {
        store.setResult(data);
        store.setIsRunning(false);
      },
      onError: (err) => {
        store.setError(
          err instanceof Error ? err.message : "백테스트 실행 실패",
        );
        store.setIsRunning(false);
      },
    });
  }, [store, mutation]);

  const canRun =
    store.strategyId &&
    store.symbols.trim() &&
    store.startDate &&
    store.endDate &&
    !store.isRunning;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">백테스트</h1>
        <Button onClick={handleRun} disabled={!canRun} className="w-full sm:w-auto min-h-[44px]">
          {store.isRunning ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              실행 중...
            </>
          ) : (
            <>
              <Play className="mr-2 size-4" />
              백테스트 실행
            </>
          )}
        </Button>
      </div>

      {/* Config Panel */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Strategy & Stock */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="size-4" />
              전략 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {strategiesLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <>
                <StrategySelector
                  strategies={strategies ?? []}
                  selectedId={store.strategyId}
                  onSelect={store.applyStrategyDefaults}
                />
                {selectedStrategy && (
                  <p className="text-xs text-muted-foreground">
                    {selectedStrategy.description}
                  </p>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label>종목 검색</Label>
              <StockSearchInput
                value={store.symbols}
                onChange={(codes) => store.setSymbols(codes)}
                placeholder="종목명 또는 코드 검색"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">시작일</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={store.startDate}
                  onChange={(e) => store.setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">종료일</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={store.endDate}
                  onChange={(e) => store.setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
              <div className="space-y-2">
                <Label className="text-xs">초기자본 (원)</Label>
                <Input
                  type="number"
                  value={store.initialCapital}
                  onChange={(e) =>
                    store.setInitialCapital(Number(e.target.value))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">수수료율</Label>
                <Input
                  type="number"
                  step="0.00001"
                  value={store.commissionRate}
                  onChange={(e) =>
                    store.setCommissionRate(Number(e.target.value))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">세율</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={store.taxRate}
                  onChange={(e) => store.setTaxRate(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">슬리피지</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={store.slippage}
                  onChange={(e) => store.setSlippage(Number(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Strategy Params */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">전략 파라미터</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedStrategy ? (
              Object.keys(selectedStrategy.params ?? {}).length > 0 ? (
                Object.entries(selectedStrategy.params ?? {}).map(([name, p]) => {
                  if (p.type === "bool") {
                    const checked =
                      (store.paramOverrides[name] as boolean) ??
                      (p.default as boolean);
                    return (
                      <div
                        key={name}
                        className="flex items-center justify-between"
                      >
                        <Label className="text-xs">{p.description ?? name}</Label>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            store.setParamOverride(name, e.target.checked)
                          }
                          className="size-4 accent-primary"
                        />
                      </div>
                    );
                  }
                  const val =
                    (store.paramOverrides[name] as number) ??
                    (p.default as number);
                  return (
                    <ParamSlider
                      key={name}
                      label={p.description ?? name}
                      value={val}
                      min={p.min ?? 0}
                      max={p.max ?? 100}
                      step={p.step ?? (p.type === "int" ? 1 : 0.1)}
                      description={name}
                      onChange={(v) => store.setParamOverride(name, v)}
                    />
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">
                  이 전략은 조절 가능한 파라미터가 없습니다.
                </p>
              )
            ) : (
              <p className="text-sm text-muted-foreground">
                전략을 선택하면 파라미터가 표시됩니다.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {store.isRunning && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">
              백테스트를 실행하고 있습니다...
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              데이터 양에 따라 수십 초가 소요될 수 있습니다.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {store.error && (
        <Card className="border-destructive/50">
          <CardContent className="py-4">
            <p className="text-sm text-destructive">{store.error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {store.result && !store.isRunning && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <SummaryCards
            totalReturn={(store.result.metrics.basic?.total_return ?? 0) / 100}
            sharpeRatio={store.result.metrics.risk?.sharpe_ratio ?? 0}
            maxDrawdown={(store.result.metrics.basic?.max_drawdown ?? 0) / 100}
            winRate={(store.result.metrics.trading?.win_rate ?? 0) / 100}
          />

          {/* Tabs for details */}
          <Tabs defaultValue="chart">
            <TabsList>
              <TabsTrigger value="chart">자산 곡선</TabsTrigger>
              <TabsTrigger value="metrics">성과 지표</TabsTrigger>
              <TabsTrigger value="trades">거래 내역</TabsTrigger>
            </TabsList>
            <TabsContent value="chart">
              <EquityChart
                equityCurve={store.result.equity_curve}
                benchmarkCurve={store.result.benchmark_curve}
                initialCapital={store.initialCapital}
              />
            </TabsContent>
            <TabsContent value="metrics">
              <MetricsGrid metrics={store.result.metrics} />
            </TabsContent>
            <TabsContent value="trades">
              <TradeTable trades={store.result.trades} initialCapital={store.result.initial_capital ?? store.initialCapital} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
