import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { journalEntries } from "@/lib/db/schema";
import { desc, and, gte, lte } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const conditions = [];

    if (startDate) {
      conditions.push(gte(journalEntries.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(journalEntries.date, endDate));
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

    const totalTrades = entries.length;
    const totalPnl = entries.reduce(
      (sum, e) => sum + (e.profitLoss ?? 0),
      0,
    );
    const winCount = entries.filter((e) => (e.profitLoss ?? 0) > 0).length;
    const lossCount = entries.filter((e) => (e.profitLoss ?? 0) < 0).length;
    const winRate =
      totalTrades > 0 ? ((winCount / totalTrades) * 100).toFixed(1) : "0.0";

    // Tag stats: count per tag
    const tagCounts: Record<string, number> = {};
    for (const entry of entries) {
      try {
        const tags: string[] = JSON.parse(entry.tags ?? "[]");
        for (const tag of tags) {
          tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
        }
      } catch {
        // skip invalid JSON
      }
    }

    return Response.json({
      status: "success",
      data: {
        totalTrades,
        totalPnl,
        winCount,
        lossCount,
        winRate: Number(winRate),
        tagStats: tagCounts,
      },
    });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "요약 조회에 실패했습니다";
    return Response.json(
      { status: "error", message: msg },
      { status: 500 },
    );
  }
}
