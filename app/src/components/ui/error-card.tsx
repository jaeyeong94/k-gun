import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

interface ErrorCardProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorCard({
  message = "오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
  onRetry,
}: ErrorCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-12">
        <AlertCircle className="size-10 text-destructive/60" />
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          {message}
        </p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            다시 시도
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
