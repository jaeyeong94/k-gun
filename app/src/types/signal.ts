export type SignalAction = "BUY" | "SELL" | "HOLD";

export interface Signal {
  stock_code: string;
  stock_name: string;
  action: SignalAction;
  strength: number; // 0~1
  reason: string;
  price?: number;
}

export interface SignalExecuteRequest {
  strategy_id: string;
  stocks: string[];
  params?: Record<string, unknown>;
  builder_state?: import("@/types/strategy").BuilderState;
}

export interface SignalExecuteResponse {
  signals: Signal[];
  strategy_id: string;
  executed_at: string;
}
