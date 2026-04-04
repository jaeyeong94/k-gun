import { create } from "zustand";
import type { BacktestRequest, BacktestResult, BacktestStrategy as Strategy } from "@/types/backtest";

interface BacktestState {
  // Form params
  strategyId: string;
  symbols: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  commissionRate: number;
  taxRate: number;
  slippage: number;
  paramOverrides: Record<string, number | boolean>;

  // Results
  result: BacktestResult | null;
  isRunning: boolean;
  error: string | null;

  // Actions
  setStrategyId: (id: string) => void;
  setSymbols: (symbols: string) => void;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setInitialCapital: (capital: number) => void;
  setCommissionRate: (rate: number) => void;
  setTaxRate: (rate: number) => void;
  setSlippage: (slippage: number) => void;
  setParamOverride: (key: string, value: number | boolean) => void;
  resetParamOverrides: () => void;
  setResult: (result: BacktestResult | null) => void;
  setIsRunning: (running: boolean) => void;
  setError: (error: string | null) => void;
  buildRequest: () => BacktestRequest;
  applyStrategyDefaults: (strategy: Strategy) => void;
}

function getDefaultDates() {
  const end = new Date();
  const start = new Date();
  start.setFullYear(start.getFullYear() - 1);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

const { startDate, endDate } = getDefaultDates();

export const useBacktestStore = create<BacktestState>((set, get) => ({
  strategyId: "",
  symbols: "005930",
  startDate,
  endDate,
  initialCapital: 10_000_000,
  commissionRate: 0.00015,
  taxRate: 0.0023,
  slippage: 0.001,
  paramOverrides: {},

  result: null,
  isRunning: false,
  error: null,

  setStrategyId: (id) => set({ strategyId: id }),
  setSymbols: (symbols) => set({ symbols }),
  setStartDate: (date) => set({ startDate: date }),
  setEndDate: (date) => set({ endDate: date }),
  setInitialCapital: (capital) => set({ initialCapital: capital }),
  setCommissionRate: (rate) => set({ commissionRate: rate }),
  setTaxRate: (rate) => set({ taxRate: rate }),
  setSlippage: (slippage) => set({ slippage }),
  setParamOverride: (key, value) =>
    set((s) => ({ paramOverrides: { ...s.paramOverrides, [key]: value } })),
  resetParamOverrides: () => set({ paramOverrides: {} }),
  setResult: (result) => set({ result }),
  setIsRunning: (running) => set({ isRunning: running }),
  setError: (error) => set({ error }),

  buildRequest: () => {
    const s = get();
    return {
      strategy_id: s.strategyId,
      symbols: s.symbols
        .split(",")
        .map((sym) => sym.trim())
        .filter(Boolean),
      start_date: s.startDate,
      end_date: s.endDate,
      initial_capital: s.initialCapital,
      commission_rate: s.commissionRate,
      tax_rate: s.taxRate,
      slippage: s.slippage,
      param_overrides: s.paramOverrides,
    };
  },

  applyStrategyDefaults: (strategy) => {
    const overrides: Record<string, number | boolean> = {};
    for (const [name, p] of Object.entries(strategy.params ?? {})) {
      overrides[name] = p.default;
    }
    set({ strategyId: strategy.id, paramOverrides: overrides });
  },
}));
