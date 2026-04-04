"use client";

import { useState, useCallback } from "react";
import { useAuthStore } from "@/stores/auth";
import { useTradingStore } from "@/stores/trading";
import {
  useStrategies,
  useSignalExecution,
  usePendingOrders,
  useCancelOrder,
} from "@/hooks/use-trading";
import { useBalance, useHoldings } from "@/hooks/use-account";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderDialog } from "@/components/trading/order-dialog";
import { StockSearchInput } from "@/components/stock/stock-search-input";
import type { Signal, SignalAction } from "@/types/signal";
import {
  Zap,
  RefreshCw,
  Loader2,
  X,
  Wallet,
  Package,
  Clock,
  Activity,
  ListOrdered,
} from "lucide-react";

function formatNumber(n: number): string {
  return n.toLocaleString("ko-KR");
}

function ActionBadge({ action }: { action: SignalAction }) {
  const styles: Record<SignalAction, string> = {
    BUY: "bg-red-500/15 text-red-500",
    SELL: "bg-blue-500/15 text-blue-500",
    HOLD: "bg-muted text-muted-foreground",
  };
  const labels: Record<SignalAction, string> = {
    BUY: "매수",
    SELL: "매도",
    HOLD: "관망",
  };
  return <Badge className={styles[action]}>{labels[action]}</Badge>;
}

function StrengthBar({ strength }: { strength: number }) {
  const pct = Math.round(strength * 100);
  const color =
    pct >= 70 ? "bg-red-500" : pct >= 40 ? "bg-yellow-500" : "bg-muted-foreground";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-muted-foreground w-8 text-right">
        {pct}%
      </span>
    </div>
  );
}

// ─── Left Panel: Strategy Selector ────────────────────────────
function StrategyPanel() {
  const {
    selectedStrategyId,
    setSelectedStrategy,
    stockCodes,
    setStockCodes,
    isGenerating,
  } = useTradingStore();

  const strategiesQuery = useStrategies();
  const signalMutation = useSignalExecution();

  const strategies = strategiesQuery.data?.data ?? [];

  const handleGenerate = useCallback(() => {
    if (!selectedStrategyId || !stockCodes.trim()) return;
    const codes = stockCodes
      .split(/[,\s]+/)
      .map((c) => c.trim())
      .filter(Boolean);
    signalMutation.mutate({
      strategy_id: selectedStrategyId,
      stocks: codes,
    });
  }, [selectedStrategyId, stockCodes, signalMutation]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="size-4" />
          신호 생성
        </CardTitle>
        <CardDescription>전략과 종목을 선택하고 신호를 생성합니다</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Strategy selector */}
        <div className="space-y-2">
          <Label>전략 선택</Label>
          {strategiesQuery.isLoading ? (
            <Skeleton className="h-8 w-full" />
          ) : strategies.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              등록된 전략이 없습니다
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {strategies.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStrategy(s.id)}
                  className={`rounded-lg border px-3 py-3 text-left text-sm transition-colors min-h-[44px] ${
                    selectedStrategyId === s.id
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <div className="font-medium">{s.name}</div>
                  {s.description && (
                    <div className="mt-0.5 text-xs opacity-70">
                      {s.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Stock codes input */}
        <div className="space-y-2">
          <Label>종목 검색</Label>
          <StockSearchInput
            value={stockCodes}
            onChange={(codes) => setStockCodes(codes)}
            placeholder="종목명 또는 코드 검색"
          />
        </div>

        {/* Generate button */}
        <Button
          className="w-full min-h-[44px]"
          onClick={handleGenerate}
          disabled={!selectedStrategyId || !stockCodes.trim() || isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : (
            <Activity className="mr-1.5 size-4" />
          )}
          {isGenerating ? "분석 중..." : "신호 생성"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Center Panel: Signal Results + Execution Logs ────────────
function SignalPanel() {
  const { signals, logs } = useTradingStore();
  const [orderSignal, setOrderSignal] = useState<Signal | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSignalClick = useCallback((signal: Signal) => {
    if (signal.action === "HOLD") return;
    setOrderSignal(signal);
    setDialogOpen(true);
  }, []);

  return (
    <>
      <div className="flex h-full flex-col gap-4">
        {/* Signal results */}
        <Card className="flex-1 min-h-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListOrdered className="size-4" />
              신호 결과
            </CardTitle>
            <CardDescription>
              {signals.length > 0
                ? `${signals.length}개 종목 분석 완료`
                : "신호를 생성하면 결과가 표시됩니다"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {signals.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                생성된 신호가 없습니다
              </div>
            ) : (
              <div className="space-y-3">
                {signals.map((signal) => (
                  <button
                    key={signal.stock_code}
                    onClick={() => handleSignalClick(signal)}
                    disabled={signal.action === "HOLD"}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      signal.action === "HOLD"
                        ? "cursor-default border-border"
                        : "cursor-pointer border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ActionBadge action={signal.action} />
                        <span className="font-medium">
                          {signal.stock_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {signal.stock_code}
                        </span>
                      </div>
                      {signal.price && (
                        <span className="font-mono text-sm">
                          {formatNumber(signal.price)}원
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <StrengthBar strength={signal.strength} />
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                      {signal.reason}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Execution logs */}
        <Card className="max-h-60">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="size-3.5" />
              실행 로그
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-36 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">
                로그가 없습니다
              </p>
            ) : (
              <div className="space-y-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-2 text-xs"
                  >
                    <span className="shrink-0 font-mono text-muted-foreground">
                      {log.timestamp}
                    </span>
                    <span
                      className={
                        log.type === "error"
                          ? "text-destructive"
                          : log.type === "success"
                            ? "text-green-500"
                            : "text-muted-foreground"
                      }
                    >
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <OrderDialog
        signal={orderSignal}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}

// ─── Right Panel: Holdings + Pending Orders + Balance ─────────
function AccountPanel() {
  const balance = useBalance();
  const holdings = useHoldings();
  const pendingOrders = usePendingOrders();
  const cancelOrder = useCancelOrder();

  const bal = balance.data?.data;
  const holdingList = holdings.data?.data ?? [];
  const pendingList = pendingOrders.data?.data ?? [];

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Balance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Wallet className="size-3.5" />
            계좌 잔고
          </CardTitle>
        </CardHeader>
        <CardContent>
          {balance.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
            </div>
          ) : bal ? (
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">예수금</span>
                <span className="font-mono">{formatNumber(bal.deposit)}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">총평가</span>
                <span className="font-mono">
                  {formatNumber(bal.total_eval)}원
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">평가손익</span>
                <span
                  className={`font-mono ${
                    bal.profit_loss > 0
                      ? "text-red-500"
                      : bal.profit_loss < 0
                        ? "text-blue-500"
                        : ""
                  }`}
                >
                  {bal.profit_loss > 0 ? "+" : ""}
                  {formatNumber(bal.profit_loss)}원
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">-</p>
          )}
        </CardContent>
      </Card>

      {/* Holdings */}
      <Card className="flex-1 min-h-0">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="size-3.5" />
            보유종목
            {holdingList.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 h-4">
                {holdingList.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-64 overflow-y-auto">
          {holdings.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : holdingList.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">
              보유 종목이 없습니다
            </p>
          ) : (
            <div className="space-y-2">
              {holdingList.map((h) => (
                <div
                  key={h.stock_code}
                  className="rounded-lg border p-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{h.stock_name}</span>
                    <span
                      className={`font-mono ${
                        h.profit_rate > 0
                          ? "text-red-500"
                          : h.profit_rate < 0
                            ? "text-blue-500"
                            : "text-muted-foreground"
                      }`}
                    >
                      {h.profit_rate > 0 ? "+" : ""}
                      {h.profit_rate.toFixed(2)}%
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between text-muted-foreground">
                    <span>{formatNumber(h.quantity)}주</span>
                    <span>{formatNumber(h.eval_amount)}원</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="size-3.5" />
              미체결
              {pendingList.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 h-4">
                  {pendingList.length}
                </Badge>
              )}
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => pendingOrders.refetch()}
            >
              <RefreshCw className="size-3" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-48 overflow-y-auto">
          {pendingOrders.isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : pendingList.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">
              미체결 주문이 없습니다
            </p>
          ) : (
            <div className="space-y-2">
              {pendingList.map((order) => (
                <div
                  key={order.order_id}
                  className="flex items-center justify-between rounded-lg border p-2"
                >
                  <div className="text-xs">
                    <div className="flex items-center gap-1.5">
                      <Badge
                        className={
                          order.action === "BUY"
                            ? "bg-red-500/15 text-red-500 text-[10px] h-4 px-1"
                            : "bg-blue-500/15 text-blue-500 text-[10px] h-4 px-1"
                        }
                      >
                        {order.action === "BUY" ? "매수" : "매도"}
                      </Badge>
                      <span className="font-medium">{order.stock_name}</span>
                    </div>
                    <div className="mt-0.5 text-muted-foreground">
                      {formatNumber(order.quantity)}주 @{" "}
                      {formatNumber(order.price)}원
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => cancelOrder.mutate(order.order_id)}
                    disabled={cancelOrder.isPending}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Trading Page ────────────────────────────────────────
export default function TradingPage() {
  const { authenticated } = useAuthStore();

  if (!authenticated) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle>인증 필요</CardTitle>
            <CardDescription>
              트레이딩을 이용하려면 먼저 로그인하세요
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">트레이딩</h1>
        <Badge variant="outline" className="gap-1.5">
          <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
          Live
        </Badge>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-[280px_1fr_300px]">
        {/* Left: Strategy selector */}
        <StrategyPanel />

        {/* Center: Signals + Logs */}
        <SignalPanel />

        {/* Right: Account info */}
        <AccountPanel />
      </div>
    </div>
  );
}
