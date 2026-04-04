import { PresetsClient } from "./presets-client";

const strategyHost = process.env.STRATEGY_API_HOST ?? "localhost";

async function getStrategies() {
  try {
    const res = await fetch(`http://${strategyHost}:8000/api/strategies`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.strategies ?? [];
  } catch {
    return [];
  }
}

export default async function PresetsPage() {
  const strategies = await getStrategies();
  return <PresetsClient strategies={strategies} />;
}
