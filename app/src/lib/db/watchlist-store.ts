import fs from "fs";
import path from "path";

export interface WatchlistItem {
  stockCode: string;
  stockName: string;
  memo?: string;
  targetBuy?: number;
  targetSell?: number;
  addedAt: string;
}

export interface Watchlist {
  id: string;
  name: string;
  items: WatchlistItem[];
  createdAt: string;
}

interface WatchlistData {
  watchlists: Watchlist[];
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "watchlists.json");

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readData(): WatchlistData {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    return { watchlists: [] };
  }
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw) as WatchlistData;
}

function writeData(data: WatchlistData): void {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function generateId(): string {
  return `wl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── CRUD Operations ────────────────────────────────────────

export function getAllWatchlists(): Array<Watchlist & { itemCount: number }> {
  const data = readData();
  return data.watchlists.map((wl) => ({
    ...wl,
    itemCount: wl.items.length,
  }));
}

export function getWatchlistById(id: string): Watchlist | null {
  const data = readData();
  return data.watchlists.find((wl) => wl.id === id) ?? null;
}

export function createWatchlist(name: string): Watchlist {
  const data = readData();
  const newWatchlist: Watchlist = {
    id: generateId(),
    name,
    items: [],
    createdAt: new Date().toISOString(),
  };
  data.watchlists.push(newWatchlist);
  writeData(data);
  return newWatchlist;
}

export function deleteWatchlist(id: string): boolean {
  const data = readData();
  const idx = data.watchlists.findIndex((wl) => wl.id === id);
  if (idx === -1) return false;
  data.watchlists.splice(idx, 1);
  writeData(data);
  return true;
}

export function addItemToWatchlist(
  id: string,
  item: Omit<WatchlistItem, "addedAt">,
): WatchlistItem | null {
  const data = readData();
  const wl = data.watchlists.find((w) => w.id === id);
  if (!wl) return null;

  // Prevent duplicates
  if (wl.items.some((i) => i.stockCode === item.stockCode)) {
    return wl.items.find((i) => i.stockCode === item.stockCode)!;
  }

  const newItem: WatchlistItem = {
    ...item,
    addedAt: new Date().toISOString(),
  };
  wl.items.push(newItem);
  writeData(data);
  return newItem;
}

export function removeItemFromWatchlist(
  id: string,
  stockCode: string,
): boolean {
  const data = readData();
  const wl = data.watchlists.find((w) => w.id === id);
  if (!wl) return false;

  const idx = wl.items.findIndex((i) => i.stockCode === stockCode);
  if (idx === -1) return false;

  wl.items.splice(idx, 1);
  writeData(data);
  return true;
}
