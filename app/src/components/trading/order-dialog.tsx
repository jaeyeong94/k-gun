"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import type { Signal } from "@/types/signal";
import type { OrderAction } from "@/types/order";
import {
  useCurrentPrice,
  useBuyableQuantity,
  useOrderExecution,
} from "@/hooks/use-trading";

interface OrderDialogProps {
  signal: Signal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatNumber(n: number): string {
  return n.toLocaleString("ko-KR");
}

export function OrderDialog({ signal, open, onOpenChange }: OrderDialogProps) {
  const [quantity, setQuantity] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);

  const stockCode = signal?.stock_code ?? null;
  const action = (signal?.action ?? "BUY") as OrderAction;

  const priceQuery = useCurrentPrice(open ? stockCode : null);
  const buyableQuery = useBuyableQuantity(
    open && action === "BUY" ? stockCode : null,
  );
  const orderMutation = useOrderExecution();

  const currentPrice = priceQuery.data?.data?.current_price ?? signal?.price ?? 0;
  const buyableQty = buyableQuery.data?.data?.buyable_quantity ?? 0;
  const estimatedAmount = quantity * currentPrice;

  const maxQuantity = action === "BUY" ? buyableQty : 0;

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setQuantity(0);
      setSliderValue(0);
      orderMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const pct = Number(e.target.value);
      setSliderValue(pct);
      if (action === "BUY" && maxQuantity > 0) {
        setQuantity(Math.floor((maxQuantity * pct) / 100));
      }
    },
    [action, maxQuantity],
  );

  const handleQuantityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Math.max(0, Number(e.target.value) || 0);
      setQuantity(val);
      if (action === "BUY" && maxQuantity > 0) {
        setSliderValue(Math.min(100, Math.round((val / maxQuantity) * 100)));
      }
    },
    [action, maxQuantity],
  );

  const handleSubmit = useCallback(() => {
    if (!signal || quantity <= 0) return;
    orderMutation.mutate(
      {
        stock_code: signal.stock_code,
        stock_name: signal.stock_name,
        action,
        order_type: "market",
        price: currentPrice,
        quantity,
      },
      {
        onSuccess: () => {
          setTimeout(() => onOpenChange(false), 1500);
        },
      },
    );
  }, [signal, quantity, action, currentPrice, orderMutation, onOpenChange]);

  if (!signal) return null;

  const isBuy = action === "BUY";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge
              className={
                isBuy
                  ? "bg-red-500/15 text-red-500"
                  : "bg-blue-500/15 text-blue-500"
              }
            >
              {isBuy ? "매수" : "매도"}
            </Badge>
            <span>
              {signal.stock_name}{" "}
              <span className="text-sm text-muted-foreground font-normal">
                ({signal.stock_code})
              </span>
            </span>
          </DialogTitle>
          <DialogDescription>{signal.reason}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current price */}
          <div className="flex items-center justify-between">
            <Label>현재가</Label>
            {priceQuery.isLoading ? (
              <Skeleton className="h-5 w-24" />
            ) : (
              <span className="font-mono font-medium">
                {formatNumber(currentPrice)}원
              </span>
            )}
          </div>

          <Separator />

          {/* Buyable quantity (BUY only) */}
          {isBuy && (
            <div className="flex items-center justify-between">
              <Label>주문가능</Label>
              {buyableQuery.isLoading ? (
                <Skeleton className="h-5 w-16" />
              ) : (
                <span className="font-mono text-sm">
                  {formatNumber(buyableQty)}주
                </span>
              )}
            </div>
          )}

          {/* Quantity input */}
          <div className="space-y-2">
            <Label htmlFor="order-qty">주문수량</Label>
            <Input
              id="order-qty"
              type="number"
              min={0}
              max={isBuy ? maxQuantity : undefined}
              value={quantity || ""}
              onChange={handleQuantityChange}
              placeholder="수량 입력"
            />
          </div>

          {/* Slider (BUY only with maxQuantity) */}
          {isBuy && maxQuantity > 0 && (
            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={sliderValue}
                onChange={handleSliderChange}
                className="w-full accent-red-500"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
          )}

          <Separator />

          {/* Estimated amount */}
          <div className="flex items-center justify-between">
            <Label>예상금액</Label>
            <span className="font-mono font-medium text-lg">
              {formatNumber(estimatedAmount)}원
            </span>
          </div>

          {/* Success message */}
          {orderMutation.isSuccess && (
            <div className="rounded-lg bg-green-500/10 p-3 text-center text-sm text-green-500">
              주문이 정상적으로 접수되었습니다
            </div>
          )}

          {/* Error message */}
          {orderMutation.isError && (
            <div className="rounded-lg bg-destructive/10 p-3 text-center text-sm text-destructive">
              {orderMutation.error.message}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              quantity <= 0 || orderMutation.isPending || orderMutation.isSuccess
            }
            className={
              isBuy
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }
          >
            {orderMutation.isPending && (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            )}
            {isBuy ? "매수" : "매도"} 주문
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
