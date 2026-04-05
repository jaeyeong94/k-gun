import { db } from "@/lib/db";
import { newsCache } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { fetchAllRss, RSS_SOURCES } from "@/lib/news";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stockCode = searchParams.get("stockCode");
    const category = searchParams.get("category");

    let items;
    if (stockCode) {
      items = db
        .select()
        .from(newsCache)
        .where(eq(newsCache.stockCode, stockCode))
        .orderBy(desc(newsCache.publishedAt))
        .all();
    } else {
      items = db
        .select()
        .from(newsCache)
        .orderBy(desc(newsCache.publishedAt))
        .limit(100)
        .all();
    }

    // 카테고리 필터 (news / disclosure)
    if (category) {
      const sourceNames = RSS_SOURCES
        .filter((s) => s.category === category)
        .map((s) => s.name);
      items = items.filter((n) => n.source && sourceNames.includes(n.source));
    }

    const news = items.map((n) => ({
      id: String(n.id),
      stockCode: n.stockCode ?? undefined,
      title: n.title,
      summary: n.summary ?? undefined,
      source: n.source ?? undefined,
      url: n.url ?? undefined,
      sentiment: n.sentiment ?? "neutral",
      publishedAt: n.publishedAt ?? undefined,
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

    // RSS 수집 모드
    if (body.action === "fetch-rss") {
      const sourceIds = body.sources as string[] | undefined;
      const rssItems = await fetchAllRss(sourceIds);

      let inserted = 0;
      for (const item of rssItems) {
        // URL 기준 중복 방지
        if (item.url) {
          const exists = db
            .select({ id: newsCache.id })
            .from(newsCache)
            .where(eq(newsCache.url, item.url))
            .get();
          if (exists) continue;
        }

        db.insert(newsCache)
          .values({
            title: item.title,
            summary: item.summary,
            source: item.source,
            url: item.url,
            publishedAt: item.publishedAt,
            sentiment: "neutral",
          })
          .run();
        inserted++;
      }

      return Response.json({
        fetched: rssItems.length,
        inserted,
        sources: RSS_SOURCES.filter(
          (s) => !sourceIds || sourceIds.includes(s.id),
        ).map((s) => s.name),
      });
    }

    // 수동 추가 모드
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

    const inserted = db
      .select()
      .from(newsCache)
      .orderBy(desc(newsCache.id))
      .limit(1)
      .get();

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

    return Response.json({ data: newsItem }, { status: 201 });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "뉴스 추가 실패";
    return Response.json({ error: msg }, { status: 500 });
  }
}
