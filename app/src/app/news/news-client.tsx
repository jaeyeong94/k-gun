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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Newspaper, Plus, Globe, TrendingUp, Brain } from "lucide-react";

interface NewsItem {
  id: number;
  stockCode: string | null;
  title: string;
  summary: string | null;
  source: string | null;
  sentiment: string | null;
  cachedAt: string | null;
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "bg-red-500/20 text-red-400",
  negative: "bg-blue-500/20 text-blue-400",
  neutral: "bg-gray-500/20 text-gray-400",
};

export function NewsClient({ initialNews }: { initialNews: NewsItem[] }) {
  const [newsList, setNewsList] = useState<NewsItem[]>(initialNews);
  const [showForm, setShowForm] = useState(false);

  const handleAdd = useCallback(async (formData: FormData) => {
    const body = {
      title: formData.get("title") as string,
      summary: (formData.get("summary") as string) || undefined,
      stockCode: (formData.get("stockCode") as string) || undefined,
      sentiment: (formData.get("sentiment") as string) || undefined,
    };

    const res = await fetch("/api/news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.data) {
        setNewsList((prev) => [data.data, ...prev]);
      }
      setShowForm(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="size-6" />
          <h1 className="text-2xl font-bold">뉴스</h1>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="mr-1.5 size-4" />
          메모 추가
        </Button>
      </div>

      {/* Status banner */}
      <Card className="border-dashed">
        <CardContent className="flex items-center gap-3 py-4">
          <Globe className="size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            뉴스 기능은 외부 데이터 소스 연동 후 사용 가능합니다. 현재는 메모
            기능만 지원됩니다.
          </p>
        </CardContent>
      </Card>

      {/* Feature cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: Newspaper, title: "종목별 뉴스", desc: "보유종목/워치리스트 관련 뉴스" },
          { icon: TrendingUp, title: "시장 뉴스", desc: "주요 시장 뉴스 피드" },
          { icon: Brain, title: "감성 분석", desc: "AI 기반 뉴스 감성 분석" },
        ].map(({ icon: Icon, title, desc }) => (
          <Card key={title} className="border-dashed">
            <CardHeader className="pb-2">
              <Icon className="size-8 text-muted-foreground/40" />
            </CardHeader>
            <CardContent>
              <div className="font-medium text-sm">{title}</div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">뉴스 메모 추가</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAdd(new FormData(e.currentTarget));
              }}
              className="space-y-3"
            >
              <div className="space-y-1">
                <Label>제목</Label>
                <Input name="title" required />
              </div>
              <div className="space-y-1">
                <Label>요약</Label>
                <Input name="summary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>종목코드</Label>
                  <Input name="stockCode" placeholder="005930" />
                </div>
                <div className="space-y-1">
                  <Label>감성</Label>
                  <select
                    name="sentiment"
                    className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                  >
                    <option value="">선택</option>
                    <option value="positive">긍정</option>
                    <option value="negative">부정</option>
                    <option value="neutral">중립</option>
                  </select>
                </div>
              </div>
              <Button type="submit" className="w-full">
                추가
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* News list */}
      {newsList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">뉴스 메모</CardTitle>
            <CardDescription>{newsList.length}개</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {newsList.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between rounded-lg border p-3"
              >
                <div>
                  <div className="font-medium text-sm">{item.title}</div>
                  {item.summary && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {item.summary}
                    </div>
                  )}
                  {item.stockCode && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {item.stockCode}
                    </span>
                  )}
                </div>
                {item.sentiment && (
                  <Badge className={SENTIMENT_COLORS[item.sentiment] ?? ""}>
                    {item.sentiment === "positive"
                      ? "긍정"
                      : item.sentiment === "negative"
                        ? "부정"
                        : "중립"}
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
