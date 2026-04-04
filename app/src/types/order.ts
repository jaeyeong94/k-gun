export type OrderAction = "BUY" | "SELL";
export type OrderType = "market" | "limit";

export interface OrderExecuteRequest {
  stock_code: string;
  stock_name: string;
  action: OrderAction;
  order_type: OrderType;
  price: number;
  quantity: number;
}

export interface OrderExecuteResponse {
  order_id: string;
  stock_code: string;
  stock_name: string;
  action: OrderAction;
  quantity: number;
  price: number;
  status: string;
  message?: string;
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
  ordered_at: string;
}

export interface BuyableResponse {
  stock_code: string;
  buyable_quantity: number;
  price: number;
}
