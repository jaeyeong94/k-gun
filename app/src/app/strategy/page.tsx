"use client";

import { useState } from "react";
import Link from "next/link";
import { useStrategies } from "@/hooks/use-strategies";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Plus,
  Blocks,
  Library,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Target,
  TrendingUp,
  BarChart3,
  Zap,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type { Strategy, StrategyCategory } from "@/types/strategy";
import { CATEGORY_LABELS } from "@/types/strategy";

const CATEGORY_COLORS: Record<StrategyCategory, string> = {
  trend: "bg-blue-500/20 text-blue-400",
  momentum: "bg-orange-500/20 text-orange-400",
  mean_reversion: "bg-green-500/20 text-green-400",
  volatility: "bg-purple-500/20 text-purple-400",
  volume: "bg-cyan-500/20 text-cyan-400",
  composite: "bg-pink-500/20 text-pink-400",
};

// 전략별 상세 설명 데이터
const STRATEGY_GUIDES: Record<string, { howItWorks: string; example: string; bestFor: string; risk: string }> = {
  golden_cross: {
    howItWorks: "단기 이동평균선(5일)이 장기 이동평균선(20일)을 아래에서 위로 돌파하면 상승 추세 시작으로 판단하여 매수합니다. 반대로 하향 돌파하면 매도합니다.",
    example: "삼성전자가 5일선 68,000원, 20일선 67,500원일 때 5일선이 20일선을 돌파하면 → 매수 신호",
    bestFor: "중장기 추세를 따라가는 안정적인 매매에 적합합니다. 횡보장에서는 잦은 거짓 신호가 발생할 수 있습니다.",
    risk: "추세 전환 초기를 잡지만, 이미 상당 부분 오른 후일 수 있어 고점 매수 위험이 있습니다.",
  },
  momentum: {
    howItWorks: "최근 N일간의 수익률을 계산하여 일정 수준 이상 상승한 종목을 매수합니다. 수익률이 기준 이하로 떨어지면 매도합니다.",
    example: "60일 수익률이 30% 이상인 종목 → 강한 상승 모멘텀으로 매수",
    bestFor: "강한 상승세를 보이는 종목을 추격 매수할 때 유용합니다.",
    risk: "이미 많이 오른 종목을 사는 구조라 급락 시 큰 손실이 발생할 수 있습니다.",
  },
  week52_high: {
    howItWorks: "종가가 52주(약 1년) 최고가를 갱신하면 강한 돌파 신호로 판단하여 매수합니다.",
    example: "SK하이닉스가 52주 최고가 200,000원을 돌파하여 201,000원 마감 → 매수 신호",
    bestFor: "강한 돌파 추세를 탈 때 효과적입니다. 역사적 저항선을 돌파하는 순간을 포착합니다.",
    risk: "가짜 돌파(false breakout) 후 급락할 수 있으므로 손절 설정이 중요합니다.",
  },
  consecutive: {
    howItWorks: "N일 연속으로 종가가 상승하면 추세 지속으로 판단하여 매수합니다. N일 연속 하락 시 매도합니다.",
    example: "네이버가 5일 연속 상승 마감 → 상승 추세 지속으로 매수",
    bestFor: "뚜렷한 추세가 형성된 구간에서 효과적입니다.",
    risk: "연속 상승 후 평균회귀로 하락할 가능성이 있습니다.",
  },
  disparity: {
    howItWorks: "현재 종가와 이동평균선의 비율(이격도)을 계산합니다. 이격도가 낮으면(과매도) 매수, 높으면(과매수) 매도합니다.",
    example: "종가가 20일선 대비 90% 이하(이격도 0.9) → 과매도 구간으로 매수",
    bestFor: "평균으로 회귀하는 성질을 이용하여 저가 매수, 고가 매도에 적합합니다.",
    risk: "강한 추세장에서는 이격이 계속 벌어져 손실이 커질 수 있습니다.",
  },
  breakout_fail: {
    howItWorks: "전고점을 돌파한 후 다시 아래로 이탈하면 가짜 돌파로 판단하여 손절합니다.",
    example: "전고점 75,000원 돌파 후 72,000원으로 하락 → 가짜 돌파로 매도",
    bestFor: "손절 타이밍을 자동화하여 큰 손실을 방지합니다.",
    risk: "일시적 조정 후 재상승하는 경우 불필요한 손절이 될 수 있습니다.",
  },
  strong_close: {
    howItWorks: "당일 고가 대비 종가의 위치(IBS)를 계산합니다. 종가가 고가에 가까울수록 매수 강도가 높은 것으로 판단합니다.",
    example: "당일 고가 70,000원, 저가 68,000원, 종가 69,800원 → IBS 0.9로 강한 종가 → 매수",
    bestFor: "장 마감 후 다음날 상승을 기대하는 단기 매매에 적합합니다.",
    risk: "종가 마감 직전의 순간적 움직임에 의존하므로 불안정할 수 있습니다.",
  },
  volatility: {
    howItWorks: "변동성이 축소된 구간에서 갑자기 큰 폭으로 상승하면 변동성 확장으로 판단하여 매수합니다.",
    example: "10일간 일평균 변동률 1% 이하에서 갑자기 3% 급등 → 매수 신호",
    bestFor: "횡보 후 방향이 정해지는 순간을 포착합니다. 에너지 축적 후 폭발하는 패턴에 유효합니다.",
    risk: "변동성 확장이 하락 방향일 수도 있으므로 방향 확인이 중요합니다.",
  },
  mean_reversion: {
    howItWorks: "단기 평균 대비 종가가 크게 이탈하면 평균으로 회귀할 것으로 기대하여 반대 방향으로 매매합니다.",
    example: "5일 평균 대비 3% 이상 하락 → 과매도로 매수, 3% 이상 상승 → 과매수로 매도",
    bestFor: "박스권 횡보장에서 수익을 내는 역추세 전략입니다.",
    risk: "강한 추세장에서는 평균회귀가 작동하지 않아 큰 손실이 발생합니다.",
  },
  trend_filter: {
    howItWorks: "장기 이동평균선(60일) 위에서 전일 대비 상승 중일 때만 매수합니다. 장기 추세와 단기 방향이 모두 상승일 때만 진입합니다.",
    example: "종가가 60일선 위에 있고, 전일 대비 상승 마감 → 매수 조건 충족",
    bestFor: "추세와 타이밍을 동시에 고려하는 보수적인 전략입니다. 잘못된 진입을 줄여줍니다.",
    risk: "조건이 엄격하여 매매 기회가 적을 수 있습니다.",
  },
};

function formatOperator(op: string): string {
  const map: Record<string, string> = {
    cross_above: "상향 돌파",
    cross_below: "하향 돌파",
    greater_than: "> (초과)",
    less_than: "< (미만)",
    greater_equal: ">= (이상)",
    less_equal: "<= (이하)",
  };
  return map[op] ?? op;
}

function StrategyDetailSheet({ strategy }: { strategy: Strategy & { builder_state?: BuilderState; params?: ParamDef[] } }) {
  const guide = STRATEGY_GUIDES[strategy.id];
  const bs = strategy.builder_state;

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <Zap className="size-5" />
          {strategy.name}
        </SheetTitle>
      </SheetHeader>

      <div className="mt-4 space-y-5 pb-6">
        {/* 카테고리 + 설명 */}
        <div>
          <Badge className={CATEGORY_COLORS[strategy.category] ?? ""}>
            {CATEGORY_LABELS[strategy.category as StrategyCategory] ?? strategy.category}
          </Badge>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {strategy.description}
          </p>
        </div>

        {guide && (
          <>
            <Separator />

            {/* 작동 원리 */}
            <div className="space-y-2">
              <h3 className="flex items-center gap-1.5 font-medium text-sm">
                <BarChart3 className="size-4 text-primary" />
                작동 원리
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {guide.howItWorks}
              </p>
            </div>

            {/* 예시 */}
            <div className="rounded-lg bg-muted/50 border p-3 space-y-1">
              <h4 className="flex items-center gap-1.5 text-xs font-medium">
                <Target className="size-3.5 text-primary" />
                예시
              </h4>
              <p className="text-sm leading-relaxed">{guide.example}</p>
            </div>

            {/* 적합한 상황 + 리스크 */}
            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3 space-y-1">
                <h4 className="flex items-center gap-1.5 text-xs font-medium text-green-500">
                  <TrendingUp className="size-3.5" />
                  적합한 상황
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{guide.bestFor}</p>
              </div>
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 space-y-1">
                <h4 className="flex items-center gap-1.5 text-xs font-medium text-red-500">
                  <ShieldCheck className="size-3.5" />
                  주의사항
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{guide.risk}</p>
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* 매매 조건 시각화 */}
        {bs && (
          <div className="space-y-3">
            <h3 className="font-medium text-sm">매매 조건</h3>

            {/* 진입 */}
            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <ArrowUpRight className="size-4 text-red-500" />
                <span className="text-xs font-medium text-red-500">진입 (매수)</span>
                {bs.entry.logic && (
                  <Badge variant="outline" className="text-[10px] ml-auto">{bs.entry.logic}</Badge>
                )}
              </div>
              {bs.entry.conditions.map((c: ConditionItem) => (
                <div key={c.id} className="text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1.5">
                  <span className="font-mono">{c.left?.indicatorAlias ?? c.left?.priceField ?? "?"}</span>
                  {" "}
                  <span className="font-medium text-foreground">{formatOperator(c.operator)}</span>
                  {" "}
                  <span className="font-mono">{c.right?.indicatorAlias ?? c.right?.value ?? c.right?.priceField ?? "?"}</span>
                </div>
              ))}
            </div>

            {/* 청산 */}
            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <ArrowDownRight className="size-4 text-blue-500" />
                <span className="text-xs font-medium text-blue-500">청산 (매도)</span>
                {bs.exit.logic && (
                  <Badge variant="outline" className="text-[10px] ml-auto">{bs.exit.logic}</Badge>
                )}
              </div>
              {bs.exit.conditions.map((c: ConditionItem) => (
                <div key={c.id} className="text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1.5">
                  <span className="font-mono">{c.left?.indicatorAlias ?? c.left?.priceField ?? "?"}</span>
                  {" "}
                  <span className="font-medium text-foreground">{formatOperator(c.operator)}</span>
                  {" "}
                  <span className="font-mono">{c.right?.indicatorAlias ?? c.right?.value ?? c.right?.priceField ?? "?"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 파라미터 */}
        {strategy.params && strategy.params.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium text-sm">조절 가능한 파라미터</h3>
            {strategy.params.map((p: ParamDef) => (
              <div
                key={p.name}
                className="flex items-center justify-between rounded-lg border p-2.5"
              >
                <div>
                  <span className="text-sm font-medium">{p.label}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-sm">{p.default}</span>
                  <span className="text-[10px] text-muted-foreground ml-1">
                    ({p.min}~{p.max})
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 리스크 관리 */}
        {bs?.risk && (
          <div className="space-y-2">
            <h3 className="font-medium text-sm">리스크 관리</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className={`rounded-lg border p-2 text-center ${bs.risk.stopLoss?.enabled ? "border-red-500/30" : "opacity-40"}`}>
                <div className="text-[10px] text-muted-foreground">손절</div>
                <div className="font-mono text-sm font-medium">
                  {bs.risk.stopLoss?.enabled ? `${bs.risk.stopLoss.percent}%` : "OFF"}
                </div>
              </div>
              <div className={`rounded-lg border p-2 text-center ${bs.risk.takeProfit?.enabled ? "border-green-500/30" : "opacity-40"}`}>
                <div className="text-[10px] text-muted-foreground">익절</div>
                <div className="font-mono text-sm font-medium">
                  {bs.risk.takeProfit?.enabled ? `${bs.risk.takeProfit.percent}%` : "OFF"}
                </div>
              </div>
              <div className={`rounded-lg border p-2 text-center ${bs.risk.trailingStop?.enabled ? "border-yellow-500/30" : "opacity-40"}`}>
                <div className="text-[10px] text-muted-foreground">추적</div>
                <div className="font-mono text-sm font-medium">
                  {bs.risk.trailingStop?.enabled ? `${bs.risk.trailingStop.percent}%` : "OFF"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 태그 */}
        {(strategy.tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {(strategy.tags ?? []).map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <Separator />

        {/* 액션 버튼 */}
        <div className="flex gap-2">
          <Button
            nativeButton={false}
            render={<Link href={`/strategy/builder?preset=${strategy.id}`} />}
            className="flex-1"
          >
            이 전략으로 빌더 열기
          </Button>
          <Button
            nativeButton={false}
            render={<Link href={`/backtest?strategy=${strategy.id}`} />}
            variant="outline"
            className="flex-1"
          >
            백테스트 실행
          </Button>
        </div>
      </div>
    </>
  );
}

// builder_state 내부 타입
interface ConditionOperand {
  type: string;
  indicatorAlias?: string;
  indicatorOutput?: string;
  value?: number;
  priceField?: string;
}

interface ConditionItem {
  id: string;
  left: ConditionOperand;
  operator: string;
  right: ConditionOperand;
}

interface ConditionGroup {
  logic: string;
  conditions: ConditionItem[];
}

interface RiskSetting {
  enabled: boolean;
  percent: number;
}

interface BuilderState {
  metadata: { id: string; name: string; description: string; category: string; tags: string[]; author: string };
  indicators: Array<{ id: string; indicatorId: string; alias: string; params: Record<string, number>; output: string }>;
  entry: ConditionGroup;
  exit: ConditionGroup;
  risk: { stopLoss?: RiskSetting; takeProfit?: RiskSetting; trailingStop?: RiskSetting };
}

interface ParamDef {
  name: string;
  label: string;
  min: number;
  max: number;
  default: number;
  step?: number;
}

export default function StrategyPage() {
  const { data, isLoading, error } = useStrategies();
  const strategies = data?.strategies ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = strategies.find((s: Strategy) => s.id === selectedId);

  const grouped = strategies.reduce(
    (acc, s) => {
      const cat = s.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(s);
      return acc;
    },
    {} as Record<string, typeof strategies>,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">전략 빌더</h1>
          <p className="text-sm text-muted-foreground">
            프리셋 전략을 선택하거나 커스텀 전략을 직접 빌드하세요
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" nativeButton={false} render={<Link href="/strategy/presets" />}>
            <Library className="mr-1.5 size-4" />
            전체 프리셋
          </Button>
          <Button nativeButton={false} render={<Link href="/strategy/builder" />}>
            <Plus className="mr-1.5 size-4" />
            전략 만들기
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              전략 목록을 불러오지 못했습니다
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              백엔드 서버 연결을 확인해주세요
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && strategies.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Blocks className="size-12 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">등록된 전략이 없습니다</p>
              <p className="text-sm text-muted-foreground">
                직접 전략을 빌드해보세요
              </p>
            </div>
            <Button nativeButton={false} render={<Link href="/strategy/builder" />}>
              <Plus className="mr-1.5 size-4" />
              전략 만들기
            </Button>
          </CardContent>
        </Card>
      )}

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="space-y-3">
          <h2 className="text-lg font-semibold">
            {CATEGORY_LABELS[category as StrategyCategory] ?? category}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((strategy) => (
              <Card
                key={strategy.id}
                className="cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => setSelectedId(strategy.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">
                      {strategy.name}
                    </CardTitle>
                    <Badge
                      className={
                        CATEGORY_COLORS[strategy.category] ?? ""
                      }
                    >
                      {CATEGORY_LABELS[strategy.category] ?? strategy.category}
                    </Badge>
                  </div>
                  <CardDescription>{strategy.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {(strategy.tags ?? []).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Strategy Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelectedId(null)}>
        <SheetContent className="overflow-y-auto">
          {selected && (
            <StrategyDetailSheet strategy={selected} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
