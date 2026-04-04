import { db } from "@/lib/db";
import { marketEvents } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { CalendarClient } from "./calendar-client";

export default function CalendarPage() {
  const events = db.select().from(marketEvents).orderBy(desc(marketEvents.date)).all();
  return <CalendarClient initialEvents={events} />;
}
