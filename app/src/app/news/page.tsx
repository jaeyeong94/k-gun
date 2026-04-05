import { db } from "@/lib/db";
import { newsCache } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { NewsClient } from "./news-client";

export default function NewsPage() {
  const news = db
    .select()
    .from(newsCache)
    .orderBy(desc(newsCache.publishedAt))
    .limit(100)
    .all();
  return <NewsClient initialNews={news} />;
}
