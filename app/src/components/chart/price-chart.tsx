"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface PriceDataPoint {
  date: string;
  price: number;
  volume: number;
}

function generateMockData(
  stockCode: string,
  days: number = 60,
): PriceDataPoint[] {
  // Seed-like deterministic random based on stockCode
  let seed = 0;
  for (let i = 0; i < stockCode.length; i++) {
    seed = seed * 31 + stockCode.charCodeAt(i);
  }
  const random = () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed & 0x7fffffff) / 0x7fffffff;
  };

  const basePrice = 10000 + Math.floor(random() * 90000);
  const data: PriceDataPoint[] = [];
  let price = basePrice;

  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Skip weekends
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue;

    const changePercent = (random() - 0.48) * 0.04; // slight upward bias
    price = Math.max(1000, Math.round(price * (1 + changePercent)));
    const volume = Math.round(50000 + random() * 500000);

    data.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      price,
      volume,
    });
  }

  return data;
}

function formatPrice(value: number): string {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}만`;
  }
  return value.toLocaleString("ko-KR");
}

interface PriceChartProps {
  stockCode: string;
  stockName: string;
  days?: number;
}

export function PriceChart({
  stockCode,
  stockName,
  days = 60,
}: PriceChartProps) {
  const data = useMemo(
    () => generateMockData(stockCode, days),
    [stockCode, days],
  );

  const prices = data.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const padding = Math.round((maxPrice - minPrice) * 0.1);

  const firstPrice = data[0]?.price ?? 0;
  const lastPrice = data[data.length - 1]?.price ?? 0;
  const changeRate = firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;
  const isPositive = changeRate >= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="size-4" />
          {stockName} 가격 추이
          <span className="text-sm font-normal text-muted-foreground">
            {stockCode}
          </span>
        </CardTitle>
        <CardDescription>
          최근 {days}일 (모의 데이터) &middot;{" "}
          <span className={isPositive ? "text-red-500" : "text-blue-500"}>
            {isPositive ? "+" : ""}
            {changeRate.toFixed(2)}%
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`gradient-${stockCode}`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={isPositive ? "#ef4444" : "#3b82f6"}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={isPositive ? "#ef4444" : "#3b82f6"}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.5}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[minPrice - padding, maxPrice + padding]}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatPrice}
                width={52}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "hsl(var(--popover-foreground))",
                }}
                formatter={(value) => [
                  `${Number(value).toLocaleString("ko-KR")}원`,
                  "가격",
                ]}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={isPositive ? "#ef4444" : "#3b82f6"}
                strokeWidth={1.5}
                fill={`url(#gradient-${stockCode})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
