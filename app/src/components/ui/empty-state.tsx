import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import Link from "next/link";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-16">
        <Icon className="size-12 text-muted-foreground/30" />
        <div className="text-center">
          <p className="font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground/70">{description}</p>
        </div>
        {actionLabel && actionHref && (
          <Button variant="outline" size="sm" render={<Link href={actionHref} />} nativeButton={false}>
            {actionLabel}
          </Button>
        )}
        {actionLabel && onAction && !actionHref && (
          <Button variant="outline" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
