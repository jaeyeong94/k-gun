"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api/client";
import type { BacktestStrategy as Strategy, BacktestRequest, BacktestResult, CustomBacktestRequest } from "@/types/backtest";

export function useStrategies() {
  return useQuery({
    queryKey: ["backtest-strategies"],
    queryFn: async () => {
      const res = await apiGet<{ success: boolean; data: Strategy[]; total: number }>(
        "/api/backtest/strategies",
        false,
      );
      return res.data ?? [];
    },
    staleTime: 5 * 60_000,
  });
}

export function useStrategyCategories() {
  return useQuery({
    queryKey: ["backtest-strategy-categories"],
    queryFn: async () => {
      const res = await apiGet<{ success: boolean; data: string[] }>(
        "/api/backtest/strategies/categories",
        false,
      );
      return res.data ?? [];
    },
    staleTime: 5 * 60_000,
  });
}

export function useRunBacktest() {
  return useMutation({
    mutationFn: async (request: BacktestRequest) => {
      const res = await apiPost<{ success: boolean; data: BacktestResult }>(
        "/api/backtest/backtest/run",
        request,
        false,
      );
      return res.data;
    },
  });
}

export function useRunCustomBacktest() {
  return useMutation({
    mutationFn: async (request: CustomBacktestRequest) => {
      const res = await apiPost<{ success: boolean; data: BacktestResult }>(
        "/api/backtest/backtest/run-custom",
        request,
        false,
      );
      return res.data;
    },
  });
}
