"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";
import type { Strategy, Indicator } from "@/types/strategy";
import { EXTENDED_INDICATORS } from "@/lib/extended-indicators";

interface StrategiesResponse {
  strategies: Strategy[];
}

interface IndicatorsResponse {
  indicators: Indicator[];
}

// 백엔드 지표의 카테고리 한글 매핑
const BACKEND_CATEGORY_MAP: Record<string, string> = {
  ma: "이동평균",
  ema: "이동평균",
  rsi: "오실레이터",
  macd: "오실레이터",
  macd_signal: "오실레이터",
  bb_upper: "변동성",
  bb_lower: "변동성",
  atr: "변동성",
  adx: "추세",
  stoch_k: "오실레이터",
};

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
    queryFn: async () => {
      const res = await apiGet<IndicatorsResponse>(
        "/api/strategy/strategies/indicators",
        false,
      );

      // 백엔드 지표에 카테고리 추가
      const backendIndicators: Indicator[] = (res.indicators ?? []).map((ind) => ({
        ...ind,
        category: BACKEND_CATEGORY_MAP[ind.name] ?? ind.category ?? "기타",
      }));

      // 확장 지표 중 백엔드에 없는 것만 추가
      const backendNames = new Set(backendIndicators.map((i) => i.name));
      const extended: Indicator[] = EXTENDED_INDICATORS
        .filter((ext) => !backendNames.has(ext.name))
        .map((ext) => ({
          name: ext.name,
          label: ext.label,
          category: ext.category,
          params: ext.params,
          example: ext.example,
          description: ext.description,
        }));

      return {
        indicators: [...backendIndicators, ...extended],
      };
    },
    staleTime: 5 * 60_000,
  });
}
