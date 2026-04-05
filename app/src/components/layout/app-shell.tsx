"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "./app-sidebar";
import { TopBar } from "./top-bar";
import { StatusBar } from "./status-bar";

const NO_SHELL_ROUTES = ["/login"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideShell = NO_SHELL_ROUTES.some((route) => pathname.startsWith(route));

  if (hideShell) {
    return <>{children}</>;
  }

  return (
    <>
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4">{children}</main>
        <StatusBar />
      </div>
    </>
  );
}
