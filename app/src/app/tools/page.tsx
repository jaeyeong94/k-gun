"use client";

import { useState, useMemo } from "react";
import { useBalance } from "@/hooks/use-account";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Calculator,
  Shield,
  TrendingUp,
  AlertTriangle,
  Target,
} from "lucide-react";

// --- Helpers ---

function formatNumber(n: number): string {
  return n.toLocaleString("ko-KR");
}

function formatCurrency(n: number): string {
  if (n >= 1_0000_0000) {
    return `${(n / 1_0000_0000).toFixed(2)}억원`;
  }
  if (n >= 1_0000) {
    return `${(n / 1_0000).toFixed(0)}만원`;
  }
  return `${formatNumber(Math.round(n))}원`;
}

// --- Fixed Ratio Calculator ---

function FixedRatioCalc({
  accountBalance,
  riskPercent,
  entryPrice,
}: {
  accountBalance: number;
  riskPercent: number;
  entryPrice: number;
}) {
  const riskAmount = (accountBalance * riskPercent) / 100;
  const quantity = entryPrice > 0 ? Math.floor(riskAmount / entryPrice) : 0;
  const totalCost = quantity * entryPrice;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        계좌 잔고의 일정 비율만큼 투자하는 방식입니다.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <ResultCard
          title="투자 가능 금액"
          value={formatCurrency(riskAmount)}
          icon={Shield}
          description={`잔고의 ${riskPercent}%`}
        />
        <ResultCard
          title="매수 가능 수량"
          value={`${formatNumber(quantity)}주`}
          icon={Target}
          description={
            entryPrice > 0
              ? `총 ${formatCurrency(totalCost)}`
              : "진입가를 입력하세요"
          }
        />
      </div>
    </div>
  );
}

// --- Risk-Based Calculator ---

function RiskBasedCalc({
  accountBalance,
  riskPercent,
  stopLossPercent,
  entryPrice,
}: {
  accountBalance: number;
  riskPercent: number;
  stopLossPercent: number;
  entryPrice: number;
}) {
  const riskAmount = (accountBalance * riskPercent) / 100;
  const stopLossAmount = entryPrice * (stopLossPercent / 100);
  const quantity =
    stopLossAmount > 0 ? Math.floor(riskAmount / stopLossAmount) : 0;
  const totalCost = quantity * entryPrice;
  const maxLoss = quantity * stopLossAmount;
  const riskRewardRatio =
    stopLossPercent > 0 ? (riskPercent / stopLossPercent).toFixed(2) : "-";

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        손절가 기준으로 최대 손실 금액을 제한하여 수량을 계산합니다.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ResultCard
          title="매수 수량"
          value={`${formatNumber(quantity)}주`}
          icon={Target}
          description={`총 ${formatCurrency(totalCost)}`}
        />
        <ResultCard
          title="최대 손실 금액"
          value={formatCurrency(maxLoss)}
          icon={AlertTriangle}
          description={`잔고 대비 ${((maxLoss / accountBalance) * 100).toFixed(2)}%`}
        />
        <ResultCard
          title="손절 폭"
          value={`${formatCurrency(stopLossAmount)}/주`}
          icon={Shield}
          description={`진입가의 ${stopLossPercent}%`}
        />
        <ResultCard
          title="리스크/리워드"
          value={String(riskRewardRatio)}
          icon={TrendingUp}
          description="R/R 비율"
        />
      </div>
    </div>
  );
}

// --- Kelly Criterion Calculator ---

function KellyCalc({
  accountBalance,
}: {
  accountBalance: number;
}) {
  const [winRate, setWinRate] = useState(55);
  const [avgWin, setAvgWin] = useState(30000);
  const [avgLoss, setAvgLoss] = useState(20000);

  const kellyResult = useMemo(() => {
    const w = winRate / 100;
    const l = 1 - w;
    const ratio = avgLoss > 0 ? avgWin / avgLoss : 0;
    const kelly = ratio > 0 ? w - l / ratio : 0;
    const kellyPct = Math.max(0, Math.min(kelly, 1));
    const recommendedAmount = accountBalance * kellyPct;

    return {
      kelly: kellyPct,
      recommendedAmount,
      ratio,
    };
  }, [winRate, avgWin, avgLoss, accountBalance]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        켈리 공식: f* = W - (L / R). 승률과 평균 손익 비율을 기반으로 최적
        투자 비율을 계산합니다.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="winRate">승률 (%)</Label>
          <Input
            id="winRate"
            type="number"
            min={0}
            max={100}
            step={1}
            value={winRate}
            onChange={(e) => setWinRate(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="avgWin">평균 수익 (원)</Label>
          <Input
            id="avgWin"
            type="number"
            min={0}
            value={avgWin}
            onChange={(e) => setAvgWin(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="avgLoss">평균 손실 (원)</Label>
          <Input
            id="avgLoss"
            type="number"
            min={0}
            value={avgLoss}
            onChange={(e) => setAvgLoss(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <ResultCard
          title="켈리 비율"
          value={`${(kellyResult.kelly * 100).toFixed(1)}%`}
          icon={Calculator}
          description="최적 투자 비율"
        />
        <ResultCard
          title="투자 권장 금액"
          value={formatCurrency(kellyResult.recommendedAmount)}
          icon={TrendingUp}
          description={`잔고의 ${(kellyResult.kelly * 100).toFixed(1)}%`}
        />
        <ResultCard
          title="손익비"
          value={kellyResult.ratio.toFixed(2)}
          icon={Target}
          description="평균 수익 / 평균 손실"
        />
      </div>

      {kellyResult.kelly <= 0 && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3">
          <p className="text-sm text-destructive flex items-center gap-2">
            <AlertTriangle className="size-4" />
            켈리 값이 0 이하입니다. 현재 승률/손익비로는 투자하지 않는 것이
            유리합니다.
          </p>
        </div>
      )}

      {kellyResult.kelly > 0.25 && (
        <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/5 p-3">
          <p className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
            <AlertTriangle className="size-4" />
            켈리 비율이 높습니다. 실전에서는 Half-Kelly (
            {((kellyResult.kelly * 100) / 2).toFixed(1)}%) 이하를 권장합니다.
          </p>
        </div>
      )}
    </div>
  );
}

// --- Result Card ---

function ResultCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}) {
  return (
    <Card size="sm">
      <CardHeader className="flex flex-row items-center justify-between pb-1">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="size-3.5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-lg font-bold font-mono">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

// --- Main Page ---

export default function ToolsPage() {
  const balance = useBalance();
  const balanceAmount = balance.data?.data?.deposit ?? 10_000_000;

  const [accountBalance, setAccountBalance] = useState<number | null>(null);
  const [riskPercent, setRiskPercent] = useState(2);
  const [stopLossPercent, setStopLossPercent] = useState(3);
  const [entryPrice, setEntryPrice] = useState(65000);

  // Use fetched balance as default, allow override
  const effectiveBalance = accountBalance ?? balanceAmount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">포지션 사이징 도구</h1>
        <Badge variant="secondary" className="text-xs">
          클라이언트 계산
        </Badge>
      </div>

      {/* Input Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="size-4" />
            기본 설정
          </CardTitle>
          <CardDescription>
            계좌 잔고와 리스크 파라미터를 설정하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="balance">계좌 잔고 (원)</Label>
              <Input
                id="balance"
                type="number"
                value={effectiveBalance}
                onChange={(e) => setAccountBalance(Number(e.target.value))}
                placeholder="10,000,000"
              />
              {balance.data?.data && accountBalance === null && (
                <p className="text-xs text-muted-foreground">
                  계좌 예수금에서 자동 반영
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="risk">리스크 비율 (%)</Label>
              <Input
                id="risk"
                type="number"
                min={0.1}
                max={100}
                step={0.1}
                value={riskPercent}
                onChange={(e) => setRiskPercent(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stoploss">손절 거리 (%)</Label>
              <Input
                id="stoploss"
                type="number"
                min={0.1}
                max={100}
                step={0.1}
                value={stopLossPercent}
                onChange={(e) => setStopLossPercent(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry">진입가 (원)</Label>
              <Input
                id="entry"
                type="number"
                min={0}
                value={entryPrice}
                onChange={(e) => setEntryPrice(Number(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculation Tabs */}
      <Tabs defaultValue="fixed">
        <TabsList>
          <TabsTrigger value="fixed">고정 비율</TabsTrigger>
          <TabsTrigger value="risk">리스크 기반</TabsTrigger>
          <TabsTrigger value="kelly">켈리 공식</TabsTrigger>
        </TabsList>

        <TabsContent value="fixed">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">고정 비율 (Fixed Ratio)</CardTitle>
              <CardDescription>
                계좌 잔고 x 리스크 비율로 투자 금액을 결정합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FixedRatioCalc
                accountBalance={effectiveBalance}
                riskPercent={riskPercent}
                entryPrice={entryPrice}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                리스크 기반 (Risk-Based)
              </CardTitle>
              <CardDescription>
                최대 손실 금액을 기준으로 적정 매수 수량을 계산합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RiskBasedCalc
                accountBalance={effectiveBalance}
                riskPercent={riskPercent}
                stopLossPercent={stopLossPercent}
                entryPrice={entryPrice}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kelly">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                켈리 공식 (Kelly Criterion)
              </CardTitle>
              <CardDescription>
                승률과 평균 손익 비율에 기반한 최적 투자 비율
              </CardDescription>
            </CardHeader>
            <CardContent>
              <KellyCalc accountBalance={effectiveBalance} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
