import { create } from "zustand";

interface AuthState {
  authenticated: boolean;
  mode: "vps" | "prod" | null;
  modeDisplay: string;
  canSwitchMode: boolean;
  cooldownRemaining: number;
  isLoading: boolean;
  error: string | null;

  checkStatus: () => Promise<void>;
  login: (mode: "vps" | "prod") => Promise<void>;
  logout: () => Promise<void>;
  switchMode: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  authenticated: false,
  mode: null,
  modeDisplay: "",
  canSwitchMode: true,
  cooldownRemaining: 0,
  isLoading: false,
  error: null,

  checkStatus: async () => {
    try {
      const res = await fetch("/api/strategy/auth/status");
      if (!res.ok) return;
      const data = await res.json();
      set({
        authenticated: data.authenticated ?? false,
        mode: data.mode ?? null,
        modeDisplay: data.mode_display ?? "",
        canSwitchMode: data.can_switch_mode ?? true,
        cooldownRemaining: data.cooldown_remaining ?? 0,
      });
    } catch {
      set({ authenticated: false, mode: null });
    }
  },

  login: async (mode) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/strategy/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `인증 실패 (${res.status})`);
      }
      await get().checkStatus();
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "인증 실패" });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await fetch("/api/strategy/auth/logout", { method: "POST" });
      set({ authenticated: false, mode: null, modeDisplay: "" });
    } finally {
      set({ isLoading: false });
    }
  },

  switchMode: async () => {
    const currentMode = get().mode;
    const targetMode = currentMode === "prod" ? "vps" : "prod";
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/strategy/auth/switch-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: targetMode }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? "모드 전환 실패");
      }
      await get().checkStatus();
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "모드 전환 실패" });
    } finally {
      set({ isLoading: false });
    }
  },
}));
