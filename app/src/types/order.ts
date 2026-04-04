export type OrderAction = "BUY" | "SELL";
export type OrderType = "market" | "limit";

export interface OrderRequest {
  stock_code: string;
  stock_name: string;
  action: OrderAction;
  order_type: OrderType;
  price?: number;
  quantity: number;
  signal_reason?: string;
}

export interface OrderResult {
  status: "success" | "error";
  order_id?: string;
  message: string;
}

export interface PendingOrder {
  order_id: string;
  stock_code: string;
  stock_name: string;
  action: OrderAction;
  order_type: OrderType;
  price: number;
  quantity: number;
  filled_quantity: number;
  status: string;
  time: string;
}
