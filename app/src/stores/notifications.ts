import { create } from "zustand";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: "signal" | "price" | "order" | "system";
  timestamp: Date;
  read: boolean;
}

interface NotificationState {
  enabled: boolean;
  notifications: AppNotification[];

  requestPermission: () => Promise<void>;
  sendNotification: (
    title: string,
    body: string,
    options?: { type?: AppNotification["type"] },
  ) => void;
  addNotification: (notification: AppNotification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

function getBrowserPermission(): boolean {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window)) return false;
  return Notification.permission === "granted";
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  enabled: getBrowserPermission(),
  notifications: [],

  requestPermission: async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const result = await Notification.requestPermission();
    set({ enabled: result === "granted" });
  },

  sendNotification: (title, body, options) => {
    const state = get();
    const type = options?.type ?? "system";

    const notification: AppNotification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      body,
      type,
      timestamp: new Date(),
      read: false,
    };

    state.addNotification(notification);

    if (
      state.enabled &&
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      try {
        new Notification(title, { body });
      } catch {
        // Browser may block notification in some contexts
      }
    }
  },

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 50),
    })),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  clearNotifications: () => set({ notifications: [] }),
}));
