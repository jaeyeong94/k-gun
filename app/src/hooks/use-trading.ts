"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api/client";
import type { ApiResponse } from "@/types/account";
import type { Strategy } from "@/types/strategy";
import type {
  Signal,
  SignalAction,
  SignalExecuteRequest,
  SignalExecuteResponse,
} from "@/types/signal";
import type {
  OrderExecuteRequest,
  OrderExecuteResponse,
  PendingOrder,
  BuyableResponse,
} from "@/types/order";
import type { PriceInfo } from "@/types/symbol";
import { useAuthStore } from "@/stores/auth";
import { useTradingStore } from "@/stores/trading";
import { useNotificationStore } from "@/stores/notifications";

export function useStrategies() {
  const authenticated = useAuthStore((s) => s.authenticated);

  return useQuery({
    queryKey: ["strategies"],
    queryFn: async () => {
      const res = await apiGet<{ strategies: Strategy[] }>("/api/strategy/strategies");
      return { status: "success" as const, data: res.strategies ?? [] };
    },
    enabled: authenticated,
    staleTime: 60_000,
  });
}

export function useSignalExecution() {
  const addLog = useTradingStore((s) => s.addLog);
  const setSignals = useTradingStore((s) => s.setSignals);
  const setIsGenerating = useTradingStore((s) => s.setIsGenerating);
  const sendNotification = useNotificationStore((s) => s.sendNotification);

  return useMutation({
    mutationFn: (req: SignalExecuteRequest) =>
      apiPost<{ status: string; results: Array<{ code: string; name: string; action: SignalAction; strength: number; reason: string; target_price?: number | null }>; logs: Array<{ type: string; message: string; timestamp: string }> }>(
        "/api/strategy/strategies/execute",
        req,
      ),
    onMutate: () => {
      setIsGenerating(true);
      addLog("신호 생성 시작...", "info");
    },
    onSuccess: (data) => {
      const signals: Signal[] = (data.results ?? []).map((r) => ({
        stock_code: r.code,
        stock_name: r.name,
        action: r.action,
        strength: r.strength,
        reason: r.reason,
        price: r.target_price ?? undefined,
      }));
      setSignals(signals);
      addLog(
        `신호 생성 완료: ${signals.length}개 종목 분석`,
        "success",
      );
      for (const s of signals) {
        addLog(
          `${s.stock_name}(${s.stock_code}): ${s.action} (강도 ${(s.strength * 100).toFixed(0)}%)`,
          s.action === "HOLD" ? "info" : "success",
        );
        if (s.action !== "HOLD") {
          sendNotification(
            `${s.stock_name}: ${s.action} 신호`,
            `${s.stock_name}: ${s.action} 신호 (강도 ${(s.strength * 100).toFixed(0)}%)`,
            { type: "signal" },
          );
        }
      }
    },
    onError: (error) => {
      addLog(`신호 생성 실패: ${error.message}`, "error");
    },
    onSettled: () => {
      setIsGenerating(false);
    },
  });
}

export function useCurrentPrice(stockCode: string | null) {
  return useQuery({
    queryKey: ["price", stockCode],
    queryFn: () =>
      apiGet<ApiResponse<PriceInfo>>(
        `/api/strategy/market/price/${stockCode}`,
      ),
    enabled: !!stockCode,
    staleTime: 5_000,
    refetchInterval: 5_000,
  });
}

export function useBuyableQuantity(stockCode: string | null) {
  const authenticated = useAuthStore((s) => s.authenticated);

  return useQuery({
    queryKey: ["buyable", stockCode],
    queryFn: () =>
      apiGet<ApiResponse<BuyableResponse>>(
        `/api/strategy/account/buyable/${stockCode}`,
      ),
    enabled: authenticated && !!stockCode,
    staleTime: 10_000,
  });
}

export function useOrderExecution() {
  const queryClient = useQueryClient();
  const addLog = useTradingStore((s) => s.addLog);
  const sendOrderNotification = useNotificationStore((s) => s.sendNotification);

  return useMutation({
    mutationFn: (req: OrderExecuteRequest) =>
      apiPost<ApiResponse<OrderExecuteResponse>>(
        "/api/strategy/orders/execute",
        req,
      ),
    onSuccess: (data) => {
      const order = data.data;
      addLog(
        `주문 체결: ${order.stock_name} ${order.action === "BUY" ? "매수" : "매도"} ${order.quantity}주 @ ${order.price.toLocaleString("ko-KR")}원`,
        "success",
      );
      sendOrderNotification(
        `${order.stock_name} ${order.quantity}주 ${order.action === "BUY" ? "매수" : "매도"} 체결`,
        `${order.stock_name} ${order.quantity}주 ${order.action === "BUY" ? "매수" : "매도"} @ ${order.price.toLocaleString("ko-KR")}원`,
        { type: "order" },
      );
      queryClient.invalidateQueries({ queryKey: ["holdings"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      queryClient.invalidateQueries({ queryKey: ["pending-orders"] });
    },
    onError: (error) => {
      addLog(`주문 실패: ${error.message}`, "error");
    },
  });
}

export function usePendingOrders() {
  const authenticated = useAuthStore((s) => s.authenticated);

  return useQuery({
    queryKey: ["pending-orders"],
    queryFn: () =>
      apiGet<ApiResponse<PendingOrder[]>>(
        "/api/strategy/orders/pending",
      ),
    enabled: authenticated,
    staleTime: 10_000,
    refetchInterval: 10_000,
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  const addLog = useTradingStore((s) => s.addLog);

  return useMutation({
    mutationFn: (orderId: string) =>
      apiPost<ApiResponse<{ success: boolean }>>(
        "/api/strategy/orders/cancel",
        { order_id: orderId },
      ),
    onSuccess: () => {
      addLog("주문 취소 완료", "success");
      queryClient.invalidateQueries({ queryKey: ["pending-orders"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
    onError: (error) => {
      addLog(`주문 취소 실패: ${error.message}`, "error");
    },
  });
}
