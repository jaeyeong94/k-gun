"use client";

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface EquityChartProps {
  equityCurve: Record<string, number>;
  benchmarkCurve?: Record<string, number>;
  initialCapital: number;
}

interface NormalizedDataPoint {
  date: string;
  equity: number;
  benchmark?: number;
}

export function EquityChart({
  equityCurve,
  benchmarkCurve,
  initialCapital,
}: EquityChartProps) {
  const dates = Object.keys(equityCurve).sort();

  if (dates.length === 0) {
    return null;
  }

  // Normalize both curves to start at 100 for fair comparison
  const firstEquity = equityCurve[dates[0]];
  const hasBenchmark = !!benchmarkCurve;
  const benchDates = hasBenchmark ? Object.keys(benchmarkCurve).sort() : [];
  const firstBenchmark = hasBenchmark && benchDates.length > 0 ? benchmarkCurve[benchDates[0]] : 1;

  const data: NormalizedDataPoint[] = dates.map((date) => {
    const point: NormalizedDataPoint = {
      date,
      equity: (equityCurve[date] / firstEquity) * 100,
    };
    if (hasBenchmark && date in benchmarkCurve) {
      point.benchmark = (benchmarkCurve[date] / firstBenchmark) * 100;
    }
    return point;
  });

  const lastEquity = data[data.length - 1].equity;
  const totalReturn = ((equityCurve[dates[dates.length - 1]] - initialCapital) / initialCapital) * 100;
  const isProfit = totalReturn >= 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">자산 곡선 (정규화)</CardTitle>
        <span
          className={`text-sm font-medium ${isProfit ? "text-red-500" : "text-blue-500"}`}
        >
          {isProfit ? "+" : ""}
          {totalReturn.toFixed(2)}%
        </span>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={isProfit ? "#ef4444" : "#3b82f6"}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={isProfit ? "#ef4444" : "#3b82f6"}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#a3a3a3" }}
                tickFormatter={(v) => String(v).slice(5)}
                interval="preserveStartEnd"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#a3a3a3" }}
                tickFormatter={(v) => `${Number(v).toFixed(0)}`}
                axisLine={false}
                tickLine={false}
                width={45}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: 12,
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value, name) => [
                  `${Number(value).toFixed(2)}`,
                  name === "equity" ? "전략" : "코스피",
                ]}
                labelFormatter={(label) => String(label)}
              />
              <Area
                type="monotone"
                dataKey="equity"
                stroke={isProfit ? "#ef4444" : "#3b82f6"}
                strokeWidth={2}
                fill="url(#equityGrad)"
                dot={false}
                name="equity"
              />
              {hasBenchmark && (
                <Line
                  type="monotone"
                  dataKey="benchmark"
                  stroke="#a3a3a3"
                  strokeWidth={1.5}
                  strokeDasharray="6 3"
                  dot={false}
                  name="benchmark"
                />
              )}
              <Legend
                formatter={(v: string) => (v === "equity" ? "전략" : "코스피")}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
