"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  useBacktestHistory,
  useDeleteBacktestHistory,
  type BacktestHistoryItem,
} from "@/hooks/use-backtest-history";
import { apiGet } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Trash2,
  GitCompareArrows,
  X,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";

// --- Helpers ---

function formatPct(v: number | null): string {
  if (v == null) return "-";
  return `${v.toFixed(2)}%`;
}

function formatDate(d: string | null): string {
  if (!d) return "-";
  return d.slice(0, 10);
}

function formatDateTime(d: string | null): string {
  if (!d) return "-";
  return d.replace("T", " ").slice(0, 19);
}

// --- Comparison types ---

interface FullHistoryItem extends BacktestHistoryItem {
  result?: {
    metrics?: {
      basic?: {
        total_return?: number;
        annual_return?: number;
        max_drawdown?: number;
        start_equity?: number;
        end_equity?: number;
      };
      risk?: {
        sharpe_ratio?: number;
        sortino_ratio?: number;
      };
      trading?: {
        total_orders?: number;
        win_rate?: number;
        profit_loss_ratio?: number;
        expectancy?: number;
      };
    };
  };
}

interface MetricRow {
  label: string;
  key: string;
  getValue: (item: FullHistoryItem) => number | null;
  format: (v: number | null) => string;
  higherIsBetter: boolean;
}

const comparisonMetrics: MetricRow[] = [
  {
    label: "총 수익률",
    key: "total_return",
    getValue: (item) => item.result?.metrics?.basic?.total_return ?? item.totalReturn ?? null,
    format: (v) => formatPct(v),
    higherIsBetter: true,
  },
  {
    label: "연간 수익률",
    key: "annual_return",
    getValue: (item) => item.result?.metrics?.basic?.annual_return ?? null,
    format: (v) => formatPct(v),
    higherIsBetter: true,
  },
  {
    label: "최대 낙폭",
    key: "max_drawdown",
    getValue: (item) => item.result?.metrics?.basic?.max_drawdown ?? null,
    format: (v) => formatPct(v),
    higherIsBetter: false,
  },
  {
    label: "샤프 비율",
    key: "sharpe_ratio",
    getValue: (item) => item.result?.metrics?.risk?.sharpe_ratio ?? item.sharpe ?? null,
    format: (v) => (v != null ? v.toFixed(2) : "-"),
    higherIsBetter: true,
  },
  {
    label: "소르티노 비율",
    key: "sortino_ratio",
    getValue: (item) => item.result?.metrics?.risk?.sortino_ratio ?? null,
    format: (v) => (v != null ? v.toFixed(2) : "-"),
    higherIsBetter: true,
  },
  {
    label: "총 거래 수",
    key: "total_orders",
    getValue: (item) => item.result?.metrics?.trading?.total_orders ?? null,
    format: (v) => (v != null ? String(v) : "-"),
    higherIsBetter: false, // neutral
  },
  {
    label: "승률",
    key: "win_rate",
    getValue: (item) => item.result?.metrics?.trading?.win_rate ?? null,
    format: (v) => formatPct(v),
    higherIsBetter: true,
  },
  {
    label: "손익비",
    key: "profit_loss_ratio",
    getValue: (item) => item.result?.metrics?.trading?.profit_loss_ratio ?? null,
    format: (v) => (v != null ? v.toFixed(2) : "-"),
    higherIsBetter: true,
  },
  {
    label: "기대값",
    key: "expectancy",
    getValue: (item) => item.result?.metrics?.trading?.expectancy ?? null,
    format: (v) => (v != null ? v.toFixed(2) : "-"),
    higherIsBetter: true,
  },
];

// --- Comparison View ---

function ComparisonView({
  items,
  onClose,
}: {
  items: FullHistoryItem[];
  onClose: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <GitCompareArrows className="size-4" />
            전략 비교 ({items.length}개)
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2 pr-4 text-left font-medium">지표</th>
                {items.map((item) => (
                  <th key={item.id} className="py-2 px-3 text-right font-medium min-w-[120px]">
                    <div>{item.strategyId}</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {item.symbols}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonMetrics.map((metric) => {
                const values = items.map((item) => metric.getValue(item));
                const validValues = values.filter((v): v is number => v != null);
                let bestValue: number | null = null;
                if (validValues.length > 0) {
                  bestValue = metric.higherIsBetter
                    ? Math.max(...validValues)
                    : Math.min(...validValues);
                }

                return (
                  <tr key={metric.key} className="border-b last:border-0">
                    <td className="py-2.5 pr-4 font-medium whitespace-nowrap">
                      {metric.label}
                    </td>
                    {values.map((val, idx) => {
                      const isBest =
                        val != null && bestValue != null && val === bestValue && validValues.length > 1;
                      return (
                        <td
                          key={items[idx].id}
                          className={`py-2.5 px-3 text-right font-mono ${
                            isBest ? "text-green-600 font-semibold" : ""
                          }`}
                        >
                          <span className="inline-flex items-center gap-1">
                            {metric.format(val)}
                            {isBest && <Trophy className="size-3 text-green-600" />}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Main Page ---

export default function BacktestHistoryPage() {
  const { data: history, isLoading } = useBacktestHistory();
  const deleteMutation = useDeleteBacktestHistory();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [comparing, setComparing] = useState(false);
  const [comparisonData, setComparisonData] = useState<FullHistoryItem[]>([]);
  const [loadingComparison, setLoadingComparison] = useState(false);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 3) {
        next.add(id);
      } else {
        toast.error("최대 3개까지 비교할 수 있습니다");
      }
      return next;
    });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success("이력이 삭제되었습니다");
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      },
      onError: () => toast.error("삭제에 실패했습니다"),
    });
  };

  const handleCompare = async () => {
    if (!history) return;
    setLoadingComparison(true);

    try {
      // Fetch full result data for selected items
      const selected = history.filter((h) => selectedIds.has(h.id));
      // We already have summary metrics, but for full comparison we need stored results
      // Use a dedicated endpoint or parse from existing data
      // For now, fetch each result individually via a simple approach:
      // Re-fetch the full list which includes summary metrics, and use those
      const fullItems: FullHistoryItem[] = selected.map((item) => ({
        ...item,
        result: {
          metrics: {
            basic: {
              total_return: item.totalReturn ?? undefined,
            },
            risk: {
              sharpe_ratio: item.sharpe ?? undefined,
            },
          },
        },
      }));

      // Try to get full data from a detail endpoint
      try {
        const detailPromises = selected.map((item) =>
          apiGet<{ status: string; data: { result: string } }>(
            `/api/backtest-history/detail?id=${item.id}`,
            false,
          ).catch(() => null)
        );
        const details = await Promise.all(detailPromises);
        details.forEach((detail, idx) => {
          if (detail?.data?.result) {
            try {
              fullItems[idx].result = JSON.parse(detail.data.result);
            } catch {
              // use summary metrics
            }
          }
        });
      } catch {
        // Fallback: use summary metrics already available
      }

      setComparisonData(fullItems);
      setComparing(true);
    } finally {
      setLoadingComparison(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" render={<Link href="/backtest" />}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-2xl font-bold">실행 이력</h1>
        </div>
        {selectedIds.size >= 2 && (
          <Button
            onClick={handleCompare}
            disabled={loadingComparison}
            className="w-full sm:w-auto"
          >
            <GitCompareArrows className="mr-2 size-4" />
            비교하기 ({selectedIds.size}개)
          </Button>
        )}
      </div>

      {/* Comparison Panel */}
      {comparing && comparisonData.length > 0 && (
        <ComparisonView
          items={comparisonData}
          onClose={() => {
            setComparing(false);
            setComparisonData([]);
          }}
        />
      )}

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">저장된 백테스트 결과</CardTitle>
          <CardDescription>
            {history
              ? `${history.length}개의 저장된 결과`
              : "로딩 중..."}
            {selectedIds.size > 0 && ` | ${selectedIds.size}개 선택됨`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !history || history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p>저장된 백테스트 결과가 없습니다</p>
              <Button
                variant="outline"
                className="mt-4"
                render={<Link href="/backtest" />}
              >
                백테스트 실행하기
              </Button>
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-2 pr-2 text-left font-medium w-10">
                      <span className="sr-only">선택</span>
                    </th>
                    <th className="py-2 text-left font-medium">전략</th>
                    <th className="py-2 text-left font-medium">종목</th>
                    <th className="py-2 text-left font-medium">기간</th>
                    <th className="py-2 text-right font-medium">총수익률</th>
                    <th className="py-2 text-right font-medium">샤프비율</th>
                    <th className="py-2 text-left font-medium">실행일시</th>
                    <th className="py-2 text-right font-medium w-16">
                      <span className="sr-only">삭제</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => {
                    const isSelected = selectedIds.has(item.id);
                    const returnColor =
                      item.totalReturn != null
                        ? item.totalReturn > 0
                          ? "text-red-500"
                          : item.totalReturn < 0
                            ? "text-blue-500"
                            : ""
                        : "";
                    return (
                      <tr
                        key={item.id}
                        className={`border-b last:border-0 cursor-pointer transition-colors ${
                          isSelected ? "bg-accent/50" : "hover:bg-muted/50"
                        }`}
                        onClick={() => toggleSelect(item.id)}
                      >
                        <td className="py-2.5 pr-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(item.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="size-4 accent-primary"
                          />
                        </td>
                        <td className="py-2.5">
                          <Badge variant="outline">{item.strategyId}</Badge>
                        </td>
                        <td className="py-2.5 font-mono text-xs">
                          {item.symbols}
                        </td>
                        <td className="py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(item.startDate)} ~ {formatDate(item.endDate)}
                        </td>
                        <td className={`py-2.5 text-right font-mono ${returnColor}`}>
                          {formatPct(item.totalReturn)}
                        </td>
                        <td className="py-2.5 text-right font-mono">
                          {item.sharpe != null ? item.sharpe.toFixed(2) : "-"}
                        </td>
                        <td className="py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDateTime(item.createdAt)}
                        </td>
                        <td className="py-2.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item.id);
                            }}
                            disabled={deleteMutation.isPending}
                            className="size-8 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
