import { readCollection, addToCollection } from "@/lib/store/json-store";
import type { MarketEvent, EventType } from "@/types/calendar";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // YYYY-MM
    const type = searchParams.get("type") as EventType | null;

    let events = readCollection<MarketEvent>("market-events");

    if (month) {
      events = events.filter((e) => e.date.startsWith(month));
    }

    if (type) {
      events = events.filter((e) => e.type === type);
    }

    events.sort((a, b) => a.date.localeCompare(b.date));

    return Response.json({ events });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "이벤트 조회 실패";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, type, stockCode, name, description, importance } = body;

    if (!date || !type || !name) {
      return Response.json(
        { error: "date, type, name은 필수입니다" },
        { status: 400 },
      );
    }

    const validTypes: EventType[] = [
      "earnings",
      "dividend",
      "economic",
      "ipo",
      "holiday",
    ];
    if (!validTypes.includes(type)) {
      return Response.json(
        { error: `유효하지 않은 타입: ${type}` },
        { status: 400 },
      );
    }

    const event: MarketEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      date,
      type,
      stockCode: stockCode || undefined,
      name,
      description: description || undefined,
      importance: importance || "medium",
      createdAt: new Date().toISOString(),
    };

    addToCollection("market-events", event);

    return Response.json({ event }, { status: 201 });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "이벤트 추가 실패";
    return Response.json({ error: msg }, { status: 500 });
  }
}
