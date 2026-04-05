"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Newspaper, RefreshCw, ExternalLink } from "lucide-react";

interface NewsItem {
  id: number;
  stockCode: string | null;
  title: string;
  summary: string | null;
  source: string | null;
  url: string | null;
  sentiment: string | null;
  publishedAt: string | null;
  cachedAt: string | null;
}

const SOURCE_COLORS: Record<string, string> = {
  한국경제: "bg-orange-500/20 text-orange-400",
  머니투데이: "bg-green-500/20 text-green-400",
  매일경제: "bg-purple-500/20 text-purple-400",
  뉴시스: "bg-blue-500/20 text-blue-400",
  동아일보: "bg-cyan-500/20 text-cyan-400",
};

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function NewsClient({ initialNews }: { initialNews: NewsItem[] }) {
  const [newsList, setNewsList] = useState<NewsItem[]>(initialNews);
  const [isFetching, setIsFetching] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const fetchRss = useCallback(async () => {
    setIsFetching(true);
    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fetch-rss" }),
      });
      if (!res.ok) return;

      // 새로고침
      const listRes = await fetch("/api/news");
      if (listRes.ok) {
        const data = await listRes.json();
        setNewsList(data.news);
      }
    } finally {
      setIsFetching(false);
    }
  }, []);

  const allSources = [...new Set(newsList.map((n) => n.source).filter(Boolean))] as string[];
  const filtered =
    filter === "all"
      ? newsList
      : newsList.filter((n) => n.source === filter);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="size-6" />
          <h1 className="text-2xl font-bold">뉴스</h1>
          <Badge variant="outline" className="text-xs">
            {newsList.length}건
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchRss}
          disabled={isFetching}
        >
          <RefreshCw
            className={`mr-1.5 size-4 ${isFetching ? "animate-spin" : ""}`}
          />
          {isFetching ? "수집 중..." : "RSS 새로고침"}
        </Button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-1.5">
        {["all", ...allSources].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              filter === f
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-muted"
            }`}
          >
            {f === "all" ? "전체" : f}
          </button>
        ))}
      </div>

      {/* News list */}
      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((item) => (
            <Card key={item.id} className="group">
              <CardContent className="flex items-start gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {item.source && (
                      <Badge
                        className={`text-[10px] ${SOURCE_COLORS[item.source] ?? "bg-gray-500/20 text-gray-400"}`}
                      >
                        {item.source}
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {formatTime(item.publishedAt)}
                    </span>
                  </div>
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-sm hover:underline inline-flex items-center gap-1"
                    >
                      {item.title}
                      <ExternalLink className="size-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                    </a>
                  ) : (
                    <div className="font-medium text-sm">{item.title}</div>
                  )}
                  {item.summary && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {item.summary}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Newspaper className="size-12 text-muted-foreground/30" />
            <div className="text-center">
              <p className="font-medium text-muted-foreground">
                뉴스가 없습니다
              </p>
              <p className="mt-1 text-sm text-muted-foreground/70">
                &quot;RSS 새로고침&quot; 버튼을 눌러 최신 뉴스를 수집하세요
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
