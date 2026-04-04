import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { StatusBar } from "@/components/layout/status-bar";
import { ThemeInitializer } from "@/components/layout/theme-initializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "투깨비 | 트레이딩 컨트롤패널",
  description: "한국투자증권 Open API 기반 통합 트레이딩 컨트롤패널",
  icons: {
    icon: "/kgun-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex h-full flex-col" suppressHydrationWarning>
        <ThemeInitializer />
        <Providers>
          <AppSidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-y-auto p-3 sm:p-4">{children}</main>
            <StatusBar />
          </div>
        </Providers>
      </body>
    </html>
  );
}
