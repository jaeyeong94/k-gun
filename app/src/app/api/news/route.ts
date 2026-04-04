import { db } from "@/lib/db";
import { newsCache } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stockCode = searchParams.get("stockCode");

    let items;
    if (stockCode) {
      items = db
        .select()
        .from(newsCache)
        .where(eq(newsCache.stockCode, stockCode))
        .orderBy(desc(newsCache.cachedAt))
        .all();
    } else {
      items = db
        .select()
        .from(newsCache)
        .orderBy(desc(newsCache.cachedAt))
        .all();
    }

    // Map to API response format matching NewsItem interface
    const news = items.map((n) => ({
      id: String(n.id),
      stockCode: n.stockCode ?? undefined,
      title: n.title,
      summary: n.summary ?? undefined,
      source: n.source ?? undefined,
      sentiment: n.sentiment ?? "neutral",
      createdAt: n.cachedAt ?? new Date().toISOString(),
    }));

    return Response.json({ news });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "뉴스 조회 실패";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { stockCode, title, summary, source, sentiment } = body;

    if (!title) {
      return Response.json(
        { error: "title은 필수입니다" },
        { status: 400 },
      );
    }

    const validSentiments = ["positive", "negative", "neutral"];
    if (sentiment && !validSentiments.includes(sentiment)) {
      return Response.json(
        { error: `유효하지 않은 감성: ${sentiment}` },
        { status: 400 },
      );
    }

    db.insert(newsCache)
      .values({
        stockCode: stockCode || null,
        title,
        summary: summary || null,
        source: source || null,
        sentiment: sentiment || "neutral",
      })
      .run();

    // Get the last inserted row
    const inserted = db
      .select()
      .from(newsCache)
      .orderBy(desc(newsCache.id))
      .all()
      .at(0);

    const newsItem = inserted
      ? {
          id: String(inserted.id),
          stockCode: inserted.stockCode ?? undefined,
          title: inserted.title,
          summary: inserted.summary ?? undefined,
          source: inserted.source ?? undefined,
          sentiment: inserted.sentiment ?? "neutral",
          createdAt: inserted.cachedAt ?? new Date().toISOString(),
        }
      : null;

    return Response.json({ news: newsItem }, { status: 201 });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "뉴스 추가 실패";
    return Response.json({ error: msg }, { status: 500 });
  }
}
