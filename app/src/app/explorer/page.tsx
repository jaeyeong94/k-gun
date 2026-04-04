"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  useSymbolSearch,
  useStockPrice,
  useOrderbook,
  type SymbolSearchResult,
} from "@/hooks/use-explorer";
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
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  BookOpen,
  Activity,
  ArrowRight,
} from "lucide-react";

const POPULAR_STOCKS = [
  { code: "005930", name: "삼성전자" },
  { code: "000660", name: "SK하이닉스" },
  { code: "035420", name: "네이버" },
  { code: "035720", name: "카카오" },
  { code: "005380", name: "현대차" },
] as const;

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
  if (change > 0) return <TrendingUp className="size-4 text-red-500" />;
  if (change < 0) return <TrendingDown className="size-4 text-blue-500" />;
  return <Minus className="size-4 text-muted-foreground" />;
}

// ─── Search Results ──────────────────────────────────────────
function SearchResults({
  results,
  isLoading,
  onSelect,
}: {
  results: SymbolSearchResult[];
  isLoading: boolean;
  onSelect: (result: SymbolSearchResult) => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        검색 결과가 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {results.map((result) => (
        <button
          key={result.code}
          onClick={() => onSelect(result)}
          className="flex w-full items-center justify-between rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/50 hover:bg-muted/50"
        >
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-muted-foreground">
              {result.code}
            </span>
            <span className="font-medium">{result.name}</span>
          </div>
          <Badge
            variant="secondary"
            className={
              result.exchange === "KOSDAQ"
                ? "bg-purple-500/15 text-purple-500"
                : "bg-blue-500/15 text-blue-500"
            }
          >
            {result.exchange}
          </Badge>
        </button>
      ))}
    </div>
  );
}

// ─── Price Card ──────────────────────────────────────────────
function PriceCard({ code, name }: { code: string; name: string }) {
  const { data: price, isLoading } = useStockPrice(code);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="size-4" />
            현재가
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-24" />
        </CardContent>
      </Card>
    );
  }

  if (!price) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="size-4" />
            현재가
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            가격 정보를 불러올 수 없습니다
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="size-4" />
          {name}
          <span className="text-sm font-normal text-muted-foreground">
            {code}
          </span>
        </CardTitle>
        <CardDescription>실시간 시세 (5초 갱신)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-4">
          <span className={`text-3xl font-bold font-mono ${priceColor(price.change)}`}>
            {formatNumber(price.price)}
            <span className="text-base font-normal">원</span>
          </span>
          <div className={`flex items-center gap-1.5 pb-1 ${priceColor(price.change)}`}>
            <PriceChangeIcon change={price.change} />
            <span className="font-mono text-sm">
              {price.change > 0 ? "+" : ""}
              {formatNumber(price.change)}
            </span>
            <span className="font-mono text-sm">
              ({formatRate(price.change_rate)})
            </span>
          </div>
        </div>
        <Separator className="my-3" />
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span>거래량</span>
          <span className="font-mono">{formatNumber(price.volume)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Orderbook Table ─────────────────────────────────────────
function OrderbookCard({ code }: { code: string }) {
  const { data: orderbook, isLoading } = useOrderbook(code);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="size-4" />
            호가
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!orderbook) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="size-4" />
            호가
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            호가 정보를 불러올 수 없습니다
          </p>
        </CardContent>
      </Card>
    );
  }

  const asks = orderbook.asks.slice(0, 5).reverse();
  const bids = orderbook.bids.slice(0, 5);

  const maxQty = Math.max(
    ...asks.map((e) => e.quantity),
    ...bids.map((e) => e.quantity),
    1,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="size-4" />
          호가
        </CardTitle>
        <CardDescription>매도 5호가 / 매수 5호가</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-0.5">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 px-2 pb-1 text-xs text-muted-foreground">
            <span>잔량</span>
            <span className="text-center">가격</span>
            <span className="text-right">잔량</span>
          </div>

          {/* Asks (매도) - blue */}
          {asks.map((entry, i) => (
            <div
              key={`ask-${i}`}
              className="group relative grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded px-2 py-1"
            >
              <div className="relative flex justify-start">
                <div
                  className="absolute right-0 top-0 h-full rounded bg-blue-500/10"
                  style={{ width: `${(entry.quantity / maxQty) * 100}%` }}
                />
                <span className="relative z-10 font-mono text-xs text-blue-500">
                  {formatNumber(entry.quantity)}
                </span>
              </div>
              <span className="text-center font-mono text-sm font-medium text-blue-500">
                {formatNumber(entry.price)}
              </span>
              <span />
            </div>
          ))}

          {/* Divider */}
          <Separator className="my-1" />

          {/* Bids (매수) - red */}
          {bids.map((entry, i) => (
            <div
              key={`bid-${i}`}
              className="group relative grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded px-2 py-1"
            >
              <span />
              <span className="text-center font-mono text-sm font-medium text-red-500">
                {formatNumber(entry.price)}
              </span>
              <div className="relative flex justify-end">
                <div
                  className="absolute left-0 top-0 h-full rounded bg-red-500/10"
                  style={{ width: `${(entry.quantity / maxQty) * 100}%` }}
                />
                <span className="relative z-10 font-mono text-xs text-red-500">
                  {formatNumber(entry.quantity)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Stock Detail Section ────────────────────────────────────
function StockDetail({ code, name }: { code: string; name: string }) {
  return (
    <div className="space-y-4">
      <Separator />
      <div className="grid gap-4 md:grid-cols-2">
        <PriceCard code={code} name={name} />
        <OrderbookCard code={code} />
      </div>
      <div className="flex justify-end">
        <Button nativeButton={false} render={<Link href={`/trading?code=${code}`} />}>
          <Activity className="size-4" />
          신호 확인
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Main Explorer Page ──────────────────────────────────────
export default function ExplorerPage() {
  const [query, setQuery] = useState("");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string>("");

  const { data: results, isLoading, isFetching } = useSymbolSearch(query);

  const handleSelect = useCallback((result: SymbolSearchResult) => {
    setSelectedCode(result.code);
    setSelectedName(result.name);
  }, []);

  const handlePopularClick = useCallback((code: string, name: string) => {
    setSelectedCode(code);
    setSelectedName(name);
    setQuery("");
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">종목 탐색</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          종목을 검색하고 실시간 시세와 호가를 확인하세요
        </p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="종목 코드 또는 이름으로 검색 (예: 삼성전자, 005930)"
          className="pl-9"
        />
      </div>

      {/* Popular stocks */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-muted-foreground">
          인기 종목
        </span>
        <div className="flex flex-wrap gap-2">
          {POPULAR_STOCKS.map((stock) => (
            <Button
              key={stock.code}
              variant={selectedCode === stock.code ? "default" : "outline"}
              size="sm"
              onClick={() => handlePopularClick(stock.code, stock.name)}
            >
              {stock.name}
              <span className="text-xs opacity-60">{stock.code}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Search results */}
      {query.trim().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="size-4" />
              검색 결과
              {isFetching && (
                <span className="text-xs font-normal text-muted-foreground">
                  검색 중...
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SearchResults
              results={results ?? []}
              isLoading={isLoading}
              onSelect={handleSelect}
            />
          </CardContent>
        </Card>
      )}

      {/* Stock detail */}
      {selectedCode && <StockDetail code={selectedCode} name={selectedName} />}
    </div>
  );
}
