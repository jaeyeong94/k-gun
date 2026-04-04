"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api/client";
import type { MarketEvent, EventType } from "@/types/calendar";

interface CalendarResponse {
  events: MarketEvent[];
}

interface AddEventParams {
  date: string;
  type: EventType;
  stockCode?: string;
  name: string;
  description?: string;
  importance?: "low" | "medium" | "high";
}

export function useCalendarEvents(month: string) {
  return useQuery({
    queryKey: ["calendar-events", month],
    queryFn: () =>
      apiGet<CalendarResponse>(`/api/calendar?month=${month}`, false),
    staleTime: 60_000,
  });
}

export function useAddCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: AddEventParams) =>
      apiPost<{ event: MarketEvent }>("/api/calendar", params, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    },
  });
}
