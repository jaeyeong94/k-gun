"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface WatchlistItem {
  stockCode: string;
  stockName: string;
  memo?: string;
  targetBuy?: number;
  targetSell?: number;
  addedAt: string;
}

export interface WatchlistSummary {
  id: string;
  name: string;
  itemCount: number;
  createdAt: string;
}

export interface WatchlistDetail {
  id: string;
  name: string;
  items: WatchlistItem[];
}

// ─── Queries ────────────────────────────────────────────────

export function useWatchlists() {
  return useQuery({
    queryKey: ["watchlists"],
    queryFn: async (): Promise<WatchlistSummary[]> => {
      const res = await fetch("/api/watchlists");
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "워치리스트 조회 실패");
      return json.data;
    },
    staleTime: 10_000,
  });
}

export function useWatchlistItems(id: string | null) {
  return useQuery({
    queryKey: ["watchlist-items", id],
    queryFn: async (): Promise<WatchlistDetail> => {
      const res = await fetch(`/api/watchlists/${id}/items`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "항목 조회 실패");
      return json.data;
    },
    enabled: !!id,
    staleTime: 10_000,
  });
}

// ─── Mutations ──────────────────────────────────────────────

export function useCreateWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/watchlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "워치리스트 생성 실패");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlists"] });
    },
  });
}

export function useDeleteWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/watchlists?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "워치리스트 삭제 실패");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlists"] });
    },
  });
}

export function useAddWatchlistItem(watchlistId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: {
      stockCode: string;
      stockName: string;
      memo?: string;
      targetBuy?: number;
      targetSell?: number;
    }) => {
      const res = await fetch(`/api/watchlists/${watchlistId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "종목 추가 실패");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["watchlist-items", watchlistId],
      });
      queryClient.invalidateQueries({ queryKey: ["watchlists"] });
    },
  });
}

export function useRemoveWatchlistItem(watchlistId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stockCode: string) => {
      const res = await fetch(
        `/api/watchlists/${watchlistId}/items?stockCode=${stockCode}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "종목 삭제 실패");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["watchlist-items", watchlistId],
      });
      queryClient.invalidateQueries({ queryKey: ["watchlists"] });
    },
  });
}
