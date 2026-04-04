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

function buildGroups(m: PerformanceMetrics): MetricGroup[] {
  return [
    {
      title: "수익률",
      items: [
        {
          label: "총 수익률",
          value: pct(m.total_return),
          colorClass: profitColor(m.total_return),
        },
        {
          label: "연환산 수익률",
          value: pct(m.annualized_return),
          colorClass: profitColor(m.annualized_return),
        },
      ],
    },
    {
      title: "리스크",
      items: [
        { label: "샤프 비율", value: num(m.sharpe_ratio) },
        { label: "소르티노 비율", value: num(m.sortino_ratio) },
        {
          label: "최대 낙폭",
          value: pct(m.max_drawdown),
          colorClass: "text-blue-500",
        },
        { label: "변동성", value: pct(m.volatility) },
      ],
    },
    {
      title: "거래 통계",
      items: [
        { label: "총 거래 수", value: `${m.total_trades}회` },
        { label: "승률", value: pct(m.win_rate) },
        { label: "승리 거래", value: `${m.winning_trades}회` },
        { label: "패배 거래", value: `${m.losing_trades}회` },
        {
          label: "평균 수익",
          value: won(m.avg_profit),
          colorClass: "text-red-500",
        },
        {
          label: "평균 손실",
          value: won(m.avg_loss),
          colorClass: "text-blue-500",
        },
        { label: "손익비", value: num(m.profit_factor) },
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
