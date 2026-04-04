import { NextRequest, NextResponse } from "next/server";

// In-memory store for performance records (no DB dependency needed)
// In production this would be backed by SQLite/Drizzle strategyPerformance table
interface PerformanceRecord {
  id: number;
  strategyId: string;
  date: string;
  dailyReturn: number;
  cumulativeReturn: number;
  tradeCount: number;
  mode: "live" | "backtest";
  createdAt: string;
}

let records: PerformanceRecord[] = [];
let nextId = 1;

// Seed demo data
function seedDemoData() {
  if (records.length > 0) return;

  const strategies = [
    { id: "sma_crossover", name: "SMA 교차" },
    { id: "momentum", name: "모멘텀" },
    { id: "mean_reversion", name: "평균회귀" },
  ];

  const modes: Array<"live" | "backtest"> = ["live", "backtest"];

  for (const strategy of strategies) {
    for (const mode of modes) {
      let cumulative = 0;
      const baseDate = new Date("2025-01-02");
      const numDays = 60;

      for (let i = 0; i < numDays; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);
        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue;

        const dailyReturn =
          (Math.random() - 0.48) *
          (strategy.id === "momentum" ? 0.03 : 0.02) *
          (mode === "live" ? 0.8 : 1);
        cumulative += dailyReturn;

        records.push({
          id: nextId++,
          strategyId: strategy.id,
          date: date.toISOString().slice(0, 10),
          dailyReturn: Math.round(dailyReturn * 10000) / 10000,
          cumulativeReturn: Math.round(cumulative * 10000) / 10000,
          tradeCount: Math.floor(Math.random() * 5) + 1,
          mode,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }
}

seedDemoData();

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const strategyId = searchParams.get("strategyId");
  const mode = searchParams.get("mode") as "live" | "backtest" | null;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  let filtered = [...records];

  if (strategyId) {
    filtered = filtered.filter((r) => r.strategyId === strategyId);
  }
  if (mode) {
    filtered = filtered.filter((r) => r.mode === mode);
  }
  if (startDate) {
    filtered = filtered.filter((r) => r.date >= startDate);
  }
  if (endDate) {
    filtered = filtered.filter((r) => r.date <= endDate);
  }

  filtered.sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json(filtered);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { strategyId, date, dailyReturn, cumulativeReturn, tradeCount, mode } =
      body;

    if (!strategyId || !date || dailyReturn == null || !mode) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다" },
        { status: 400 },
      );
    }

    const record: PerformanceRecord = {
      id: nextId++,
      strategyId,
      date,
      dailyReturn,
      cumulativeReturn: cumulativeReturn ?? 0,
      tradeCount: tradeCount ?? 0,
      mode,
      createdAt: new Date().toISOString(),
    };

    records.push(record);

    return NextResponse.json(record, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청 형식입니다" },
      { status: 400 },
    );
  }
}
