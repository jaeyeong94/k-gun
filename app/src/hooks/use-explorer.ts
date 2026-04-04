"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { apiGet } from "@/lib/api/client";
import type { PriceInfo, Orderbook, OrderbookRaw } from "@/types/symbol";

export interface SymbolSearchResult {
  code: string;
  name: string;
  exchange: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

interface SymbolSearchResponse {
  status: string;
  query: string;
  total: number;
  items: SymbolSearchResult[];
}

export function useSymbolSearch(query: string) {
  const debouncedQuery = useDebounce(query.trim(), 300);

  return useQuery({
    queryKey: ["symbol-search", debouncedQuery],
    queryFn: async () => {
      const res = await apiGet<SymbolSearchResponse>(
        `/api/strategy/symbols/search?q=${encodeURIComponent(debouncedQuery)}&limit=20`,
        false,
      );
      return res.items ?? [];
    },
    enabled: debouncedQuery.length > 0,
    staleTime: 30_000,
  });
}

interface ApiResponse<T> {
  status: string;
  data: T;
}

export function useStockPrice(code: string | null) {
  return useQuery({
    queryKey: ["stock-price", code],
    queryFn: async () => {
      const res = await apiGet<ApiResponse<PriceInfo>>(
        `/api/strategy/market/price/${code}`,
        true,
      );
      return res.data;
    },
    enabled: !!code,
    staleTime: 5_000,
    refetchInterval: 5_000,
  });
}

export function useOrderbook(code: string | null) {
  return useQuery({
    queryKey: ["orderbook", code],
    queryFn: async () => {
      const res = await apiGet<ApiResponse<OrderbookRaw>>(
        `/api/strategy/market/orderbook/${code}`,
        true,
      );
      const raw = res.data;
      const asks = (raw.ask_prices ?? []).map((price, i) => ({
        price,
        quantity: raw.ask_volumes?.[i] ?? 0,
      }));
      const bids = (raw.bid_prices ?? []).map((price, i) => ({
        price,
        quantity: raw.bid_volumes?.[i] ?? 0,
      }));
      return { stock_code: raw.stock_code, asks, bids } as Orderbook;
    },
    enabled: !!code,
    staleTime: 5_000,
    refetchInterval: 5_000,
  });
}
