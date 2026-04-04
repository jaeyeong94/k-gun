"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api/client";
import type { BacktestStrategy as Strategy, BacktestRequest, BacktestResult } from "@/types/backtest";

export function useStrategies() {
  return useQuery({
    queryKey: ["backtest-strategies"],
    queryFn: () => apiGet<Strategy[]>("/api/backtest/strategies", false),
    staleTime: 5 * 60_000,
  });
}

export function useStrategyCategories() {
  return useQuery({
    queryKey: ["backtest-strategy-categories"],
    queryFn: () => apiGet<string[]>("/api/backtest/strategies/categories", false),
    staleTime: 5 * 60_000,
  });
}

export function useRunBacktest() {
  return useMutation({
    mutationFn: (request: BacktestRequest) =>
      apiPost<BacktestResult>("/api/backtest/backtest/run", request, false),
  });
}
