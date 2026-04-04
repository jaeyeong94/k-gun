export interface PriceInfo {
  stock_code: string;
  stock_name: string;
  current_price: number;
  change: number;
  change_rate: number;
  volume: number;
}

export interface OrderbookEntry {
  price: number;
  quantity: number;
}

export interface Orderbook {
  stock_code: string;
  asks: OrderbookEntry[];
  bids: OrderbookEntry[];
}
