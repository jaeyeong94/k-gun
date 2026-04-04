"use client";

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
import { Plus, Blocks, Library } from "lucide-react";
import type { StrategyCategory } from "@/types/strategy";
import { CATEGORY_LABELS } from "@/types/strategy";

const CATEGORY_COLORS: Record<StrategyCategory, string> = {
  trend: "bg-blue-500/20 text-blue-400",
  momentum: "bg-orange-500/20 text-orange-400",
  mean_reversion: "bg-green-500/20 text-green-400",
  volatility: "bg-purple-500/20 text-purple-400",
  volume: "bg-cyan-500/20 text-cyan-400",
  composite: "bg-pink-500/20 text-pink-400",
};

export default function StrategyPage() {
  const { data, isLoading, error } = useStrategies();
  const strategies = data?.strategies ?? [];

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
              <Link
                key={strategy.id}
                href={`/strategy/presets?id=${strategy.id}`}
              >
                <Card className="cursor-pointer transition-colors hover:bg-muted/50">
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
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
