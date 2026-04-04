import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { journalEntries, journalDailySummary } from "@/lib/db/schema";
import { eq, desc, and, gte, lte, like } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const tag = searchParams.get("tag");

    const conditions = [];

    if (date) {
      conditions.push(eq(journalEntries.date, date));
    }

    if (tag) {
      conditions.push(like(journalEntries.tags, `%"${tag}"%`));
    }

    const entries =
      conditions.length > 0
        ? await db
            .select()
            .from(journalEntries)
            .where(and(...conditions))
            .orderBy(desc(journalEntries.createdAt))
        : await db
            .select()
            .from(journalEntries)
            .orderBy(desc(journalEntries.createdAt));

    return Response.json({ status: "success", data: entries });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "저널 조회에 실패했습니다";
    return Response.json(
      { status: "error", message: msg },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      date,
      stockCode,
      stockName,
      action,
      strategy,
      price,
      quantity,
      profitLoss,
      profitRate,
      reason,
      tags,
      memo,
    } = body;

    if (!date || !stockCode || !stockName || !action || !price || !quantity) {
      return Response.json(
        { status: "error", message: "필수 항목이 누락되었습니다" },
        { status: 400 },
      );
    }

    if (!["BUY", "SELL"].includes(action)) {
      return Response.json(
        { status: "error", message: "action은 BUY 또는 SELL이어야 합니다" },
        { status: 400 },
      );
    }

    const [entry] = await db
      .insert(journalEntries)
      .values({
        date,
        stockCode,
        stockName,
        action,
        strategy: strategy ?? null,
        price,
        quantity,
        profitLoss: profitLoss ?? 0,
        profitRate: profitRate ?? 0,
        reason: reason ?? null,
        tags: JSON.stringify(tags ?? []),
        memo: memo ?? null,
        createdAt: new Date().toISOString(),
      })
      .returning();

    // Update daily summary
    await updateDailySummary(date);

    return Response.json({ status: "success", data: entry }, { status: 201 });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "저널 저장에 실패했습니다";
    return Response.json(
      { status: "error", message: msg },
      { status: 500 },
    );
  }
}

async function updateDailySummary(date: string) {
  const dayEntries = await db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.date, date));

  const totalTrades = dayEntries.length;
  const totalPnl = dayEntries.reduce((sum, e) => sum + (e.profitLoss ?? 0), 0);
  const winCount = dayEntries.filter((e) => (e.profitLoss ?? 0) > 0).length;
  const lossCount = dayEntries.filter((e) => (e.profitLoss ?? 0) < 0).length;

  const existing = await db
    .select()
    .from(journalDailySummary)
    .where(eq(journalDailySummary.date, date));

  if (existing.length > 0) {
    await db
      .update(journalDailySummary)
      .set({
        totalTrades,
        realizedPnl: totalPnl,
        winCount,
        lossCount,
      })
      .where(eq(journalDailySummary.date, date));
  } else {
    await db.insert(journalDailySummary).values({
      date,
      totalTrades,
      realizedPnl: totalPnl,
      winCount,
      lossCount,
    });
  }
}
