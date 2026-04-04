"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ArrowLeft, Blocks } from "lucide-react";

interface Strategy {
  id: string;
  name: string;
  description: string;
  category: string;
  tags?: string[];
  params?: Array<{ name: string; label: string; default: number; min: number; max: number }>;
}

type StrategyCategory = "추세추종" | "모멘텀" | "역추세" | "돌파매매" | "손절" | string;

const CATEGORY_COLORS: Record<string, string> = {
  추세추종: "bg-blue-500/20 text-blue-400",
  모멘텀: "bg-orange-500/20 text-orange-400",
  역추세: "bg-green-500/20 text-green-400",
  돌파매매: "bg-purple-500/20 text-purple-400",
  손절: "bg-red-500/20 text-red-400",
};

export function PresetsClient({ strategies }: { strategies: Strategy[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categories = [...new Set(strategies.map((s) => s.category))];
  const filtered =
    categoryFilter === "all"
      ? strategies
      : strategies.filter((s) => s.category === categoryFilter);
  const selected = strategies.find((s) => s.id === selectedId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          nativeButton={false}
          render={<Link href="/strategy" />}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">프리셋 전략</h1>
          <p className="text-sm text-muted-foreground">
            {strategies.length}개의 프리셋 전략
          </p>
        </div>
      </div>

      {/* Category filter */}
      <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
        <TabsList>
          <TabsTrigger value="all">전체</TabsTrigger>
          {categories.map((cat) => (
            <TabsTrigger key={cat} value={cat}>
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Strategy grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((strategy) => (
          <Card
            key={strategy.id}
            className="cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() => setSelectedId(strategy.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{strategy.name}</CardTitle>
                <Badge className={CATEGORY_COLORS[strategy.category] ?? ""}>
                  {strategy.category}
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

      {filtered.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Blocks className="size-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              해당 카테고리에 전략이 없습니다
            </p>
          </CardContent>
        </Card>
      )}

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelectedId(null)}>
        <SheetContent>
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div>
                  <Badge className={CATEGORY_COLORS[selected.category] ?? ""}>
                    {selected.category}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selected.description}
                </p>
                {selected.params && selected.params.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm">파라미터</h3>
                    {selected.params.map((p) => (
                      <div
                        key={p.name}
                        className="flex items-center justify-between rounded-lg border p-2 text-sm"
                      >
                        <span>{p.label ?? p.name}</span>
                        <span className="font-mono text-muted-foreground">
                          {p.default} ({p.min}~{p.max})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-1">
                  {(selected.tags ?? []).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
