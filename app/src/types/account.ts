export interface Balance {
  deposit: number;
  total_eval: number;
  purchase_amount: number;
  eval_amount: number;
  profit_loss: number;
  deposit_formatted: string;
  total_eval_formatted: string;
  profit_loss_formatted: string;
}

export interface Holding {
  stock_code: string;
  stock_name: string;
  quantity: number;
  avg_price: number;
  current_price: number;
  eval_amount: number;
  profit_loss: number;
  profit_rate: number;
}

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  change_rate: number;
}

export interface ApiResponse<T> {
  status: "success" | "error";
  data: T;
  message?: string;
}
