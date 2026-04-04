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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ArrowLeft, Blocks } from "lucide-react";
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

const ALL_CATEGORIES: ("all" | StrategyCategory)[] = [
  "all",
  "trend",
  "momentum",
  "mean_reversion",
  "volatility",
  "volume",
  "composite",
];

const TAB_LABELS: Record<string, string> = {
  all: "전체",
  ...CATEGORY_LABELS,
};

export default function PresetsPage() {
  const { data, isLoading } = useStrategies();
  const strategies = data?.strategies ?? [];
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(
    null,
  );

  const filtered =
    selectedCategory === "all"
      ? strategies
      : strategies.filter((s) => s.category === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" nativeButton={false} render={<Link href="/strategy" />}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">프리셋 전략</h1>
          <p className="text-sm text-muted-foreground">
            검증된 전략 템플릿 목록
          </p>
        </div>
      </div>

      <Tabs
        value={selectedCategory}
        onValueChange={setSelectedCategory}
      >
        <TabsList>
          {ALL_CATEGORIES.map((cat) => (
            <TabsTrigger key={cat} value={cat}>
              {TAB_LABELS[cat]}
            </TabsTrigger>
          ))}
        </TabsList>

        {ALL_CATEGORIES.map((cat) => (
          <TabsContent key={cat} value={cat}>
            {isLoading ? (
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
            ) : filtered.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-4 py-12">
                  <Blocks className="size-12 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    해당 카테고리에 전략이 없습니다
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((strategy) => (
                  <Card
                    key={strategy.id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => setSelectedStrategy(strategy)}
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
                          {CATEGORY_LABELS[strategy.category] ??
                            strategy.category}
                        </Badge>
                      </div>
                      <CardDescription>{strategy.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {strategy.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Strategy detail sheet */}
      <Sheet
        open={selectedStrategy !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedStrategy(null);
        }}
      >
        <SheetContent side="right" className="overflow-y-auto sm:max-w-lg">
          {selectedStrategy && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedStrategy.name}</SheetTitle>
                <SheetDescription>
                  {selectedStrategy.description}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 p-4">
                {/* Category & Tags */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    카테고리
                  </h3>
                  <Badge
                    className={
                      CATEGORY_COLORS[selectedStrategy.category] ?? ""
                    }
                  >
                    {CATEGORY_LABELS[selectedStrategy.category] ??
                      selectedStrategy.category}
                  </Badge>
                </div>

                {selectedStrategy.tags.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      태그
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedStrategy.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Indicators */}
                {selectedStrategy.indicators.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      사용 지표
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedStrategy.indicators.map((ind) => (
                        <Badge key={ind} variant="secondary">
                          {ind}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Entry Conditions */}
                {selectedStrategy.entry_conditions.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      진입 조건
                    </h3>
                    <div className="space-y-1.5">
                      {selectedStrategy.entry_conditions.map((cond, i) => (
                        <div
                          key={i}
                          className="rounded-md bg-muted/50 px-3 py-2 text-sm font-mono"
                        >
                          {cond.indicator}.{cond.field} {cond.operator}{" "}
                          {cond.value}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Exit Conditions */}
                {selectedStrategy.exit_conditions.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      퇴장 조건
                    </h3>
                    <div className="space-y-1.5">
                      {selectedStrategy.exit_conditions.map((cond, i) => (
                        <div
                          key={i}
                          className="rounded-md bg-muted/50 px-3 py-2 text-sm font-mono"
                        >
                          {cond.indicator}.{cond.field} {cond.operator}{" "}
                          {cond.value}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risk Management */}
                {selectedStrategy.risk_management && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      리스크 관리
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedStrategy.risk_management.stop_loss_pct != null && (
                        <div className="rounded-md bg-muted/50 px-3 py-2">
                          <div className="text-xs text-muted-foreground">
                            손절
                          </div>
                          <div className="font-mono text-sm">
                            {selectedStrategy.risk_management.stop_loss_pct}%
                          </div>
                        </div>
                      )}
                      {selectedStrategy.risk_management.take_profit_pct !=
                        null && (
                        <div className="rounded-md bg-muted/50 px-3 py-2">
                          <div className="text-xs text-muted-foreground">
                            익절
                          </div>
                          <div className="font-mono text-sm">
                            {selectedStrategy.risk_management.take_profit_pct}%
                          </div>
                        </div>
                      )}
                      {selectedStrategy.risk_management.trailing_stop_pct !=
                        null && (
                        <div className="rounded-md bg-muted/50 px-3 py-2">
                          <div className="text-xs text-muted-foreground">
                            트레일링 스탑
                          </div>
                          <div className="font-mono text-sm">
                            {selectedStrategy.risk_management.trailing_stop_pct}%
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
