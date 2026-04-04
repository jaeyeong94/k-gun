"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";
import type { Strategy, Indicator } from "@/types/strategy";

interface StrategiesResponse {
  strategies: Strategy[];
}

interface IndicatorsResponse {
  indicators: Indicator[];
}

export function useStrategies() {
  return useQuery({
    queryKey: ["strategies"],
    queryFn: () =>
      apiGet<StrategiesResponse>("/api/strategy/strategies", false),
    staleTime: 5 * 60_000,
  });
}

export function useIndicators() {
  return useQuery({
    queryKey: ["indicators"],
    queryFn: () =>
      apiGet<IndicatorsResponse>(
        "/api/strategy/strategies/indicators",
        false,
      ),
    staleTime: 5 * 60_000,
  });
}
