"use client";

import { useState, useCallback } from "react";
import {
  useWatchlists,
  useWatchlistItems,
  useCreateWatchlist,
  useDeleteWatchlist,
  useAddWatchlistItem,
  useRemoveWatchlistItem,
} from "@/hooks/use-watchlists";
import { useSymbolSearch, useStockPrice } from "@/hooks/use-explorer";
import type { SymbolSearchResult } from "@/hooks/use-explorer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { PriceChart } from "@/components/chart/price-chart";
import {
  Star,
  Plus,
  Trash2,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  ListPlus,
  Eye,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

// ─── Helpers ────────────────────────────────────────────────

function formatNumber(n: number): string {
  return n.toLocaleString("ko-KR");
}

function formatRate(rate: number): string {
  const sign = rate > 0 ? "+" : "";
  return `${sign}${rate.toFixed(2)}%`;
}

function priceColor(change: number): string {
  if (change > 0) return "text-red-500";
  if (change < 0) return "text-blue-500";
  return "text-muted-foreground";
}

function PriceChangeIcon({ change }: { change: number }) {
  if (change > 0) return <TrendingUp className="size-3.5 text-red-500" />;
  if (change < 0) return <TrendingDown className="size-3.5 text-blue-500" />;
  return <Minus className="size-3.5 text-muted-foreground" />;
}

// ─── Stock Price Cell ───────────────────────────────────────

function StockPriceCell({ code }: { code: string }) {
  const { data: price, isLoading } = useStockPrice(code);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    );
  }

  if (!price) {
    return (
      <span className="text-xs text-muted-foreground">가격 정보 없음</span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`font-mono text-sm font-semibold ${priceColor(price.change)}`}>
        {formatNumber(price.price)}
      </span>
      <div className={`flex items-center gap-0.5 ${priceColor(price.change)}`}>
        <PriceChangeIcon change={price.change} />
        <span className="font-mono text-xs">
          {formatRate(price.change_rate)}
        </span>
      </div>
    </div>
  );
}

// ─── Create Watchlist Dialog ────────────────────────────────

function CreateWatchlistDialog() {
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const createMutation = useCreateWatchlist();

  const handleCreate = useCallback(() => {
    if (!name.trim()) return;
    createMutation.mutate(name.trim(), {
      onSuccess: () => {
        setName("");
        setOpen(false);
      },
    });
  }, [name, createMutation]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="outline" size="sm" />}
      >
        <Plus className="size-3.5" />
        새 워치리스트
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>워치리스트 만들기</DialogTitle>
          <DialogDescription>
            관심 종목을 모아볼 워치리스트를 만드세요
          </DialogDescription>
        </DialogHeader>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="워치리스트 이름 (예: 반도체 관련주)"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreate();
          }}
          autoFocus
        />
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            취소
          </DialogClose>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? "생성 중..." : "만들기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add Stock Dialog ───────────────────────────────────────

function AddStockDialog({ watchlistId }: { watchlistId: string }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [memo, setMemo] = useState("");
  const [targetBuy, setTargetBuy] = useState("");
  const [targetSell, setTargetSell] = useState("");
  const [selected, setSelected] = useState<SymbolSearchResult | null>(null);

  const { data: results, isLoading: isSearching } = useSymbolSearch(query);
  const addMutation = useAddWatchlistItem(watchlistId);

  const handleAdd = useCallback(() => {
    if (!selected) return;
    addMutation.mutate(
      {
        stockCode: selected.code,
        stockName: selected.name,
        memo: memo || undefined,
        targetBuy: targetBuy ? Number(targetBuy) : undefined,
        targetSell: targetSell ? Number(targetSell) : undefined,
      },
      {
        onSuccess: () => {
          setQuery("");
          setMemo("");
          setTargetBuy("");
          setTargetSell("");
          setSelected(null);
          setOpen(false);
        },
      },
    );
  }, [selected, memo, targetBuy, targetSell, addMutation]);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setQuery("");
      setMemo("");
      setTargetBuy("");
      setTargetSell("");
      setSelected(null);
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" />}>
        <ListPlus className="size-3.5" />
        종목 추가
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>종목 추가</DialogTitle>
          <DialogDescription>
            워치리스트에 관심 종목을 추가하세요
          </DialogDescription>
        </DialogHeader>

        {!selected ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="종목 코드 또는 이름으로 검색"
                className="pl-9"
                autoFocus
              />
            </div>
            {query.trim().length > 0 && (
              <div className="max-h-[240px] space-y-1 overflow-y-auto">
                {isSearching ? (
                  <div className="space-y-2 p-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (results ?? []).length === 0 ? (
                  <p className="p-4 text-center text-sm text-muted-foreground">
                    검색 결과가 없습니다
                  </p>
                ) : (
                  (results ?? []).map((r) => (
                    <button
                      key={r.code}
                      onClick={() => setSelected(r)}
                      className="flex w-full items-center justify-between rounded-lg border border-border p-2.5 text-left transition-colors hover:border-primary/50 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {r.code}
                        </span>
                        <span className="text-sm font-medium">{r.name}</span>
                      </div>
                      <Badge
                        variant="secondary"
                        className={
                          r.exchange === "KOSDAQ"
                            ? "bg-purple-500/15 text-purple-500"
                            : "bg-blue-500/15 text-blue-500"
                        }
                      >
                        {r.exchange}
                      </Badge>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-muted-foreground">
                  {selected.code}
                </span>
                <span className="font-medium">{selected.name}</span>
              </div>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setSelected(null)}
              >
                변경
              </Button>
            </div>
            <Input
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="메모 (선택)"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                value={targetBuy}
                onChange={(e) => setTargetBuy(e.target.value)}
                placeholder="목표 매수가"
              />
              <Input
                type="number"
                value={targetSell}
                onChange={(e) => setTargetSell(e.target.value)}
                placeholder="목표 매도가"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            취소
          </DialogClose>
          <Button
            onClick={handleAdd}
            disabled={!selected || addMutation.isPending}
          >
            {addMutation.isPending ? "추가 중..." : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Watchlist Sidebar ──────────────────────────────────────

function WatchlistSidebar({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { data: watchlists, isLoading } = useWatchlists();
  const deleteMutation = useDeleteWatchlist();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          내 워치리스트
        </h3>
        <CreateWatchlistDialog />
      </div>
      {(!watchlists || watchlists.length === 0) ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <Star className="mx-auto mb-2 size-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            워치리스트가 없습니다
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            새 워치리스트를 만들어 관심 종목을 추가하세요
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {watchlists.map((wl) => (
            <div
              key={wl.id}
              className={`group flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                selectedId === wl.id
                  ? "border-primary/50 bg-primary/5"
                  : "border-border hover:border-primary/30 hover:bg-muted/50"
              }`}
              onClick={() => onSelect(wl.id)}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Star
                  className={`size-4 shrink-0 ${
                    selectedId === wl.id
                      ? "fill-primary text-primary"
                      : "text-muted-foreground"
                  }`}
                />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{wl.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {wl.itemCount}개 종목
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMutation.mutate(wl.id);
                  }}
                >
                  <Trash2 className="size-3" />
                </Button>
                <ChevronRight
                  className={`size-4 text-muted-foreground transition-transform ${
                    selectedId === wl.id ? "rotate-90" : ""
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Watchlist Detail ───────────────────────────────────────

function WatchlistDetail({
  watchlistId,
}: {
  watchlistId: string;
}) {
  const { data: detail, isLoading } = useWatchlistItems(watchlistId);
  const removeMutation = useRemoveWatchlistItem(watchlistId);
  const [chartStock, setChartStock] = useState<{
    code: string;
    name: string;
  } | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        워치리스트를 불러올 수 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{detail.name}</h2>
          <p className="text-sm text-muted-foreground">
            {detail.items.length}개 종목
          </p>
        </div>
        <AddStockDialog watchlistId={watchlistId} />
      </div>

      {detail.items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Search className="mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              아직 추가된 종목이 없습니다
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              &quot;종목 추가&quot; 버튼으로 관심 종목을 추가하세요
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {detail.items.map((item) => (
            <Card key={item.stockCode}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.stockName}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {item.stockCode}
                      </span>
                    </div>
                    <StockPriceCell code={item.stockCode} />
                    {(item.memo || item.targetBuy || item.targetSell) && (
                      <>
                        <Separator />
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {item.memo && (
                            <Badge variant="secondary" className="font-normal">
                              {item.memo}
                            </Badge>
                          )}
                          {item.targetBuy && (
                            <Badge
                              variant="secondary"
                              className="bg-blue-500/10 text-blue-500 font-normal"
                            >
                              매수 목표 {formatNumber(item.targetBuy)}
                            </Badge>
                          )}
                          {item.targetSell && (
                            <Badge
                              variant="secondary"
                              className="bg-red-500/10 text-red-500 font-normal"
                            >
                              매도 목표 {formatNumber(item.targetSell)}
                            </Badge>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() =>
                        setChartStock(
                          chartStock?.code === item.stockCode
                            ? null
                            : { code: item.stockCode, name: item.stockName },
                        )
                      }
                    >
                      <Eye
                        className={`size-3.5 ${
                          chartStock?.code === item.stockCode
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeMutation.mutate(item.stockCode)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {chartStock && (
        <PriceChart stockCode={chartStock.code} stockName={chartStock.name} />
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────

export default function WatchlistPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        icon={Star}
        title="워치리스트"
        description="관심 종목을 관리하고 실시간 시세를 확인하세요"
      />

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Sidebar */}
        <div>
          <WatchlistSidebar
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>

        {/* Main */}
        <div>
          {selectedId ? (
            <WatchlistDetail watchlistId={selectedId} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center py-16">
                <Star className="mb-3 size-12 text-muted-foreground/30" />
                <CardTitle className="text-base">
                  워치리스트를 선택하세요
                </CardTitle>
                <CardDescription className="mt-1">
                  왼쪽에서 워치리스트를 선택하거나 새로 만드세요
                </CardDescription>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
