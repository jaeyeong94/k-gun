"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api/client";

export interface JournalEntry {
  id: number;
  date: string;
  stockCode: string;
  stockName: string;
  action: "BUY" | "SELL";
  strategy: string | null;
  price: number;
  quantity: number;
  profitLoss: number | null;
  profitRate: number | null;
  reason: string | null;
  tags: string; // JSON string
  memo: string | null;
  createdAt: string;
}

export interface JournalSummary {
  totalTrades: number;
  totalPnl: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  tagStats: Record<string, number>;
}

interface ApiResponse<T> {
  status: "success" | "error";
  data: T;
  message?: string;
}

export interface CreateJournalInput {
  date: string;
  stockCode: string;
  stockName: string;
  action: "BUY" | "SELL";
  strategy?: string;
  price: number;
  quantity: number;
  profitLoss?: number;
  profitRate?: number;
  reason?: string;
  tags?: string[];
  memo?: string;
}

export function useJournalEntries(date?: string, tag?: string) {
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  if (tag) params.set("tag", tag);
  const qs = params.toString();

  return useQuery({
    queryKey: ["journal", "entries", date, tag],
    queryFn: () =>
      apiGet<ApiResponse<JournalEntry[]>>(
        `/api/journal${qs ? `?${qs}` : ""}`,
        false,
      ),
    staleTime: 10_000,
  });
}

export function useJournalSummary(startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const qs = params.toString();

  return useQuery({
    queryKey: ["journal", "summary", startDate, endDate],
    queryFn: () =>
      apiGet<ApiResponse<JournalSummary>>(
        `/api/journal/summary${qs ? `?${qs}` : ""}`,
        false,
      ),
    staleTime: 10_000,
  });
}

export function useCreateJournal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateJournalInput) =>
      apiPost<ApiResponse<JournalEntry>>("/api/journal", input, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal"] });
    },
  });
}
