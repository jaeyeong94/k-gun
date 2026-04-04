"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useNotificationStore } from "@/stores/notifications";
import type { AppNotification } from "@/stores/notifications";

const typeLabels: Record<AppNotification["type"], string> = {
  signal: "신호",
  price: "가격",
  order: "주문",
  system: "시스템",
};

const typeColors: Record<AppNotification["type"], string> = {
  signal: "text-blue-500",
  price: "text-yellow-500",
  order: "text-green-500",
  system: "text-muted-foreground",
};

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function BellButton() {
  const unreadCount = useNotificationStore(
    (s) => s.notifications.filter((n) => !n.read).length,
  );

  return (
    <Button variant="ghost" size="icon" aria-label="알림" className="relative">
      <Bell className="size-4" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Button>
  );
}

export function NotificationBell() {
  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<BellButton />} />
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-1.5 py-1">
          <DropdownMenuLabel>알림</DropdownMenuLabel>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                markAllAsRead();
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              모두 읽음
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            알림이 없습니다
          </div>
        ) : (
          notifications.slice(0, 10).map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="flex flex-col items-start gap-1 py-2"
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex w-full items-center gap-2">
                <span
                  className={`text-xs font-medium ${typeColors[notification.type]}`}
                >
                  [{typeLabels[notification.type]}]
                </span>
                <span className="flex-1 truncate text-sm font-medium">
                  {notification.title}
                </span>
                {!notification.read && (
                  <span className="size-2 shrink-0 rounded-full bg-blue-500" />
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {notification.body}
              </span>
              <span className="text-[10px] text-muted-foreground/60">
                {formatTime(notification.timestamp)}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
