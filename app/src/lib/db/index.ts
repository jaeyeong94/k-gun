import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let _initialized = false;

function ensureDb() {
  if (_db && _initialized) return _db;

  const dbDir = path.join(process.cwd(), "..", "data");
  const dbPath = path.join(dbDir, "k-gun.db");

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");

  // 존재하지 않는 테이블만 생성
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS watchlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS watchlist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      watchlist_id INTEGER REFERENCES watchlists(id) ON DELETE CASCADE,
      stock_code TEXT NOT NULL, stock_name TEXT NOT NULL,
      memo TEXT, target_buy REAL, target_sell REAL, tags TEXT,
      added_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS journal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL, stock_code TEXT, stock_name TEXT,
      action TEXT, strategy TEXT, signal_strength REAL,
      price REAL, quantity INTEGER, profit_loss REAL, profit_rate REAL,
      reason TEXT, tags TEXT, memo TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS journal_daily_summary (
      date TEXT PRIMARY KEY, total_trades INTEGER, realized_pnl REAL,
      win_count INTEGER, loss_count INTEGER, market_note TEXT, reflection TEXT
    );
    CREATE TABLE IF NOT EXISTS trade_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT, date TEXT NOT NULL, stock_code TEXT NOT NULL,
      stock_name TEXT, action TEXT NOT NULL, price REAL NOT NULL,
      quantity INTEGER NOT NULL, amount REAL NOT NULL,
      fee REAL DEFAULT 0, tax REAL DEFAULT 0,
      strategy_id TEXT, signal_strength REAL, mode TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS strategy_performance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      strategy_id TEXT NOT NULL, date TEXT NOT NULL,
      daily_return REAL, cumulative_return REAL,
      trade_count INTEGER DEFAULT 0, mode TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS backtest_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cache_key TEXT NOT NULL UNIQUE, strategy_id TEXT NOT NULL,
      symbols TEXT NOT NULL, start_date TEXT, end_date TEXT,
      params TEXT, result TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL, cron TEXT NOT NULL, action TEXT NOT NULL,
      params TEXT, notify_channels TEXT, active INTEGER DEFAULT 1,
      last_run TEXT, next_run TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS schedule_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_id INTEGER REFERENCES schedules(id),
      executed_at TEXT DEFAULT (datetime('now')),
      status TEXT NOT NULL, result TEXT, error TEXT
    );
    CREATE TABLE IF NOT EXISTS market_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL, type TEXT NOT NULL, stock_code TEXT,
      name TEXT NOT NULL, description TEXT,
      importance TEXT DEFAULT 'medium'
    );
    CREATE TABLE IF NOT EXISTS news_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stock_code TEXT, title TEXT NOT NULL, summary TEXT,
      source TEXT, url TEXT, sentiment TEXT,
      published_at TEXT, cached_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_journal_date ON journal_entries(date);
    CREATE INDEX IF NOT EXISTS idx_trade_history_date ON trade_history(date);
    CREATE INDEX IF NOT EXISTS idx_trade_history_stock ON trade_history(stock_code);
    CREATE INDEX IF NOT EXISTS idx_strategy_perf ON strategy_performance(strategy_id, date);
    CREATE INDEX IF NOT EXISTS idx_backtest_cache_key ON backtest_cache(cache_key);
    CREATE INDEX IF NOT EXISTS idx_market_events_date ON market_events(date);
    CREATE INDEX IF NOT EXISTS idx_news_stock ON news_cache(stock_code);
  `);

  _db = drizzle(sqlite, { schema });
  _initialized = true;
  return _db;
}

/** Lazy-initialized DB. First call creates connection + tables. */
export function getDb() {
  return ensureDb();
}

// Backward-compatible: existing code uses `import { db } from "@/lib/db"`
// Uses getter so DB is created on first property access, not on import
export const db = {
  get select() { return getDb().select.bind(getDb()); },
  get insert() { return getDb().insert.bind(getDb()); },
  get update() { return getDb().update.bind(getDb()); },
  get delete() { return getDb().delete.bind(getDb()); },
  get query() { return getDb().query; },
};
