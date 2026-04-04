export interface PriceInfo {
  price: number;
  change: number;
  change_rate: number;
  high: number;
  low: number;
  volume: number;
  w52_high: number;
  w52_low: number;
}

export interface OrderbookEntry {
  price: number;
  quantity: number;
}

export interface OrderbookRaw {
  stock_code: string;
  ask_prices: number[];
  ask_volumes: number[];
  bid_prices: number[];
  bid_volumes: number[];
}

export interface Orderbook {
  stock_code: string;
  asks: OrderbookEntry[];
  bids: OrderbookEntry[];
}
