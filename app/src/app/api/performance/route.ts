import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { strategyPerformance } from "@/lib/db/schema";
import { eq, and, gte, lte, asc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const strategyId = searchParams.get("strategyId");
  const mode = searchParams.get("mode") as "live" | "backtest" | null;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const conditions = [];

  if (strategyId) {
    conditions.push(eq(strategyPerformance.strategyId, strategyId));
  }
  if (mode) {
    conditions.push(eq(strategyPerformance.mode, mode));
  }
  if (startDate) {
    conditions.push(gte(strategyPerformance.date, startDate));
  }
  if (endDate) {
    conditions.push(lte(strategyPerformance.date, endDate));
  }

  let records;
  if (conditions.length === 0) {
    records = db
      .select()
      .from(strategyPerformance)
      .orderBy(asc(strategyPerformance.date))
      .all();
  } else if (conditions.length === 1) {
    records = db
      .select()
      .from(strategyPerformance)
      .where(conditions[0])
      .orderBy(asc(strategyPerformance.date))
      .all();
  } else {
    records = db
      .select()
      .from(strategyPerformance)
      .where(and(...conditions))
      .orderBy(asc(strategyPerformance.date))
      .all();
  }

  return NextResponse.json(records);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { strategyId, date, dailyReturn, cumulativeReturn, tradeCount, mode } =
      body;

    if (!strategyId || !date || dailyReturn == null || !mode) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다" },
        { status: 400 },
      );
    }

    db.insert(strategyPerformance)
      .values({
        strategyId,
        date,
        dailyReturn,
        cumulativeReturn: cumulativeReturn ?? 0,
        tradeCount: tradeCount ?? 0,
        mode,
      })
      .run();

    // Retrieve the last inserted record
    const inserted = db
      .select()
      .from(strategyPerformance)
      .orderBy(asc(strategyPerformance.id))
      .all()
      .pop();

    return NextResponse.json(inserted, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청 형식입니다" },
      { status: 400 },
    );
  }
}
