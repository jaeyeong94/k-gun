"use client";

import { useMemo } from "react";
import Link from "next/link";
import yaml from "js-yaml";
import { useIndicators } from "@/hooks/use-strategies";
import { useStrategyStore } from "@/stores/strategy";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  RotateCcw,
} from "lucide-react";
import type { Condition } from "@/types/strategy";

const OPERATORS = [
  { value: ">", label: ">" },
  { value: "<", label: "<" },
  { value: ">=", label: ">=" },
  { value: "<=", label: "<=" },
  { value: "==", label: "==" },
  { value: "crosses_above", label: "상향돌파" },
  { value: "crosses_below", label: "하향돌파" },
] as const;

const STEPS = [
  { value: "0", label: "1. 지표 선택" },
  { value: "1", label: "2. 진입 조건" },
  { value: "2", label: "3. 퇴장 조건" },
  { value: "3", label: "4. 리스크" },
  { value: "4", label: "5. 정보" },
];

function ConditionRow({
  condition,
  indicators,
  onChange,
  onRemove,
}: {
  condition: Condition;
  indicators: string[];
  onChange: (c: Condition) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <select
        className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
        value={condition.indicator}
        onChange={(e) => onChange({ ...condition, indicator: e.target.value })}
      >
        <option value="">지표 선택</option>
        {indicators.map((ind) => (
          <option key={ind} value={ind}>
            {ind}
          </option>
        ))}
      </select>
      <Input
        className="w-20"
        placeholder="필드"
        value={condition.field}
        onChange={(e) => onChange({ ...condition, field: e.target.value })}
      />
      <select
        className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
        value={condition.operator}
        onChange={(e) =>
          onChange({
            ...condition,
            operator: e.target.value as Condition["operator"],
          })
        }
      >
        {OPERATORS.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>
      <Input
        className="w-24"
        placeholder="값"
        value={condition.value}
        onChange={(e) => onChange({ ...condition, value: e.target.value })}
      />
      <Button variant="ghost" size="icon-sm" onClick={onRemove}>
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}

export default function BuilderPage() {
  const { data: indicatorsData, isLoading: indicatorsLoading } =
    useIndicators();
  const indicators = indicatorsData?.indicators ?? [];

  const store = useStrategyStore();

  const indicatorsByCategory = useMemo(() => {
    const map: Record<string, typeof indicators> = {};
    for (const ind of indicators) {
      const cat = ind.category || "기타";
      if (!map[cat]) map[cat] = [];
      map[cat].push(ind);
    }
    return map;
  }, [indicators]);

  const yamlPreview = useMemo(() => {
    const obj: Record<string, unknown> = {
      name: store.name || "(이름 미입력)",
      description: store.description || "(설명 미입력)",
      indicators: store.selectedIndicators,
      entry_conditions: store.entryConditions.filter((c) => c.indicator),
      exit_conditions: store.exitConditions.filter((c) => c.indicator),
      risk_management: {
        ...(store.riskManagement.stop_loss_pct != null && {
          stop_loss_pct: store.riskManagement.stop_loss_pct,
        }),
        ...(store.riskManagement.take_profit_pct != null && {
          take_profit_pct: store.riskManagement.take_profit_pct,
        }),
        ...(store.riskManagement.trailing_stop_pct != null && {
          trailing_stop_pct: store.riskManagement.trailing_stop_pct,
        }),
        ...(store.riskManagement.max_position_size != null && {
          max_position_size: store.riskManagement.max_position_size,
        }),
      },
    };
    return yaml.dump(obj, { indent: 2, lineWidth: 80 });
  }, [
    store.name,
    store.description,
    store.selectedIndicators,
    store.entryConditions,
    store.exitConditions,
    store.riskManagement,
  ]);

  const stepValue = String(store.currentStep);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" nativeButton={false} render={<Link href="/strategy" />}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">전략 빌더</h1>
          <p className="text-sm text-muted-foreground">
            단계별로 매매 전략을 구성하세요
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => store.reset()}>
          <RotateCcw className="mr-1.5 size-3.5" />
          초기화
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* Left: wizard steps */}
        <Tabs
          value={stepValue}
          onValueChange={(v) => store.setStep(Number(v))}
        >
          <TabsList>
            {STEPS.map((step) => (
              <TabsTrigger key={step.value} value={step.value}>
                {step.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Step 1: Indicator selection */}
          <TabsContent value="0">
            <Card>
              <CardHeader>
                <CardTitle>지표 선택</CardTitle>
                <CardDescription>
                  전략에 사용할 기술적 지표를 선택하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                {indicatorsLoading ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(indicatorsByCategory).map(
                      ([category, items]) => (
                        <div key={category} className="space-y-2">
                          <h3 className="text-sm font-medium text-muted-foreground">
                            {category}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {items.map((ind) => {
                              const selected =
                                store.selectedIndicators.includes(ind.name);
                              return (
                                <Button
                                  key={ind.name}
                                  variant={selected ? "default" : "outline"}
                                  size="sm"
                                  onClick={() =>
                                    store.toggleIndicator(ind.name)
                                  }
                                  title={ind.description}
                                >
                                  {selected && (
                                    <Check className="mr-1 size-3" />
                                  )}
                                  {ind.display_name || ind.name}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      ),
                    )}
                    {indicators.length === 0 && (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        사용 가능한 지표가 없습니다. 서버 연결을 확인하세요.
                      </p>
                    )}
                  </div>
                )}
                {store.selectedIndicators.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5 border-t pt-4">
                    <span className="text-sm text-muted-foreground mr-1">
                      선택됨:
                    </span>
                    {store.selectedIndicators.map((name) => (
                      <Badge
                        key={name}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => store.toggleIndicator(name)}
                      >
                        {name} &times;
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step 2: Entry conditions */}
          <TabsContent value="1">
            <Card>
              <CardHeader>
                <CardTitle>진입 조건</CardTitle>
                <CardDescription>
                  매수 신호를 발생시킬 조건을 정의하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {store.entryConditions.map((cond, i) => (
                  <ConditionRow
                    key={i}
                    condition={cond}
                    indicators={store.selectedIndicators}
                    onChange={(c) => store.updateEntryCondition(i, c)}
                    onRemove={() => store.removeEntryCondition(i)}
                  />
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => store.addEntryCondition()}
                >
                  <Plus className="mr-1 size-3.5" />
                  조건 추가
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step 3: Exit conditions */}
          <TabsContent value="2">
            <Card>
              <CardHeader>
                <CardTitle>퇴장 조건</CardTitle>
                <CardDescription>
                  매도 신호를 발생시킬 조건을 정의하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {store.exitConditions.map((cond, i) => (
                  <ConditionRow
                    key={i}
                    condition={cond}
                    indicators={store.selectedIndicators}
                    onChange={(c) => store.updateExitCondition(i, c)}
                    onRemove={() => store.removeExitCondition(i)}
                  />
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => store.addExitCondition()}
                >
                  <Plus className="mr-1 size-3.5" />
                  조건 추가
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step 4: Risk management */}
          <TabsContent value="3">
            <Card>
              <CardHeader>
                <CardTitle>리스크 관리</CardTitle>
                <CardDescription>
                  손절/익절 및 포지션 크기를 설정하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="stop-loss">손절 (%)</Label>
                    <Input
                      id="stop-loss"
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="3"
                      value={store.riskManagement.stop_loss_pct ?? ""}
                      onChange={(e) =>
                        store.setRiskManagement({
                          stop_loss_pct: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="take-profit">익절 (%)</Label>
                    <Input
                      id="take-profit"
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="5"
                      value={store.riskManagement.take_profit_pct ?? ""}
                      onChange={(e) =>
                        store.setRiskManagement({
                          take_profit_pct: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trailing-stop">트레일링 스탑 (%)</Label>
                    <Input
                      id="trailing-stop"
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="미설정"
                      value={store.riskManagement.trailing_stop_pct ?? ""}
                      onChange={(e) =>
                        store.setRiskManagement({
                          trailing_stop_pct: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-position">최대 포지션 크기 (%)</Label>
                    <Input
                      id="max-position"
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      placeholder="미설정"
                      value={store.riskManagement.max_position_size ?? ""}
                      onChange={(e) =>
                        store.setRiskManagement({
                          max_position_size: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step 5: Metadata */}
          <TabsContent value="4">
            <Card>
              <CardHeader>
                <CardTitle>전략 정보</CardTitle>
                <CardDescription>
                  전략 이름과 설명을 입력하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="strategy-name">전략 이름</Label>
                  <Input
                    id="strategy-name"
                    placeholder="예: 골든크로스 돌파 전략"
                    value={store.name}
                    onChange={(e) => store.setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="strategy-desc">설명</Label>
                  <textarea
                    id="strategy-desc"
                    className="h-24 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                    placeholder="전략에 대한 간략한 설명을 입력하세요"
                    value={store.description}
                    onChange={(e) => store.setDescription(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Right: YAML preview */}
        <Card className="lg:sticky lg:top-4 h-fit">
          <CardHeader>
            <CardTitle className="text-sm">YAML 미리보기</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-[60vh] overflow-auto rounded-lg bg-muted/50 p-3 text-xs font-mono leading-relaxed">
              {yamlPreview}
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* Bottom navigation */}
      <div className="flex items-center justify-between border-t pt-4">
        <Button
          variant="outline"
          disabled={store.currentStep === 0}
          onClick={() => store.setStep(store.currentStep - 1)}
        >
          이전 단계
        </Button>
        <span className="text-sm text-muted-foreground">
          {store.currentStep + 1} / {STEPS.length}
        </span>
        {store.currentStep < STEPS.length - 1 ? (
          <Button onClick={() => store.setStep(store.currentStep + 1)}>
            다음 단계
          </Button>
        ) : (
          <Button
            disabled={!store.name || store.selectedIndicators.length === 0}
          >
            전략 저장
          </Button>
        )}
      </div>
    </div>
  );
}
