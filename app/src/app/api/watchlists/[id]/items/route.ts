import { NextRequest } from "next/server";
import {
  getWatchlistById,
  addItemToWatchlist,
  removeItemFromWatchlist,
} from "@/lib/db/watchlist-store";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;
    const watchlist = getWatchlistById(id);

    if (!watchlist) {
      return Response.json(
        { status: "error", message: "워치리스트를 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    return Response.json({
      status: "ok",
      data: {
        id: watchlist.id,
        name: watchlist.name,
        items: watchlist.items,
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

    const item = addItemToWatchlist(id, {
      stockCode,
      stockName,
      memo,
      targetBuy,
      targetSell,
    });

    if (!item) {
      return Response.json(
        { status: "error", message: "워치리스트를 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    return Response.json({ status: "ok", data: item }, { status: 201 });
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
    const { searchParams } = new URL(request.url);
    const stockCode = searchParams.get("stockCode");

    if (!stockCode) {
      return Response.json(
        { status: "error", message: "종목 코드가 필요합니다" },
        { status: 400 },
      );
    }

    const removed = removeItemFromWatchlist(id, stockCode);
    if (!removed) {
      return Response.json(
        { status: "error", message: "항목을 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    return Response.json({ status: "ok" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "종목 삭제 실패";
    return Response.json({ status: "error", message: msg }, { status: 500 });
  }
}
