/**
 * RSS 뉴스 수집 유틸리티
 *
 * 국내 주요 경제 매체의 RSS 피드에서 뉴스를 수집합니다.
 * 서버 사이드 전용 — API route, 서버 컴포넌트, cron 등에서 사용.
 */

import { XMLParser } from "fast-xml-parser";

// ─── RSS 소스 정의 ──────────────────────────────────────────────

export interface RssSource {
  id: string;
  name: string;
  url: string;
  category: "news" | "disclosure";
}

export const RSS_SOURCES: RssSource[] = [
  {
    id: "hankyung",
    name: "한국경제",
    url: "https://www.hankyung.com/feed/finance",
    category: "news",
  },
  {
    id: "moneytoday",
    name: "머니투데이",
    url: "https://rss.mt.co.kr/st_news.xml",
    category: "news",
  },
  {
    id: "mk",
    name: "매일경제",
    url: "https://www.mk.co.kr/rss/50200011/",
    category: "news",
  },
  {
    id: "newsis",
    name: "뉴시스",
    url: "https://www.newsis.com/RSS/economy.xml",
    category: "news",
  },
  {
    id: "donga",
    name: "동아일보",
    url: "https://rss.donga.com/economy.xml",
    category: "news",
  },
];

// ─── 파싱 결과 타입 ─────────────────────────────────────────────

export interface RssNewsItem {
  title: string;
  summary: string | null;
  url: string | null;
  source: string;
  category: "news" | "disclosure";
  publishedAt: string | null;
}

// ─── XML 파서 ────────────────────────────────────────────────────

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  isArray: (name) => name === "item" || name === "entry",
});

function extractText(val: unknown): string {
  if (typeof val === "string") return val.trim();
  if (val && typeof val === "object" && "#text" in val)
    return String((val as Record<string, unknown>)["#text"]).trim();
  return String(val ?? "").trim();
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function parseDate(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    return new Date(raw).toISOString();
  } catch {
    return null;
  }
}

// ─── 단일 피드 파싱 ─────────────────────────────────────────────

function parseFeed(xml: string, source: RssSource): RssNewsItem[] {
  const parsed = parser.parse(xml);

  // RSS 2.0
  const rssItems = parsed?.rss?.channel?.item;
  if (rssItems) {
    return (Array.isArray(rssItems) ? rssItems : [rssItems]).map((item) => ({
      title: stripHtml(extractText(item.title)),
      summary: item.description ? stripHtml(extractText(item.description)).slice(0, 500) : null,
      url: extractText(item.link) || null,
      source: source.name,
      category: source.category,
      publishedAt: parseDate(extractText(item.pubDate)),
    }));
  }

  // Atom
  const atomEntries = parsed?.feed?.entry;
  if (atomEntries) {
    return (Array.isArray(atomEntries) ? atomEntries : [atomEntries]).map((entry) => ({
      title: stripHtml(extractText(entry.title)),
      summary: entry.summary ? stripHtml(extractText(entry.summary)).slice(0, 500) : null,
      url: entry.link?.["@_href"] || extractText(entry.link) || null,
      source: source.name,
      category: source.category,
      publishedAt: parseDate(extractText(entry.published || entry.updated)),
    }));
  }

  return [];
}

// ─── 공개 API ────────────────────────────────────────────────────

/**
 * 단일 RSS 소스에서 뉴스를 가져옵니다.
 */
export async function fetchRss(source: RssSource, timeout = 10_000): Promise<RssNewsItem[]> {
  try {
    const res = await fetch(source.url, {
      signal: AbortSignal.timeout(timeout),
      headers: { "User-Agent": "K-Gun/1.0 RSS Reader" },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseFeed(xml, source);
  } catch {
    console.error(`[rss-fetcher] ${source.name} 수집 실패`);
    return [];
  }
}

/**
 * 여러 RSS 소스에서 동시에 뉴스를 가져옵니다.
 * @param sourceIds 소스 ID 배열. 미지정 시 전체 소스.
 * @param limit 소스당 최대 개수
 */
export async function fetchAllRss(
  sourceIds?: string[],
  limit = 20,
): Promise<RssNewsItem[]> {
  const targets = sourceIds
    ? RSS_SOURCES.filter((s) => sourceIds.includes(s.id))
    : RSS_SOURCES;

  const results = await Promise.allSettled(targets.map((s) => fetchRss(s)));

  const items: RssNewsItem[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      items.push(...result.value.slice(0, limit));
    }
  }

  // 최신순 정렬
  items.sort((a, b) => {
    if (!a.publishedAt) return 1;
    if (!b.publishedAt) return -1;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  return items;
}
