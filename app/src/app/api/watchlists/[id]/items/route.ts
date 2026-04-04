import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { watchlists, watchlistItems } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;
    const numericId = Number(id);

    const watchlist = db
      .select()
      .from(watchlists)
      .where(eq(watchlists.id, numericId))
      .all();

    if (watchlist.length === 0) {
      return Response.json(
        { status: "error", message: "워치리스트를 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    const items = db
      .select()
      .from(watchlistItems)
      .where(eq(watchlistItems.watchlistId, numericId))
      .all();

    return Response.json({
      status: "ok",
      data: {
        id: String(watchlist[0].id),
        name: watchlist[0].name,
        items,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "항목 조회 실패";
    return Response.json({ status: "error", message: msg }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;
    const numericId = Number(id);
    const body = await request.json();
    const { stockCode, stockName, memo, targetBuy, targetSell } = body as {
      stockCode?: string;
      stockName?: string;
      memo?: string;
      targetBuy?: number;
      targetSell?: number;
    };

    if (!stockCode || !stockName) {
      return Response.json(
        { status: "error", message: "종목 코드와 이름을 입력해주세요" },
        { status: 400 },
      );
    }

    // Check watchlist exists
    const watchlist = db
      .select()
      .from(watchlists)
      .where(eq(watchlists.id, numericId))
      .all();

    if (watchlist.length === 0) {
      return Response.json(
        { status: "error", message: "워치리스트를 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    // Check for duplicate
    const existing = db
      .select()
      .from(watchlistItems)
      .where(
        and(
          eq(watchlistItems.watchlistId, numericId),
          eq(watchlistItems.stockCode, stockCode),
        ),
      )
      .all();

    if (existing.length > 0) {
      return Response.json({ status: "ok", data: existing[0] }, { status: 201 });
    }

    db.insert(watchlistItems)
      .values({
        watchlistId: numericId,
        stockCode,
        stockName,
        memo,
        targetBuy,
        targetSell,
      })
      .run();

    // Retrieve the newly inserted item
    const inserted = db
      .select()
      .from(watchlistItems)
      .where(
        and(
          eq(watchlistItems.watchlistId, numericId),
          eq(watchlistItems.stockCode, stockCode),
        ),
      )
      .all()
      .pop();

    return Response.json({ status: "ok", data: inserted }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "종목 추가 실패";
    return Response.json({ status: "error", message: msg }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;
    const numericId = Number(id);
    const { searchParams } = new URL(request.url);
    const stockCode = searchParams.get("stockCode");

    if (!stockCode) {
      return Response.json(
        { status: "error", message: "종목 코드가 필요합니다" },
        { status: 400 },
      );
    }

    // Check item exists
    const existing = db
      .select()
      .from(watchlistItems)
      .where(
        and(
          eq(watchlistItems.watchlistId, numericId),
          eq(watchlistItems.stockCode, stockCode),
        ),
      )
      .all();

    if (existing.length === 0) {
      return Response.json(
        { status: "error", message: "항목을 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    db.delete(watchlistItems)
      .where(
        and(
          eq(watchlistItems.watchlistId, numericId),
          eq(watchlistItems.stockCode, stockCode),
        ),
      )
      .run();

    return Response.json({ status: "ok" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "종목 삭제 실패";
    return Response.json({ status: "error", message: msg }, { status: 500 });
  }
}
