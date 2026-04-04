"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api/client";
import type { NewsItem } from "@/types/calendar";

interface NewsResponse {
  news: NewsItem[];
}

interface AddNewsParams {
  stockCode?: string;
  title: string;
  summary?: string;
  source?: string;
  sentiment?: "positive" | "negative" | "neutral";
}

export function useNewsList(stockCode?: string) {
  const params = stockCode ? `?stockCode=${stockCode}` : "";

  return useQuery({
    queryKey: ["news", stockCode ?? "all"],
    queryFn: () => apiGet<NewsResponse>(`/api/news${params}`, false),
    staleTime: 60_000,
  });
}

export function useAddNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: AddNewsParams) =>
      apiPost<{ news: NewsItem }>("/api/news", params, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news"] });
    },
  });
}
