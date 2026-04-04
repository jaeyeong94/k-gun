"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Newspaper,
  BarChart3,
  Globe,
  Brain,
  Send,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNewsList, useAddNews } from "@/hooks/use-news";
import type { NewsItem } from "@/types/calendar";

const FEATURE_CARDS = [
  {
    icon: BarChart3,
    title: "종목별 뉴스",
    description: "관심 종목의 최신 뉴스를 실시간으로 확인합니다",
  },
  {
    icon: Globe,
    title: "시장 뉴스",
    description: "국내외 금융 시장의 주요 뉴스를 모아봅니다",
  },
  {
    icon: Brain,
    title: "감성 분석",
    description: "AI 기반 뉴스 감성 분석으로 시장 심리를 파악합니다",
  },
];

const SENTIMENT_CONFIG = {
  positive: {
    label: "긍정",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    icon: TrendingUp,
  },
  negative: {
    label: "부정",
    color: "text-red-400",
    bgColor: "bg-red-500/20",
    icon: TrendingDown,
  },
  neutral: {
    label: "중립",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    icon: Minus,
  },
};

export default function NewsPage() {
  const { data, isLoading } = useNewsList();
  const addNews = useAddNews();

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [stockCode, setStockCode] = useState("");
  const [sentiment, setSentiment] = useState<"positive" | "negative" | "neutral">("neutral");

  const newsList = data?.news ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addNews.mutate(
      {
        title: title.trim(),
        summary: summary.trim() || undefined,
        stockCode: stockCode.trim() || undefined,
        sentiment,
        source: "수동 입력",
      },
      {
        onSuccess: () => {
          setTitle("");
          setSummary("");
          setStockCode("");
          setSentiment("neutral");
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">뉴스</h1>
      </div>

      {/* Status banner */}
      <Card className="border-dashed">
        <CardContent className="flex items-center gap-3 py-4">
          <Newspaper className="size-5 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">
            뉴스 기능은 외부 데이터 소스 연동 후 사용 가능합니다.
            현재는 수동으로 뉴스 메모를 추가할 수 있습니다.
          </p>
        </CardContent>
      </Card>

      {/* Feature cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {FEATURE_CARDS.map((card) => (
          <Card key={card.title} className="border-dashed">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <card.icon className="size-4 text-muted-foreground" />
                <CardTitle className="text-sm">{card.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{card.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add news memo form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">뉴스 메모 추가</CardTitle>
          <CardDescription>
            수동으로 뉴스 메모를 추가하여 기록할 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="news-title">제목</Label>
              <Input
                id="news-title"
                placeholder="뉴스 제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="news-summary">요약 (선택)</Label>
              <Input
                id="news-summary"
                placeholder="뉴스 요약"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="news-stock">종목 코드 (선택)</Label>
                <Input
                  id="news-stock"
                  placeholder="005930"
                  value={stockCode}
                  onChange={(e) => setStockCode(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="news-sentiment">감성</Label>
                <select
                  id="news-sentiment"
                  value={sentiment}
                  onChange={(e) =>
                    setSentiment(
                      e.target.value as "positive" | "negative" | "neutral",
                    )
                  }
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="positive">긍정</option>
                  <option value="neutral">중립</option>
                  <option value="negative">부정</option>
                </select>
              </div>
            </div>
            <Button
              type="submit"
              disabled={addNews.isPending || !title.trim()}
              className="min-h-[44px]"
            >
              <Send className="size-4 mr-1" />
              {addNews.isPending ? "추가 중..." : "메모 추가"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* News list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">뉴스 메모 목록</CardTitle>
          <CardDescription>
            {newsList.length > 0
              ? `${newsList.length}개의 메모`
              : "아직 추가된 메모가 없습니다"}
          </CardDescription>
        </CardHeader>
        {newsList.length > 0 && (
          <CardContent className="space-y-3">
            {newsList.map((item) => {
              const sentimentConfig =
                SENTIMENT_CONFIG[item.sentiment ?? "neutral"];
              const SentimentIcon = sentimentConfig.icon;
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <Badge
                    className={`${sentimentConfig.bgColor} ${sentimentConfig.color} border-0 shrink-0`}
                  >
                    <SentimentIcon className="size-3 mr-0.5" />
                    {sentimentConfig.label}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm">{item.title}</div>
                    {item.summary && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {item.summary}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      {item.stockCode && <span>종목: {item.stockCode}</span>}
                      {item.source && <span>출처: {item.source}</span>}
                      <span>
                        {format(parseISO(item.createdAt), "MM/dd HH:mm", {
                          locale: ko,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        )}
        {isLoading && (
          <CardContent>
            <div className="text-sm text-muted-foreground">로딩 중...</div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
