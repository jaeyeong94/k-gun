"use client";

import { useState, useCallback } from "react";
import { format } from "date-fns";
import {
  useJournalEntries,
  useJournalSummary,
  useCreateJournal,
  type CreateJournalInput,
  type JournalEntry,
} from "@/hooks/use-journal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from "lucide-react";

const TAG_OPTIONS = [
  "원칙준수",
  "좋은매매",
  "감정매매",
  "추세추종",
  "역추세",
  "손절",
  "익절",
  "스윙",
  "단타",
] as const;

function formatNumber(n: number): string {
  return n.toLocaleString("ko-KR");
}

function ActionBadge({ action }: { action: "BUY" | "SELL" }) {
  if (action === "BUY") {
    return (
      <Badge variant="destructive" className="font-mono text-xs">
        매수
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="font-mono text-xs text-blue-500">
      매도
    </Badge>
  );
}

function PnlText({ value }: { value: number }) {
  if (value > 0) {
    return (
      <span className="flex items-center gap-1 font-mono text-red-500">
        <ArrowUpRight className="size-3" />+{formatNumber(value)}원
      </span>
    );
  }
  if (value < 0) {
    return (
      <span className="flex items-center gap-1 font-mono text-blue-500">
        <ArrowDownRight className="size-3" />
        {formatNumber(value)}원
      </span>
    );
  }
  return <span className="font-mono text-muted-foreground">0원</span>;
}

function parseTags(tagsStr: string): string[] {
  try {
    return JSON.parse(tagsStr);
  } catch {
    return [];
  }
}

function JournalEntryCard({ entry }: { entry: JournalEntry }) {
  const tags = parseTags(entry.tags);

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{entry.date}</span>
          <ActionBadge action={entry.action} />
          <span className="font-medium">{entry.stockName}</span>
          <span className="text-xs text-muted-foreground">
            {entry.stockCode}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>
            {formatNumber(entry.price)}원 x {formatNumber(entry.quantity)}주
          </span>
          {entry.strategy && (
            <span className="text-xs">전략: {entry.strategy}</span>
          )}
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        {entry.reason && (
          <p className="text-xs text-muted-foreground">
            사유: {entry.reason}
          </p>
        )}
      </div>
      <div className="text-right">
        <PnlText value={entry.profitLoss ?? 0} />
        {entry.profitRate !== null && entry.profitRate !== 0 && (
          <span
            className={`block text-xs font-mono ${
              (entry.profitRate ?? 0) > 0
                ? "text-red-500"
                : (entry.profitRate ?? 0) < 0
                  ? "text-blue-500"
                  : "text-muted-foreground"
            }`}
          >
            {(entry.profitRate ?? 0) > 0 ? "+" : ""}
            {(entry.profitRate ?? 0).toFixed(2)}%
          </span>
        )}
      </div>
    </div>
  );
}

function CreateJournalDialog() {
  const createJournal = useCreateJournal();
  const [open, setOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setFormError(null);
      const formData = new FormData(e.currentTarget);

      const input: CreateJournalInput = {
        date: (formData.get("date") as string) || format(new Date(), "yyyy-MM-dd"),
        stockCode: formData.get("stockCode") as string,
        stockName: formData.get("stockName") as string,
        action: formData.get("action") as "BUY" | "SELL",
        strategy: (formData.get("strategy") as string) || undefined,
        price: Number(formData.get("price")),
        quantity: Number(formData.get("quantity")),
        profitLoss: Number(formData.get("profitLoss")) || 0,
        profitRate: Number(formData.get("profitRate")) || 0,
        reason: (formData.get("reason") as string) || undefined,
        tags: selectedTags,
        memo: (formData.get("memo") as string) || undefined,
      };

      if (!input.stockCode || !input.stockName || !input.price || !input.quantity) {
        setFormError("종목코드, 종목명, 가격, 수량은 필수입니다");
        return;
      }

      try {
        await createJournal.mutateAsync(input);
        setOpen(false);
        setSelectedTags([]);
      } catch {
        setFormError("저장에 실패했습니다. 다시 시도해주세요.");
      }
    },
    [selectedTags, createJournal],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-1 min-h-[44px]" nativeButton={false} />
        }
      >
        <Plus className="size-4" />
        매매 기록 추가
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>매매 기록 추가</DialogTitle>
          <DialogDescription>
            매매 내역을 기록하고 복기하세요
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="date">날짜</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={format(new Date(), "yyyy-MM-dd")}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="action">매매 구분</Label>
              <select
                id="action"
                name="action"
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                defaultValue="BUY"
              >
                <option value="BUY">매수</option>
                <option value="SELL">매도</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="stockCode">종목코드</Label>
              <Input
                id="stockCode"
                name="stockCode"
                placeholder="005930"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="stockName">종목명</Label>
              <Input
                id="stockName"
                name="stockName"
                placeholder="삼성전자"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="price">가격 (원)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                placeholder="70000"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="quantity">수량</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                placeholder="10"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="profitLoss">손익 (원)</Label>
              <Input
                id="profitLoss"
                name="profitLoss"
                type="number"
                placeholder="0"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="profitRate">수익률 (%)</Label>
              <Input
                id="profitRate"
                name="profitRate"
                type="number"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="strategy">전략</Label>
            <Input
              id="strategy"
              name="strategy"
              placeholder="이동평균 돌파"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="reason">매매 사유</Label>
            <Input
              id="reason"
              name="reason"
              placeholder="20일선 지지 후 반등 확인"
            />
          </div>

          <div className="space-y-1">
            <Label>태그</Label>
            <div className="flex flex-wrap gap-1.5">
              {TAG_OPTIONS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                    selectedTags.includes(tag)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="memo">메모</Label>
            <Input id="memo" name="memo" placeholder="추가 메모..." />
          </div>

          {formError && (
            <p className="text-sm text-destructive">{formError}</p>
          )}

          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" nativeButton={false} />}
            >
              취소
            </DialogClose>
            <Button type="submit" disabled={createJournal.isPending}>
              {createJournal.isPending ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function JournalPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterTag, setFilterTag] = useState<string>("");

  const entries = useJournalEntries(
    filterDate || undefined,
    filterTag || undefined,
  );
  const summary = useJournalSummary(
    filterDate || undefined,
    filterDate || undefined,
  );

  const entryList = entries.data?.data ?? [];
  const summaryData = summary.data?.data;
  const isLoading = entries.isLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
          <BookOpen className="size-6" />
          매매 저널
        </h1>
        <CreateJournalDialog />
      </div>

      {/* Daily Summary */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              총 거래
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono">
              {summaryData?.totalTrades ?? 0}건
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              실현 손익
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-xl font-bold font-mono ${
                (summaryData?.totalPnl ?? 0) > 0
                  ? "text-red-500"
                  : (summaryData?.totalPnl ?? 0) < 0
                    ? "text-blue-500"
                    : ""
              }`}
            >
              {(summaryData?.totalPnl ?? 0) > 0 ? "+" : ""}
              {formatNumber(summaryData?.totalPnl ?? 0)}원
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              승률
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono">
              {summaryData?.winRate ?? 0}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              승/패
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xl font-bold font-mono">
              <span className="text-red-500">
                <TrendingUp className="inline size-4" />{" "}
                {summaryData?.winCount ?? 0}
              </span>
              <span className="text-muted-foreground">/</span>
              <span className="text-blue-500">
                <TrendingDown className="inline size-4" />{" "}
                {summaryData?.lossCount ?? 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">필터</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Calendar className="size-4 text-muted-foreground" />
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-auto"
            />
            {filterDate && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setFilterDate("")}
              >
                초기화
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilterTag("")}
              className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                !filterTag
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-muted"
              }`}
            >
              전체
            </button>
            {TAG_OPTIONS.map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag(filterTag === tag ? "" : tag)}
                className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                  filterTag === tag
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-muted"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Entry List */}
      <Card>
        <CardHeader>
          <CardTitle>매매 기록</CardTitle>
          <CardDescription>
            {entryList.length > 0
              ? `${entryList.length}건의 기록`
              : "기록이 없습니다"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : entryList.length > 0 ? (
            <div className="space-y-2">
              {entryList.map((entry) => (
                <JournalEntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              매매 기록이 없습니다. 위의 &quot;매매 기록 추가&quot; 버튼으로
              기록을 시작하세요.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
