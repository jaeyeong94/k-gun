"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";
import type { ApiResponse, Balance, Holding, MarketIndex } from "@/types/account";
import { useAuthStore } from "@/stores/auth";

export function useBalance() {
  const authenticated = useAuthStore((s) => s.authenticated);

  return useQuery({
    queryKey: ["balance"],
    queryFn: () => apiGet<ApiResponse<Balance>>("/api/strategy/account/balance"),
    enabled: authenticated,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useHoldings() {
  const authenticated = useAuthStore((s) => s.authenticated);

  return useQuery({
    queryKey: ["holdings"],
    queryFn: () =>
      apiGet<ApiResponse<Holding[]>>("/api/strategy/account/holdings"),
    enabled: authenticated,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useMarketIndex() {
  const authenticated = useAuthStore((s) => s.authenticated);

  return useQuery({
    queryKey: ["market-index"],
    queryFn: () =>
      apiGet<{ kospi: MarketIndex; kosdaq: MarketIndex }>(
        "/api/market-index",
        false,
      ),
    enabled: authenticated,
    staleTime: 10_000,
    refetchInterval: 10_000,
  });
}
