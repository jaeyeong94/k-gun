"use client";

import { useWebSocket } from "@/hooks/use-websocket";
import { useOrderbook } from "@/hooks/use-explorer";
import type { Orderbook, OrderbookRaw } from "@/types/symbol";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen } from "lucide-react";
import { useMemo } from "react";

function formatNumber(n: number): string {
  return n.toLocaleString("ko-KR");
}

interface OrderbookDisplayProps {
  asks: { price: number; quantity: number }[];
  bids: { price: number; quantity: number }[];
}

function OrderbookDisplay({ asks, bids }: OrderbookDisplayProps) {
  const displayAsks = asks.slice(0, 5).reverse();
  const displayBids = bids.slice(0, 5);

  const maxQty = Math.max(
    ...displayAsks.map((e) => e.quantity),
    ...displayBids.map((e) => e.quantity),
    1,
  );

  return (
    <div className="space-y-0.5">
      {/* Column headers */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 px-2 pb-1 text-xs text-muted-foreground">
        <span>잔량</span>
        <span className="text-center">가격</span>
        <span className="text-right">잔량</span>
      </div>

      {/* Asks (매도) - blue */}
      {displayAsks.map((entry, i) => (
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
      {displayBids.map((entry, i) => (
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
  );
}

function OrderbookSkeleton() {
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

export function RealtimeOrderbook({ code }: { code: string }) {
  const {
    data: wsData,
    isConnected,
    error: wsError,
    messagesPerSecond,
  } = useWebSocket<OrderbookRaw>(code);

  const { data: restOrderbook, isLoading: restLoading } = useOrderbook(
    // Only poll REST if WebSocket is not connected
    isConnected ? null : code,
  );

  // Transform WebSocket raw data into orderbook format
  const wsOrderbook: Orderbook | null = useMemo(() => {
    if (!wsData) return null;
    const asks = (wsData.ask_prices ?? []).map((price, i) => ({
      price,
      quantity: wsData.ask_volumes?.[i] ?? 0,
    }));
    const bids = (wsData.bid_prices ?? []).map((price, i) => ({
      price,
      quantity: wsData.bid_volumes?.[i] ?? 0,
    }));
    return { stock_code: wsData.stock_code ?? code, asks, bids };
  }, [wsData, code]);

  // Use WebSocket data when available, fallback to REST
  const orderbook = wsOrderbook ?? restOrderbook;
  const isRealtime = isConnected && wsOrderbook !== null;

  // Show skeleton while neither source has data
  if (!orderbook && (restLoading || (!wsError && !isConnected))) {
    return <OrderbookSkeleton />;
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="size-4" />
          호가
          {isRealtime ? (
            <Badge
              variant="secondary"
              className="bg-green-500/15 text-green-600"
            >
              <span className="mr-1 inline-block size-1.5 rounded-full bg-green-500" />
              실시간
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-muted text-muted-foreground">
              REST
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {isRealtime ? (
            <span className="flex items-center gap-2">
              매도 5호가 / 매수 5호가
              <span className="font-mono text-xs text-muted-foreground">
                ({messagesPerSecond} msg/s)
              </span>
            </span>
          ) : wsError ? (
            <span>
              매도 5호가 / 매수 5호가
              <span className="ml-2 text-xs text-amber-500">
                (WebSocket 연결 재시도 중...)
              </span>
            </span>
          ) : (
            "매도 5호가 / 매수 5호가 (5초 갱신)"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <OrderbookDisplay asks={orderbook.asks} bids={orderbook.bids} />
      </CardContent>
    </Card>
  );
}
