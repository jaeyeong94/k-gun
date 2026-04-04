"use client";

import {
  AreaChart,
  Area,
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

interface DataPoint {
  date: string;
  equity: number;
  benchmark?: number;
}

function formatCurrency(value: number): string {
  if (value >= 1_0000_0000) {
    return `${(value / 1_0000_0000).toFixed(1)}억`;
  }
  if (value >= 1_0000) {
    return `${(value / 1_0000).toFixed(0)}만`;
  }
  return value.toLocaleString("ko-KR");
}

export function EquityChart({
  equityCurve,
  benchmarkCurve,
  initialCapital,
}: EquityChartProps) {
  const dates = Object.keys(equityCurve).sort();
  const data: DataPoint[] = dates.map((date) => {
    const point: DataPoint = {
      date,
      equity: equityCurve[date],
    };
    if (benchmarkCurve && date in benchmarkCurve) {
      point.benchmark = benchmarkCurve[date];
    }
    return point;
  });

  if (data.length === 0) {
    return null;
  }

  const lastEquity = data[data.length - 1].equity;
  const totalReturn = ((lastEquity - initialCapital) / initialCapital) * 100;
  const isProfit = totalReturn >= 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">자산 곡선</CardTitle>
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
            <AreaChart
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
                <linearGradient id="benchGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a3a3a3" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#a3a3a3" stopOpacity={0} />
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
                tickFormatter={formatCurrency}
                axisLine={false}
                tickLine={false}
                width={60}
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
                  `${Number(value).toLocaleString("ko-KR")}원`,
                  name === "equity" ? "전략" : "벤치마크",
                ]}
                labelFormatter={(label) => String(label)}
              />
              {benchmarkCurve && (
                <Area
                  type="monotone"
                  dataKey="benchmark"
                  stroke="#a3a3a3"
                  strokeWidth={1.5}
                  fill="url(#benchGrad)"
                  dot={false}
                  name="benchmark"
                />
              )}
              <Area
                type="monotone"
                dataKey="equity"
                stroke={isProfit ? "#ef4444" : "#3b82f6"}
                strokeWidth={2}
                fill="url(#equityGrad)"
                dot={false}
                name="equity"
              />
              {benchmarkCurve && <Legend formatter={(v) => (v === "equity" ? "전략" : "벤치마크")} />}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
