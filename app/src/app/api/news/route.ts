import { readCollection, addToCollection } from "@/lib/store/json-store";
import type { NewsItem } from "@/types/calendar";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stockCode = searchParams.get("stockCode");

    let news = readCollection<NewsItem>("news-cache");

    if (stockCode) {
      news = news.filter((n) => n.stockCode === stockCode);
    }

    news.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

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

    const newsItem: NewsItem = {
      id: `news_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      stockCode: stockCode || undefined,
      title,
      summary: summary || undefined,
      source: source || undefined,
      sentiment: sentiment || "neutral",
      createdAt: new Date().toISOString(),
    };

    addToCollection("news-cache", newsItem);

    return Response.json({ news: newsItem }, { status: 201 });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "뉴스 추가 실패";
    return Response.json({ error: msg }, { status: 500 });
  }
}
