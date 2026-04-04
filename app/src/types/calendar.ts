export type EventType = "earnings" | "dividend" | "economic" | "ipo" | "holiday";

export interface MarketEvent {
  id: string;
  date: string; // YYYY-MM-DD
  type: EventType;
  stockCode?: string;
  name: string;
  description?: string;
  importance: "low" | "medium" | "high";
  createdAt: string;
}

export interface NewsItem {
  id: string;
  stockCode?: string;
  title: string;
  summary?: string;
  source?: string;
  sentiment?: "positive" | "negative" | "neutral";
  createdAt: string;
}
