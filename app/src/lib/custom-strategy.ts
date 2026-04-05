import type { BuilderState } from "@/types/strategy";

const STORAGE_KEY = "k-gun-custom-strategy";

export interface SavedCustomStrategy {
  name: string;
  builderState: BuilderState;
  yamlContent: string;
  savedAt: string;
}

export function saveCustomStrategy(data: SavedCustomStrategy): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadCustomStrategy(): SavedCustomStrategy | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearCustomStrategy(): void {
  localStorage.removeItem(STORAGE_KEY);
}
