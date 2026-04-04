"use client";

import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  getDay,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameDay,
  parseISO,
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCalendarEvents, useAddCalendarEvent } from "@/hooks/use-calendar";
import type { EventType, MarketEvent } from "@/types/calendar";

const EVENT_TYPE_CONFIG: Record<
  EventType,
  { label: string; color: string; bgColor: string }
> = {
  earnings: {
    label: "실적",
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
  },
  dividend: {
    label: "배당",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
  },
  economic: {
    label: "경제",
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
  },
  ipo: {
    label: "IPO",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
  },
  holiday: {
    label: "휴장",
    color: "text-red-400",
    bgColor: "bg-red-500/20",
  },
};

const DAY_HEADERS = ["일", "월", "화", "수", "목", "금", "토"];

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const monthStr = format(currentMonth, "yyyy-MM");
  const { data, isLoading } = useCalendarEvents(monthStr);
  const addEvent = useAddCalendarEvent();

  const events = data?.events ?? [];

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });

    // Pad start with empty slots for days before the 1st
    const startDayOfWeek = getDay(start); // 0=Sun
    const paddedDays: (Date | null)[] = Array(startDayOfWeek).fill(null);
    paddedDays.push(...days);

    // Pad end to fill the last week row
    while (paddedDays.length % 7 !== 0) {
      paddedDays.push(null);
    }

    return paddedDays;
  }, [currentMonth]);

  const eventsForDate = (date: Date): MarketEvent[] => {
    const dateStr = format(date, "yyyy-MM-dd");
    return events.filter((e) => e.date === dateStr);
  };

  const selectedDateEvents = selectedDate
    ? eventsForDate(selectedDate)
    : [];

  const handleAddEvent = (formData: FormData) => {
    const date = formData.get("date") as string;
    const type = formData.get("type") as EventType;
    const name = formData.get("name") as string;
    const stockCode = formData.get("stockCode") as string;
    const description = formData.get("description") as string;
    const importance = formData.get("importance") as "low" | "medium" | "high";

    if (!date || !type || !name) return;

    addEvent.mutate(
      {
        date,
        type,
        name,
        stockCode: stockCode || undefined,
        description: description || undefined,
        importance: importance || "medium",
      },
      {
        onSuccess: () => setDialogOpen(false),
      },
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">시장 캘린더</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button size="sm" className="min-h-[44px]" nativeButton={false} />
            }
          >
            <Plus className="size-4 mr-1" />
            이벤트 추가
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>시장 이벤트 추가</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddEvent(new FormData(e.currentTarget));
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="event-date">날짜</Label>
                <Input
                  id="event-date"
                  name="date"
                  type="date"
                  required
                  defaultValue={
                    selectedDate
                      ? format(selectedDate, "yyyy-MM-dd")
                      : format(new Date(), "yyyy-MM-dd")
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-type">유형</Label>
                <select
                  id="event-type"
                  name="type"
                  required
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="earnings">실적</option>
                  <option value="dividend">배당</option>
                  <option value="economic">경제</option>
                  <option value="ipo">IPO</option>
                  <option value="holiday">휴장</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-name">이름</Label>
                <Input
                  id="event-name"
                  name="name"
                  placeholder="이벤트 이름"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-stock">종목 코드 (선택)</Label>
                <Input
                  id="event-stock"
                  name="stockCode"
                  placeholder="005930"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-desc">설명 (선택)</Label>
                <Input
                  id="event-desc"
                  name="description"
                  placeholder="이벤트 설명"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-importance">중요도</Label>
                <select
                  id="event-importance"
                  name="importance"
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="low">낮음</option>
                  <option value="medium">보통</option>
                  <option value="high">높음</option>
                </select>
              </div>
              <DialogFooter>
                <DialogClose
                  render={
                    <Button
                      variant="outline"
                      type="button"
                      nativeButton={false}
                    />
                  }
                >
                  취소
                </DialogClose>
                <Button type="submit" disabled={addEvent.isPending}>
                  {addEvent.isPending ? "추가 중..." : "추가"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Month navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="min-h-[44px] min-w-[44px]"
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <CardTitle className="text-lg">
              {format(currentMonth, "yyyy년 MM월", { locale: ko })}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="min-h-[44px] min-w-[44px]"
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              로딩 중...
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-px">
              {/* Day headers */}
              {DAY_HEADERS.map((day, i) => (
                <div
                  key={day}
                  className={`text-center text-xs font-medium py-2 ${
                    i === 0
                      ? "text-red-400"
                      : i === 6
                        ? "text-blue-400"
                        : "text-muted-foreground"
                  }`}
                >
                  {day}
                </div>
              ))}

              {/* Calendar cells */}
              {calendarDays.map((day, idx) => {
                if (!day) {
                  return <div key={`empty-${idx}`} className="min-h-[72px]" />;
                }

                const dayEvents = eventsForDate(day);
                const isSelected =
                  selectedDate && isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                const dayOfWeek = getDay(day);

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => setSelectedDate(day)}
                    className={`min-h-[72px] p-1 rounded-lg text-left transition-colors hover:bg-muted/50 ${
                      isSelected
                        ? "bg-muted ring-1 ring-primary"
                        : ""
                    }`}
                  >
                    <div
                      className={`text-xs font-medium mb-1 ${
                        isToday
                          ? "bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center"
                          : dayOfWeek === 0
                            ? "text-red-400"
                            : dayOfWeek === 6
                              ? "text-blue-400"
                              : ""
                      }`}
                    >
                      {format(day, "d")}
                    </div>
                    <div className="flex flex-wrap gap-0.5">
                      {dayEvents.slice(0, 3).map((evt) => {
                        const config = EVENT_TYPE_CONFIG[evt.type];
                        return (
                          <span
                            key={evt.id}
                            className={`inline-block w-full truncate text-[10px] px-1 rounded ${config.bgColor} ${config.color}`}
                          >
                            {config.label}
                          </span>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{dayEvents.length - 3}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected date events */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {format(selectedDate, "yyyy년 MM월 dd일 (EEEE)", { locale: ko })}
            </CardTitle>
            <CardDescription>
              {selectedDateEvents.length > 0
                ? `${selectedDateEvents.length}개 이벤트`
                : "이벤트가 없습니다"}
            </CardDescription>
          </CardHeader>
          {selectedDateEvents.length > 0 && (
            <CardContent className="space-y-3">
              {selectedDateEvents.map((evt) => {
                const config = EVENT_TYPE_CONFIG[evt.type];
                return (
                  <div
                    key={evt.id}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    <Badge
                      className={`${config.bgColor} ${config.color} border-0 shrink-0`}
                    >
                      {config.label}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm">{evt.name}</div>
                      {evt.description && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {evt.description}
                        </div>
                      )}
                      {evt.stockCode && (
                        <div className="text-xs text-muted-foreground mt-1">
                          종목: {evt.stockCode}
                        </div>
                      )}
                    </div>
                    <Badge
                      variant={
                        evt.importance === "high"
                          ? "destructive"
                          : evt.importance === "medium"
                            ? "secondary"
                            : "outline"
                      }
                      className="shrink-0"
                    >
                      {evt.importance === "high"
                        ? "높음"
                        : evt.importance === "medium"
                          ? "보통"
                          : "낮음"}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
