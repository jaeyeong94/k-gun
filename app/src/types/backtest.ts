// --- Strategy definitions ---

export interface BacktestParamDefinition {
  name: string;
  label: string;
  type: "int" | "float" | "bool";
  default: number | boolean;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}

export interface BacktestStrategy {
  id: string;
  name: string;
  description: string;
  category: string;
  params: BacktestParamDefinition[];
}

// --- Backtest request / response ---

export interface BacktestRequest {
  strategy_id: string;
  symbols: string[];
  start_date: string;
  end_date: string;
  initial_capital: number;
  commission_rate: number;
  tax_rate: number;
  slippage: number;
  param_overrides: Record<string, number | boolean>;
}

export interface PerformanceMetrics {
  // Basic
  total_return: number;
  annualized_return: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  // Risk
  sharpe_ratio: number;
  sortino_ratio: number;
  max_drawdown: number;
  max_drawdown_duration?: number;
  volatility: number;
  // Trading
  avg_profit: number;
  avg_loss: number;
  profit_factor: number;
  avg_holding_period?: number;
  // Extra fields (dynamic)
  [key: string]: number | string | undefined;
}

export interface TradeInfo {
  symbol: string;
  direction: "BUY" | "SELL";
  quantity: number;
  price: number;
  timestamp: string;
  profit?: number;
  profit_rate?: number;
  commission?: number;
}

export interface BacktestResult {
  metrics: PerformanceMetrics;
  equity_curve: Record<string, number>;
  trades: TradeInfo[];
  benchmark_curve?: Record<string, number>;
}
