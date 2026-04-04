"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete } from "@/lib/api/client";
import type { BacktestResult } from "@/types/backtest";

export interface BacktestHistoryItem {
  id: number;
  cacheKey: string;
  strategyId: string;
  symbols: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string | null;
  totalReturn: number | null;
  sharpe: number | null;
}

interface SaveResponse {
  status: string;
  data: { id: number; cacheKey: string; alreadyExists: boolean };
}

interface ListResponse {
  status: string;
  data: BacktestHistoryItem[];
}

export function useBacktestHistory() {
  return useQuery({
    queryKey: ["backtest-history"],
    queryFn: async () => {
      const res = await apiGet<ListResponse>(
        "/api/backtest-history",
        false,
      );
      return res.data ?? [];
    },
    staleTime: 30_000,
  });
}

export function useSaveBacktestResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      strategy_id: string;
      symbols: string;
      start_date: string;
      end_date: string;
      params: Record<string, unknown>;
      result: BacktestResult;
    }) => {
      const res = await apiPost<SaveResponse>(
        "/api/backtest-history",
        payload,
        false,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backtest-history"] });
    },
  });
}

export function useDeleteBacktestHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiDelete<{ status: string }>(
        `/api/backtest-history?id=${id}`,
        false,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backtest-history"] });
    },
  });
}
