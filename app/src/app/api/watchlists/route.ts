import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { watchlists, watchlistItems } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const allWatchlists = db.select().from(watchlists).all();

    // Compute itemCount for each watchlist
    const result = allWatchlists.map((wl) => {
      const items = db
        .select()
        .from(watchlistItems)
        .where(eq(watchlistItems.watchlistId, wl.id))
        .all();
      return {
        id: String(wl.id),
        name: wl.name,
        items,
        createdAt: wl.createdAt,
        itemCount: items.length,
      };
    });

    return Response.json({ status: "ok", data: result });
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

    db.insert(watchlists).values({ name: name.trim() }).run();

    // Retrieve the newly created watchlist
    const created = db
      .select()
      .from(watchlists)
      .where(eq(watchlists.name, name.trim()))
      .all()
      .pop();

    return Response.json(
      {
        status: "ok",
        data: created
          ? { id: String(created.id), name: created.name, items: [], createdAt: created.createdAt }
          : null,
      },
      { status: 201 },
    );
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

    const numericId = Number(id);

    // Check existence
    const existing = db
      .select()
      .from(watchlists)
      .where(eq(watchlists.id, numericId))
      .all();

    if (existing.length === 0) {
      return Response.json(
        { status: "error", message: "워치리스트를 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    // Delete items first, then the watchlist
    db.delete(watchlistItems)
      .where(eq(watchlistItems.watchlistId, numericId))
      .run();
    db.delete(watchlists).where(eq(watchlists.id, numericId)).run();

    return Response.json({ status: "ok" });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "워치리스트 삭제 실패";
    return Response.json({ status: "error", message: msg }, { status: 500 });
  }
}
