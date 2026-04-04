"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Blocks,
  FlaskConical,
  TrendingUp,
  Search,
  Star,
  PieChart,
  Shield,
  LineChart,
  BookOpen,
  MessageSquare,
  Calculator,
  CalendarDays,
  Newspaper,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

const menuGroups = [
  {
    label: "메인",
    items: [
      { title: "대시보드", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "트레이딩",
    items: [
      { title: "전략 빌더", href: "/strategy", icon: Blocks },
      { title: "백테스트", href: "/backtest", icon: FlaskConical },
      { title: "트레이딩", href: "/trading", icon: TrendingUp },
      { title: "종목 탐색", href: "/explorer", icon: Search },
      { title: "워치리스트", href: "/watchlist", icon: Star },
    ],
  },
  {
    label: "분석",
    items: [
      { title: "포트폴리오", href: "/portfolio", icon: PieChart },
      { title: "리스크", href: "/risk", icon: Shield },
      { title: "성과 추적", href: "/performance", icon: LineChart },
      { title: "매매 저널", href: "/journal", icon: BookOpen },
    ],
  },
  {
    label: "도구",
    items: [
      { title: "AI 챗봇", href: "/chat", icon: MessageSquare },
      { title: "포지션 계산기", href: "/tools", icon: Calculator },
      { title: "시장 캘린더", href: "/calendar", icon: CalendarDays },
      { title: "뉴스", href: "/news", icon: Newspaper },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <img
            src="/kgun-logo.svg"
            alt="K-Gun"
            className="h-10 w-10"
          />
          <div>
            <div className="font-bold text-base">K-Gun</div>
            <div className="text-[10px] text-muted-foreground">
              Trading Control Panel
            </div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={pathname.startsWith(item.href)}
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/settings" />}
              isActive={pathname.startsWith("/settings")}
            >
              <Settings className="size-4" />
              <span>설정</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
