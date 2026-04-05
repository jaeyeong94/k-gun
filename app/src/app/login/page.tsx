"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { authenticated, isLoading, error, login, checkStatus } =
    useAuthStore();

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    if (authenticated) {
      router.replace("/dashboard");
    }
  }, [authenticated, router]);

  if (authenticated) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <img
            src="/kgun-logo.svg"
            alt="투깨비"
            className="h-20 w-20 rounded-2xl"
          />
          <div className="text-center">
            <h1 className="text-3xl font-bold">투깨비</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              한국투자증권 Open API 트레이딩 컨트롤패널
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle>로그인</CardTitle>
            <CardDescription>
              KIS API 인증으로 시작합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button
              onClick={() => login("vps")}
              disabled={isLoading}
              className="w-full min-h-[48px] text-base"
            >
              <LogIn className="mr-2 size-5" />
              {isLoading ? "인증 중..." : "모의투자 로그인"}
            </Button>
            <Button
              onClick={() => login("prod")}
              disabled={isLoading}
              variant="destructive"
              className="w-full min-h-[48px] text-base"
            >
              <LogIn className="mr-2 size-5" />
              {isLoading ? "인증 중..." : "실전투자 로그인"}
            </Button>

            {error && (
              <p className="text-sm text-destructive text-center mt-2">
                {error}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <p className="text-center text-[11px] text-muted-foreground/60">
          본 서비스는 투자 권유가 아니며, 투자 책임은 본인에게 있습니다.
        </p>
      </div>
    </div>
  );
}
