"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isSameDay,
} from "date-fns";

interface MarketEvent {
  id: number;
  date: string;
  type: string;
  stockCode: string | null;
  name: string;
  description: string | null;
  importance: string | null;
}

const EVENT_COLORS: Record<string, string> = {
  earnings: "bg-purple-500/20 text-purple-400",
  dividend: "bg-green-500/20 text-green-400",
  economic: "bg-orange-500/20 text-orange-400",
  ipo: "bg-blue-500/20 text-blue-400",
  holiday: "bg-red-500/20 text-red-400",
};

const EVENT_LABELS: Record<string, string> = {
  earnings: "실적",
  dividend: "배당",
  economic: "경제",
  ipo: "IPO",
  holiday: "휴장",
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function CalendarClient({
  initialEvents,
}: {
  initialEvents: MarketEvent[];
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<MarketEvent[]>(initialEvents);
  const [dialogOpen, setDialogOpen] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);

  const monthStr = format(currentMonth, "yyyy-MM");
  const monthEvents = events.filter((e) => e.date.startsWith(monthStr));

  const selectedEvents = selectedDate
    ? events.filter((e) => e.date === format(selectedDate, "yyyy-MM-dd"))
    : [];

  const handleAddEvent = useCallback(
    async (formData: FormData) => {
      const body = {
        date: formData.get("date") as string,
        type: formData.get("type") as string,
        name: formData.get("name") as string,
        description: (formData.get("description") as string) || undefined,
        stockCode: (formData.get("stockCode") as string) || undefined,
        importance: "medium",
      };

      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setEvents((prev) => [...prev, data.data]);
        }
        setDialogOpen(false);
      }
    },
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-6" />
          <h1 className="text-2xl font-bold">시장 캘린더</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-1.5 size-4" />
            이벤트 추가
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>이벤트 추가</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddEvent(new FormData(e.currentTarget));
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>날짜</Label>
                <Input
                  name="date"
                  type="date"
                  defaultValue={
                    selectedDate
                      ? format(selectedDate, "yyyy-MM-dd")
                      : format(new Date(), "yyyy-MM-dd")
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>유형</Label>
                <select
                  name="type"
                  className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                  required
                >
                  {Object.entries(EVENT_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>이벤트명</Label>
                <Input name="name" required />
              </div>
              <div className="space-y-2">
                <Label>종목코드 (선택)</Label>
                <Input name="stockCode" />
              </div>
              <div className="space-y-2">
                <Label>설명 (선택)</Label>
                <Input name="description" />
              </div>
              <Button type="submit" className="w-full">
                추가
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Month Navigation */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <CardTitle>{format(currentMonth, "yyyy년 MM월")}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-medium text-muted-foreground py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startPadding }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {days.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const dayEvents = monthEvents.filter((e) => e.date === dateStr);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-[60px] rounded-lg border p-1 text-left transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : isToday
                        ? "border-primary/30"
                        : "border-transparent hover:bg-muted/50"
                  }`}
                >
                  <span
                    className={`text-xs ${
                      !isSameMonth(day, currentMonth)
                        ? "text-muted-foreground/40"
                        : isToday
                          ? "font-bold text-primary"
                          : ""
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="mt-0.5 flex flex-wrap gap-0.5">
                    {dayEvents.slice(0, 3).map((e) => (
                      <div
                        key={e.id}
                        className={`h-1.5 w-1.5 rounded-full ${
                          EVENT_COLORS[e.type]?.split(" ")[0] ?? "bg-gray-500/20"
                        }`}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Events */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {format(selectedDate, "yyyy년 MM월 dd일")}
            </CardTitle>
            <CardDescription>
              {selectedEvents.length > 0
                ? `${selectedEvents.length}개 이벤트`
                : "이벤트 없음"}
            </CardDescription>
          </CardHeader>
          {selectedEvents.length > 0 && (
            <CardContent className="space-y-2">
              {selectedEvents.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-2 rounded-lg border p-3"
                >
                  <Badge className={EVENT_COLORS[e.type] ?? ""}>
                    {EVENT_LABELS[e.type] ?? e.type}
                  </Badge>
                  <div>
                    <div className="font-medium text-sm">{e.name}</div>
                    {e.description && (
                      <div className="text-xs text-muted-foreground">
                        {e.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
