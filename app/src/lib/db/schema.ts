import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// 워치리스트
export const watchlists = sqliteTable("watchlists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

export const watchlistItems = sqliteTable("watchlist_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  watchlistId: integer("watchlist_id").references(() => watchlists.id),
  stockCode: text("stock_code").notNull(),
  stockName: text("stock_name").notNull(),
  memo: text("memo"),
  targetBuy: real("target_buy"),
  targetSell: real("target_sell"),
  tags: text("tags"), // JSON array
  addedAt: text("added_at").default(sql`(datetime('now'))`),
});

// 트레이딩 저널
export const journalEntries = sqliteTable("journal_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  stockCode: text("stock_code"),
  stockName: text("stock_name"),
  action: text("action"),
  strategy: text("strategy"),
  signalStrength: real("signal_strength"),
  price: real("price"),
  quantity: integer("quantity"),
  profitLoss: real("profit_loss"),
  profitRate: real("profit_rate"),
  reason: text("reason"),
  tags: text("tags"), // JSON array
  memo: text("memo"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const journalDailySummary = sqliteTable("journal_daily_summary", {
  date: text("date").primaryKey(),
  totalTrades: integer("total_trades"),
  realizedPnl: real("realized_pnl"),
  winCount: integer("win_count"),
  lossCount: integer("loss_count"),
  marketNote: text("market_note"),
  reflection: text("reflection"),
});

// 매매 이력
export const tradeHistory = sqliteTable("trade_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: text("order_id"),
  date: text("date").notNull(),
  stockCode: text("stock_code").notNull(),
  stockName: text("stock_name"),
  action: text("action").notNull(),
  price: real("price").notNull(),
  quantity: integer("quantity").notNull(),
  amount: real("amount").notNull(),
  fee: real("fee").default(0),
  tax: real("tax").default(0),
  strategyId: text("strategy_id"),
  signalStrength: real("signal_strength"),
  mode: text("mode").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// 전략 성과 추적
export const strategyPerformance = sqliteTable("strategy_performance", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  strategyId: text("strategy_id").notNull(),
  date: text("date").notNull(),
  dailyReturn: real("daily_return"),
  cumulativeReturn: real("cumulative_return"),
  tradeCount: integer("trade_count").default(0),
  mode: text("mode").notNull(),
});

// 백테스트 캐시
export const backtestCache = sqliteTable("backtest_cache", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cacheKey: text("cache_key").notNull().unique(),
  strategyId: text("strategy_id").notNull(),
  symbols: text("symbols").notNull(),
  startDate: text("start_date"),
  endDate: text("end_date"),
  params: text("params"),
  result: text("result").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// 스케줄
export const schedules = sqliteTable("schedules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  cron: text("cron").notNull(),
  action: text("action").notNull(),
  params: text("params"),
  notifyChannels: text("notify_channels"),
  active: integer("active").default(1),
  lastRun: text("last_run"),
  nextRun: text("next_run"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const scheduleLogs = sqliteTable("schedule_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  scheduleId: integer("schedule_id").references(() => schedules.id),
  executedAt: text("executed_at").default(sql`(datetime('now'))`),
  status: text("status").notNull(),
  result: text("result"),
  error: text("error"),
});

// 시장 캘린더
export const marketEvents = sqliteTable("market_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  type: text("type").notNull(),
  stockCode: text("stock_code"),
  name: text("name").notNull(),
  description: text("description"),
  importance: text("importance").default("medium"),
});

// 뉴스 캐시
export const newsCache = sqliteTable("news_cache", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  stockCode: text("stock_code"),
  title: text("title").notNull(),
  summary: text("summary"),
  source: text("source"),
  url: text("url"),
  sentiment: text("sentiment"),
  publishedAt: text("published_at"),
  cachedAt: text("cached_at").default(sql`(datetime('now'))`),
});
