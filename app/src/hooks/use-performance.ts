"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api/client";

export interface PerformanceRecord {
  id: number;
  strategyId: string;
  date: string;
  dailyReturn: number;
  cumulativeReturn: number;
  tradeCount: number;
  mode: "live" | "backtest";
  createdAt: string;
}

interface PerformanceQuery {
  strategyId?: string;
  mode?: "live" | "backtest";
  startDate?: string;
  endDate?: string;
}

function buildQueryString(params: PerformanceQuery): string {
  const sp = new URLSearchParams();
  if (params.strategyId) sp.set("strategyId", params.strategyId);
  if (params.mode) sp.set("mode", params.mode);
  if (params.startDate) sp.set("startDate", params.startDate);
  if (params.endDate) sp.set("endDate", params.endDate);
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export function usePerformance(params: PerformanceQuery) {
  return useQuery({
    queryKey: ["performance", params],
    queryFn: () =>
      apiGet<PerformanceRecord[]>(
        `/api/performance${buildQueryString(params)}`,
        false,
      ),
    enabled: !!params.strategyId,
    staleTime: 30_000,
  });
}

export function usePerformanceAll(strategyId: string | undefined) {
  const liveQuery = usePerformance({
    strategyId,
    mode: "live",
  });
  const backtestQuery = usePerformance({
    strategyId,
    mode: "backtest",
  });

  return { liveQuery, backtestQuery };
}

interface AddPerformanceBody {
  strategyId: string;
  date: string;
  dailyReturn: number;
  cumulativeReturn?: number;
  tradeCount?: number;
  mode: "live" | "backtest";
}

export function useAddPerformance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: AddPerformanceBody) =>
      apiPost<PerformanceRecord>("/api/performance", body, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance"] });
    },
  });
}
