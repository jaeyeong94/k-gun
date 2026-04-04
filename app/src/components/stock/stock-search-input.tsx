"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSymbolSearch, type SymbolSearchResult } from "@/hooks/use-explorer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";

const POPULAR_STOCKS = [
  { code: "005930", name: "삼성전자" },
  { code: "000660", name: "SK하이닉스" },
  { code: "035420", name: "네이버" },
  { code: "035720", name: "카카오" },
  { code: "005380", name: "현대차" },
  { code: "051910", name: "LG화학" },
];

interface StockSearchInputProps {
  value: string;
  onChange: (codes: string) => void;
  placeholder?: string;
  multiple?: boolean;
}

export function StockSearchInput({
  value,
  onChange,
  placeholder = "종목명 또는 코드 검색",
  multiple = true,
}: StockSearchInputProps) {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const { data: results, isLoading } = useSymbolSearch(query);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 선택된 종목 코드 배열
  const selectedCodes = value
    .split(/[,\s]+/)
    .map((c) => c.trim())
    .filter(Boolean);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addStock = useCallback(
    (code: string) => {
      if (multiple) {
        const codes = new Set(selectedCodes);
        codes.add(code);
        onChange([...codes].join(", "));
      } else {
        onChange(code);
      }
      setQuery("");
      setShowDropdown(false);
    },
    [multiple, selectedCodes, onChange],
  );

  const removeStock = useCallback(
    (code: string) => {
      const codes = selectedCodes.filter((c) => c !== code);
      onChange(codes.join(", "));
    },
    [selectedCodes, onChange],
  );

  return (
    <div ref={wrapperRef} className="space-y-2">
      {/* 선택된 종목 태그 */}
      {selectedCodes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedCodes.map((code) => {
            const stock = POPULAR_STOCKS.find((s) => s.code === code);
            return (
              <Badge
                key={code}
                variant="secondary"
                className="gap-1 pl-2 pr-1 py-0.5"
              >
                <span className="font-mono text-xs">{code}</span>
                {stock && (
                  <span className="text-xs text-muted-foreground">
                    {stock.name}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeStock(code)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* 검색 입력 */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          className="pl-8 h-8 text-sm"
        />

        {/* 검색 드롭다운 */}
        {showDropdown && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg">
            {/* 인기종목 */}
            {!query && (
              <div className="p-2">
                <div className="text-[10px] font-medium text-muted-foreground mb-1.5 px-1">
                  인기 종목
                </div>
                <div className="flex flex-wrap gap-1">
                  {POPULAR_STOCKS.map((stock) => (
                    <button
                      key={stock.code}
                      type="button"
                      onClick={() => addStock(stock.code)}
                      disabled={selectedCodes.includes(stock.code)}
                      className="rounded-md border px-2 py-1 text-xs transition-colors hover:bg-muted disabled:opacity-40"
                    >
                      {stock.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 검색 결과 */}
            {query && (
              <div className="max-h-48 overflow-y-auto p-1">
                {isLoading && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    검색 중...
                  </div>
                )}
                {!isLoading && results && results.length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    결과 없음
                  </div>
                )}
                {results?.map((r: SymbolSearchResult) => (
                  <button
                    key={r.code}
                    type="button"
                    onClick={() => addStock(r.code)}
                    disabled={selectedCodes.includes(r.code)}
                    className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-muted disabled:opacity-40"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {r.code}
                      </span>
                      <span>{r.name}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px]"
                    >
                      {r.exchange}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
