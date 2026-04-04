import { db } from "@/lib/db";
import { marketEvents } from "@/lib/db/schema";
import { eq, like, and, asc } from "drizzle-orm";
import type { EventType } from "@/types/calendar";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // YYYY-MM
    const type = searchParams.get("type") as EventType | null;

    let query = db.select().from(marketEvents);

    const conditions = [];
    if (month) {
      conditions.push(like(marketEvents.date, `${month}%`));
    }
    if (type) {
      conditions.push(eq(marketEvents.type, type));
    }

    let events;
    if (conditions.length === 1) {
      events = query.where(conditions[0]).orderBy(asc(marketEvents.date)).all();
    } else if (conditions.length === 2) {
      events = query.where(and(...conditions)).orderBy(asc(marketEvents.date)).all();
    } else {
      events = query.orderBy(asc(marketEvents.date)).all();
    }

    // Map to API response format matching MarketEvent interface
    const result = events.map((e) => ({
      id: String(e.id),
      date: e.date,
      type: e.type,
      stockCode: e.stockCode ?? undefined,
      name: e.name,
      description: e.description ?? undefined,
      importance: e.importance ?? "medium",
    }));

    return Response.json({ events: result });
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

    db.insert(marketEvents)
      .values({
        date,
        type,
        stockCode: stockCode || null,
        name,
        description: description || null,
        importance: importance || "medium",
      })
      .run();

    // Get the last inserted row
    const inserted = db
      .select()
      .from(marketEvents)
      .orderBy(asc(marketEvents.id))
      .all()
      .pop();

    const event = inserted
      ? {
          id: String(inserted.id),
          date: inserted.date,
          type: inserted.type,
          stockCode: inserted.stockCode ?? undefined,
          name: inserted.name,
          description: inserted.description ?? undefined,
          importance: inserted.importance ?? "medium",
        }
      : null;

    return Response.json({ event }, { status: 201 });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "이벤트 추가 실패";
    return Response.json({ error: msg }, { status: 500 });
  }
}
