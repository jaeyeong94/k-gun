import { Loader2 } from "lucide-react";

export function PageLoading({ text = "로딩 중..." }: { text?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
