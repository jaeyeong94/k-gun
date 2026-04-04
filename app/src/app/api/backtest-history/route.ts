import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { backtestCache } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";

function generateCacheKey(
  strategyId: string,
  symbols: string,
  startDate: string,
  endDate: string,
  params: string,
): string {
  const raw = `${strategyId}|${symbols}|${startDate}|${endDate}|${params}`;
  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

export async function GET() {
  try {
    const rows = db
      .select()
      .from(backtestCache)
      .orderBy(desc(backtestCache.createdAt))
      .limit(20)
      .all();

    const data = rows.map((row) => {
      let totalReturn: number | null = null;
      let sharpe: number | null = null;
      try {
        const parsed = JSON.parse(row.result);
        totalReturn = parsed.metrics?.basic?.total_return ?? null;
        sharpe = parsed.metrics?.risk?.sharpe_ratio ?? null;
      } catch {
        // ignore parse errors
      }
      return {
        id: row.id,
        cacheKey: row.cacheKey,
        strategyId: row.strategyId,
        symbols: row.symbols,
        startDate: row.startDate,
        endDate: row.endDate,
        createdAt: row.createdAt,
        totalReturn,
        sharpe,
      };
    });

    return Response.json({ status: "ok", data });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "백테스트 이력 조회 실패";
    return Response.json({ status: "error", message: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { strategy_id, symbols, start_date, end_date, params, result } =
      body as {
        strategy_id?: string;
        symbols?: string;
        start_date?: string;
        end_date?: string;
        params?: Record<string, unknown>;
        result?: unknown;
      };

    if (!strategy_id || !symbols || !result) {
      return Response.json(
        { status: "error", message: "필수 필드가 누락되었습니다" },
        { status: 400 },
      );
    }

    const paramsStr = params ? JSON.stringify(params) : "";
    const cacheKey = generateCacheKey(
      strategy_id,
      symbols,
      start_date ?? "",
      end_date ?? "",
      paramsStr,
    );

    // Check if already saved
    const existing = db
      .select()
      .from(backtestCache)
      .where(eq(backtestCache.cacheKey, cacheKey))
      .all();

    if (existing.length > 0) {
      return Response.json(
        { status: "ok", data: { id: existing[0].id, cacheKey, alreadyExists: true } },
        { status: 200 },
      );
    }

    db.insert(backtestCache)
      .values({
        cacheKey,
        strategyId: strategy_id,
        symbols,
        startDate: start_date ?? null,
        endDate: end_date ?? null,
        params: paramsStr || null,
        result: JSON.stringify(result),
      })
      .run();

    const created = db
      .select()
      .from(backtestCache)
      .where(eq(backtestCache.cacheKey, cacheKey))
      .all()
      .pop();

    return Response.json(
      { status: "ok", data: { id: created?.id, cacheKey, alreadyExists: false } },
      { status: 201 },
    );
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "백테스트 결과 저장 실패";
    return Response.json({ status: "error", message: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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
    const existing = db
      .select()
      .from(backtestCache)
      .where(eq(backtestCache.id, numericId))
      .all();

    if (existing.length === 0) {
      return Response.json(
        { status: "error", message: "이력을 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    db.delete(backtestCache).where(eq(backtestCache.id, numericId)).run();

    return Response.json({ status: "ok" });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "백테스트 이력 삭제 실패";
    return Response.json({ status: "error", message: msg }, { status: 500 });
  }
}
