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
          value: `${avgWin.toFixed(2)}%`,
          colorClass: "text-red-500",
        },
        {
          label: "평균 손실",
          value: `${avgLoss.toFixed(2)}%`,
          colorClass: "text-blue-500",
        },
        { label: "손익비", value: num(plRatio) },
      ],
    },
  ];
}

const METRIC_GUIDES: Array<{
  term: string;
  category: string;
  description: string;
  interpretation: string;
}> = [
  {
    term: "총 수익률",
    category: "수익률",
    description: "백테스트 기간 동안의 전체 수익률입니다.",
    interpretation: "양수면 수익, 음수면 손실. 같은 기간 코스피 수익률과 비교하세요.",
  },
  {
    term: "연환산 수익률",
    category: "수익률",
    description: "1년 기준으로 환산한 수익률입니다. 기간이 다른 전략을 비교할 때 사용합니다.",
    interpretation: "예금 금리(약 3~4%)보다 높아야 투자 의미가 있습니다.",
  },
  {
    term: "샤프 비율",
    category: "리스크",
    description: "위험 대비 초과 수익을 측정합니다. (수익률 - 무위험수익률) / 변동성으로 계산됩니다.",
    interpretation: "1.0 이상이면 양호, 2.0 이상이면 우수. 음수면 무위험 자산보다 못한 성과입니다.",
  },
  {
    term: "소르티노 비율",
    category: "리스크",
    description: "샤프 비율과 유사하지만, 하락 변동성만 고려합니다. 손실 위험 대비 수익을 측정합니다.",
    interpretation: "샤프 비율보다 높으면 상승 변동이 크다는 의미로 긍정적입니다.",
  },
  {
    term: "최대 낙폭 (MDD)",
    category: "리스크",
    description: "전고점 대비 최대 하락 폭입니다. 투자 기간 중 겪을 수 있는 최악의 손실을 나타냅니다.",
    interpretation: "10% 이하면 안정적, 20% 이상이면 높은 위험. 본인이 감당 가능한 수준인지 확인하세요.",
  },
  {
    term: "변동성",
    category: "리스크",
    description: "수익률의 연간 표준편차입니다. 수익률이 얼마나 불규칙하게 변하는지를 나타냅니다.",
    interpretation: "낮을수록 안정적. 20% 이하면 보통, 30% 이상이면 고위험입니다.",
  },
  {
    term: "승률",
    category: "거래 통계",
    description: "전체 거래 중 수익을 낸 거래의 비율입니다.",
    interpretation: "50% 이상이면 양호. 다만 승률이 낮아도 손익비가 높으면 수익 가능합니다.",
  },
  {
    term: "손익비",
    category: "거래 통계",
    description: "평균 수익 / 평균 손실의 비율입니다. 이길 때 얼마나 크게 이기는지를 나타냅니다.",
    interpretation: "1.0 이상이면 평균 수익이 평균 손실보다 큼. 2.0 이상이면 우수한 전략입니다.",
  },
  {
    term: "평균 수익 / 평균 손실",
    category: "거래 통계",
    description: "수익 거래의 평균 금액과 손실 거래의 평균 금액입니다.",
    interpretation: "평균 수익이 평균 손실보다 커야 장기적으로 유리합니다.",
  },
];

const CATEGORY_ICONS: Record<string, string> = {
  수익률: "📈",
  리스크: "⚖️",
  "거래 통계": "📊",
};

export function MetricsGrid({ metrics }: MetricsGridProps) {
  const groups = buildGroups(metrics);

  return (
    <div className="space-y-6">
      {/* 성과 지표 카드 */}
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

      {/* 용어 해설 가이드 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            지표 해설 가이드
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {["수익률", "리스크", "거래 통계"].map((category) => (
              <div key={category} className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <span>{CATEGORY_ICONS[category]}</span>
                  {category}
                </h4>
                <div className="space-y-2">
                  {METRIC_GUIDES.filter((g) => g.category === category).map((guide) => (
                    <div
                      key={guide.term}
                      className="rounded-lg border bg-muted/20 p-3 space-y-1"
                    >
                      <div className="font-medium text-sm">{guide.term}</div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {guide.description}
                      </p>
                      <p className="text-xs leading-relaxed">
                        <span className="font-medium text-primary">해석: </span>
                        {guide.interpretation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
