import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { backtestCache } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json(
        { status: "error", message: "ID가 필요합니다" },
        { status: 400 },
      );
    }

    const numericId = Number(id);
    const row = db
      .select()
      .from(backtestCache)
      .where(eq(backtestCache.id, numericId))
      .all()
      .pop();

    if (!row) {
      return Response.json(
        { status: "error", message: "이력을 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    return Response.json({
      status: "ok",
      data: {
        id: row.id,
        cacheKey: row.cacheKey,
        strategyId: row.strategyId,
        symbols: row.symbols,
        startDate: row.startDate,
        endDate: row.endDate,
        params: row.params,
        result: row.result,
        createdAt: row.createdAt,
      },
    });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "백테스트 상세 조회 실패";
    return Response.json({ status: "error", message: msg }, { status: 500 });
  }
}
