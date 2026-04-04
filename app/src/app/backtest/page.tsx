"use client";

import { useEffect, useCallback, useState } from "react";
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
  ClipboardCopy,
  Check,
} from "lucide-react";
import type { BacktestStrategy as Strategy, TradeInfo } from "@/types/backtest";
import { StockSearchInput, getStockName } from "@/components/stock/stock-search-input";
import { useSaveBacktestResult } from "@/hooks/use-backtest-history";
import { subMonths, subYears, format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";

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

// Buy→Sell 매칭으로 손익 + 누적 NAV 계산 (다종목/추가매수 지원)
interface PositionEntry {
  price: number;
  quantity: number;
}

function computeTradesWithPnl(trades: TradeInfo[], initialCapital: number): (TradeInfo & { pnl?: number; pnlRate?: number; nav: number; cash: number })[] {
  const result: (TradeInfo & { pnl?: number; pnlRate?: number; nav: number; cash: number })[] = [];
  // 종목별 보유 목록 (추가매수 대응: 배열로 관리)
  const openPositions: Map<string, PositionEntry[]> = new Map();
  let cash = initialCapital;

  function calcNav(currentTrades: TradeInfo[]): number {
    // NAV = 현금 + 보유종목 평가금액
    let totalEval = cash;
    for (const [symbol, positions] of openPositions) {
      // 최근 거래 가격을 현재가로 사용 (근사값)
      const lastTrade = [...currentTrades].reverse().find(
        (tr) => tr.symbol === symbol
      );
      const currentPrice = lastTrade?.price ?? positions[0]?.price ?? 0;
      for (const pos of positions) {
        totalEval += currentPrice * pos.quantity;
      }
    }
    return totalEval;
  }

  for (let i = 0; i < trades.length; i++) {
    const t = trades[i];
    const isBuy = t.direction.toLowerCase() === "buy";
    const processedSoFar = trades.slice(0, i + 1);

    if (isBuy) {
      // 매수: 현금 감소, 포지션 추가
      const cost = t.price * t.quantity;
      cash -= cost;
      const existing = openPositions.get(t.symbol) ?? [];
      existing.push({ price: t.price, quantity: t.quantity });
      openPositions.set(t.symbol, existing);
      const nav = calcNav(processedSoFar);
      result.push({ ...t, nav, cash });
    } else {
      // 매도: 보유 포지션에서 FIFO로 매칭
      const positions = openPositions.get(t.symbol) ?? [];
      let remainQty = t.quantity;
      let totalPnl = 0;
      let totalCost = 0;

      while (remainQty > 0 && positions.length > 0) {
        const pos = positions[0];
        const matchQty = Math.min(remainQty, pos.quantity);
        totalPnl += (t.price - pos.price) * matchQty;
        totalCost += pos.price * matchQty;
        remainQty -= matchQty;
        pos.quantity -= matchQty;
        if (pos.quantity <= 0) {
          positions.shift();
        }
      }

      if (positions.length === 0) {
        openPositions.delete(t.symbol);
      }

      cash += t.price * t.quantity;
      const avgEntryPrice = totalCost / (t.quantity - remainQty || 1);
      const pnlRate = ((t.price - avgEntryPrice) / avgEntryPrice) * 100;
      const nav = calcNav(processedSoFar);
      result.push({ ...t, pnl: totalPnl, pnlRate, nav, cash });
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
                <th className="py-2 text-right font-medium whitespace-nowrap">현금</th>
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
                    <td className="py-2">
                      {getStockName(t.symbol) ? (
                        <div>
                          <span className="font-medium">{getStockName(t.symbol)}</span>
                          <span className="text-xs text-muted-foreground ml-1">({t.symbol})</span>
                        </div>
                      ) : (
                        <span className="font-mono">{t.symbol}</span>
                      )}
                    </td>
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
                    <td className="py-2 text-right font-mono text-xs text-muted-foreground">
                      {formatNumber(Math.round(t.cash))}원
                    </td>
                    <td className="py-2 text-right font-mono text-xs font-medium">
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

  const saveMutation = useSaveBacktestResult();
  const [savedCacheKey, setSavedCacheKey] = useState<string | null>(null);

  const handleSave = useCallback(() => {
    if (!store.result || !store.strategyId) return;
    saveMutation.mutate(
      {
        strategyId: store.strategyId,
        symbols: store.symbols,
        startDate: store.startDate,
        endDate: store.endDate,
        params: JSON.stringify(store.paramOverrides),
        result: JSON.stringify(store.result),
      },
      {
        onSuccess: (data: { cacheKey?: string; alreadyExists?: boolean }) => {
          setSavedCacheKey(data.cacheKey ?? "saved");
          if (data.alreadyExists) {
            toast.info("이미 저장된 결과입니다");
          } else {
            toast.success("백테스트 결과가 저장되었습니다");
          }
        },
        onError: () => {
          toast.error("결과 저장에 실패했습니다");
        },
      },
    );
  }, [store, saveMutation]);

  const [copied, setCopied] = useState(false);

  const handleCopyResult = useCallback(async () => {
    if (!store.result) return;
    const m = store.result.metrics;
    const strategyName = selectedStrategy?.name ?? store.strategyId;
    const symbols = store.symbols;
    const totalReturn = m.basic?.total_return?.toFixed(2) ?? "-";
    const sharpe = m.risk?.sharpe_ratio?.toFixed(2) ?? "-";
    const mdd = m.basic?.max_drawdown?.toFixed(2) ?? "-";
    const winRate = m.trading?.win_rate != null
      ? `${Math.round(m.trading.win_rate)}%`
      : "-";
    const text = `전략: ${strategyName} | 종목: ${symbols} | 총수익률: ${totalReturn}% | 샤프: ${sharpe} | MDD: ${mdd}% | 승률: ${winRate}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [store.result, store.strategyId, store.symbols, selectedStrategy?.name]);

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
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">백테스트</h1>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/backtest/history" />}>
            실행 이력
          </Button>
        </div>
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

            <div className="space-y-2">
              <Label>기간 프리셋</Label>
              <div className="flex flex-wrap gap-2">
                {([
                  { label: "최근 3개월", months: 3 },
                  { label: "최근 6개월", months: 6 },
                  { label: "최근 1년", months: 12 },
                  { label: "최근 3년", months: 36 },
                ] as const).map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const end = new Date();
                      const start = preset.months <= 12
                        ? subMonths(end, preset.months)
                        : subYears(end, preset.months / 12);
                      store.setStartDate(format(start, "yyyy-MM-dd"));
                      store.setEndDate(format(end, "yyyy-MM-dd"));
                    }}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
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
                      step={p.step ?? (p.type === "int" ? 1 : 0.01)}
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
            <div className="flex items-center justify-between gap-2">
              <TabsList>
                <TabsTrigger value="chart">자산 곡선</TabsTrigger>
                <TabsTrigger value="metrics">성과 지표</TabsTrigger>
                <TabsTrigger value="trades">거래 내역</TabsTrigger>
              </TabsList>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant={savedCacheKey ? "outline" : "default"}
                  size="sm"
                  onClick={handleSave}
                  disabled={saveMutation.isPending || !!savedCacheKey}
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                      저장 중...
                    </>
                  ) : savedCacheKey ? (
                    <>
                      <Check className="mr-1.5 size-3.5" />
                      저장 완료
                    </>
                  ) : (
                    "결과 저장"
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyResult}
                >
                  {copied ? (
                    <>
                      <Check className="mr-1.5 size-3.5" />
                      복사됨
                    </>
                  ) : (
                    <>
                      <ClipboardCopy className="mr-1.5 size-3.5" />
                      결과 복사
                    </>
                  )}
                </Button>
              </div>
            </div>
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
