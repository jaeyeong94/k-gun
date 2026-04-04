export type SignalAction = "BUY" | "SELL" | "HOLD" | "ERROR";

export interface SignalResult {
  code: string;
  name: string;
  action: SignalAction;
  strength: number;
  reason: string;
  target_price?: number;
}

export interface LogEntry {
  type: "info" | "success" | "error" | "warning";
  message: string;
  timestamp?: string;
}

export interface ExecuteRequest {
  strategy_id: string;
  stocks: string[];
  params: Record<string, number>;
}

export interface ExecuteResponse {
  status: "success" | "error";
  results: SignalResult[];
  logs: LogEntry[];
  message?: string;
}
