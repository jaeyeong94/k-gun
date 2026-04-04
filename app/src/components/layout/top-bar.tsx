"use client";

import { useAuthStore } from "@/stores/auth";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export function TopBar() {
  const { authenticated, mode, modeDisplay } = useAuthStore();

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      <div className="flex-1" />

      {authenticated ? (
        <Badge variant={mode === "prod" ? "destructive" : "secondary"}>
          {modeDisplay || (mode === "prod" ? "실전투자" : "모의투자")}
        </Badge>
      ) : (
        <Badge variant="outline" className="text-muted-foreground">
          미인증
        </Badge>
      )}
    </header>
  );
}
