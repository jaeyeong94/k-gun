import { create } from "zustand";
import type { Signal } from "@/types/signal";

export interface ExecutionLog {
  id: string;
  timestamp: string;
  message: string;
  type: "info" | "success" | "error";
}

interface TradingState {
  selectedStrategyId: string | null;
  stockCodes: string;
  signals: Signal[];
  logs: ExecutionLog[];
  isGenerating: boolean;

  setSelectedStrategy: (id: string | null) => void;
  setStockCodes: (codes: string) => void;
  setSignals: (signals: Signal[]) => void;
  setIsGenerating: (loading: boolean) => void;
  addLog: (message: string, type: ExecutionLog["type"]) => void;
  clearSignals: () => void;
  clearLogs: () => void;
}

export const useTradingStore = create<TradingState>((set) => ({
  selectedStrategyId: null,
  stockCodes: "",
  signals: [],
  logs: [],
  isGenerating: false,

  setSelectedStrategy: (id) => set({ selectedStrategyId: id }),
  setStockCodes: (codes) => set({ stockCodes: codes }),
  setSignals: (signals) => set({ signals }),
  setIsGenerating: (loading) => set({ isGenerating: loading }),
  addLog: (message, type) =>
    set((state) => ({
      logs: [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          timestamp: new Date().toLocaleTimeString("ko-KR"),
          message,
          type,
        },
        ...state.logs,
      ].slice(0, 100),
    })),
  clearSignals: () => set({ signals: [] }),
  clearLogs: () => set({ logs: [] }),
}));
