import { NextRequest } from "next/server";
import {
  getAllWatchlists,
  createWatchlist,
  deleteWatchlist,
} from "@/lib/db/watchlist-store";

export async function GET() {
  try {
    const watchlists = getAllWatchlists();
    return Response.json({ status: "ok", data: watchlists });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "워치리스트 조회 실패";
    return Response.json({ status: "error", message: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body as { name?: string };

    if (!name || name.trim().length === 0) {
      return Response.json(
        { status: "error", message: "워치리스트 이름을 입력해주세요" },
        { status: 400 },
      );
    }

    const watchlist = createWatchlist(name.trim());
    return Response.json({ status: "ok", data: watchlist }, { status: 201 });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "워치리스트 생성 실패";
    return Response.json({ status: "error", message: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json(
        { status: "error", message: "워치리스트 ID가 필요합니다" },
        { status: 400 },
      );
    }

    const deleted = deleteWatchlist(id);
    if (!deleted) {
      return Response.json(
        { status: "error", message: "워치리스트를 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    return Response.json({ status: "ok" });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "워치리스트 삭제 실패";
    return Response.json({ status: "error", message: msg }, { status: 500 });
  }
}
