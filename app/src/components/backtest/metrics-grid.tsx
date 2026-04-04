"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PerformanceMetrics } from "@/types/backtest";

interface MetricsGridProps {
  metrics: PerformanceMetrics;
}

interface MetricItem {
  label: string;
  value: string;
  colorClass?: string;
}

function pct(v: number): string {
  return `${(v * 100).toFixed(2)}%`;
}

function num(v: number): string {
  return v.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
}

function won(v: number): string {
  return `${v.toLocaleString("ko-KR", { maximumFractionDigits: 0 })}원`;
}

function profitColor(v: number): string {
  if (v > 0) return "text-red-500";
  if (v < 0) return "text-blue-500";
  return "text-muted-foreground";
}

interface MetricGroup {
  title: string;
  items: MetricItem[];
}

function safe(v: unknown): number {
  return typeof v === "number" ? v : 0;
}

function buildGroups(m: PerformanceMetrics): MetricGroup[] {
  // API 응답이 중첩(basic/risk/trading) 또는 플랫 구조일 수 있으므로 양쪽 지원
  const basic = (m as Record<string, unknown>).basic as Record<string, number> | undefined;
  const risk = (m as Record<string, unknown>).risk as Record<string, number> | undefined;
  const trading = (m as Record<string, unknown>).trading as Record<string, number> | undefined;
  const vol = (m as Record<string, unknown>).volatility as Record<string, number> | undefined;

  const totalReturn = safe(basic?.total_return ?? m.total_return);
  const annualReturn = safe(basic?.annual_return ?? m.annualized_return);
  const maxDrawdown = safe(basic?.max_drawdown ?? m.max_drawdown);
  const sharpe = safe(risk?.sharpe_ratio ?? m.sharpe_ratio);
  const sortino = safe(risk?.sortino_ratio ?? m.sortino_ratio);
  const volatility = safe(vol?.annual_std_dev ?? m.volatility);
  const totalTrades = safe(trading?.total_orders ?? m.total_trades);
  const winRate = safe(trading?.win_rate ?? m.win_rate);
  const lossRate = safe(trading?.loss_rate);
  const avgWin = safe(trading?.avg_win ?? m.avg_profit);
  const avgLoss = safe(trading?.avg_loss ?? m.avg_loss);
  const plRatio = safe(trading?.profit_loss_ratio ?? m.profit_factor);

  return [
    {
      title: "수익률",
      items: [
        {
          label: "총 수익률",
          value: pct(totalReturn / 100),
          colorClass: profitColor(totalReturn),
        },
        {
          label: "연환산 수익률",
          value: pct(annualReturn / 100),
          colorClass: profitColor(annualReturn),
        },
      ],
    },
    {
      title: "리스크",
      items: [
        { label: "샤프 비율", value: num(sharpe) },
        { label: "소르티노 비율", value: num(sortino) },
        {
          label: "최대 낙폭",
          value: pct(maxDrawdown / 100),
          colorClass: "text-blue-500",
        },
        { label: "변동성", value: pct(volatility) },
      ],
    },
    {
      title: "거래 통계",
      items: [
        { label: "총 거래 수", value: `${totalTrades}회` },
        { label: "승률", value: pct(winRate / 100) },
        { label: "패배율", value: pct(lossRate / 100) },
        {
          label: "평균 수익",
          value: won(avgWin),
          colorClass: "text-red-500",
        },
        {
          label: "평균 손실",
          value: won(avgLoss),
          colorClass: "text-blue-500",
        },
        { label: "손익비", value: num(plRatio) },
      ],
    },
  ];
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  const groups = buildGroups(metrics);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {groups.map((group) => (
        <Card key={group.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {group.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {group.items.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">{item.label}</span>
                <span
                  className={`font-mono font-medium ${item.colorClass ?? "text-foreground"}`}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
