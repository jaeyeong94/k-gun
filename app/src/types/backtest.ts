// --- Strategy definitions ---

export interface BacktestParamDefinition {
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
  tags?: string[];
  params: Record<string, BacktestParamDefinition>;
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

export interface CustomBacktestRequest {
  yaml_content: string;
  symbols: string[];
  start_date: string;
  end_date: string;
  initial_capital: number;
  commission_rate: number;
  tax_rate: number;
  slippage: number;
}

export interface PerformanceMetrics {
  basic: {
    total_return: number;
    annual_return: number;
    max_drawdown: number;
    start_equity: number;
    end_equity: number;
  };
  risk: {
    sharpe_ratio: number;
    sortino_ratio: number;
    probabilistic_sharpe: number;
  };
  greeks: {
    alpha: number;
    beta: number;
  };
  volatility: {
    annual_std_dev: number;
    annual_variance: number;
  };
  benchmark: {
    information_ratio: number;
    tracking_error: number;
    treynor_ratio: number;
  };
  trading: {
    total_orders: number;
    win_rate: number;
    loss_rate: number;
    avg_win: number;
    avg_loss: number;
    profit_loss_ratio: number;
    expectancy: number;
  };
  other: {
    total_fees: number;
    portfolio_turnover: number;
    estimated_capacity: number;
    drawdown_recovery: number;
  };
  // 플랫 구조 호환 (레거시)
  [key: string]: unknown;
}

export interface TradeInfo {
  symbol: string;
  direction: string; // "Buy" | "Sell"
  quantity: number;
  price: number;
  time: string;
  profit?: number;
  profit_percent?: number;
}

export interface BacktestResult {
  run_id?: string;
  strategy_name?: string;
  start_date?: string;
  end_date?: string;
  initial_capital?: number;
  final_capital?: number;
  net_profit?: number;
  net_profit_percent?: number;
  metrics: PerformanceMetrics;
  equity_curve: Record<string, number>;
  trades: TradeInfo[];
  trades_count?: number;
  benchmark_curve?: Record<string, number>;
}
