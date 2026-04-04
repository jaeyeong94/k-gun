"use client";

import { useEffect, useRef } from "react";
import { Bot, Loader2 } from "lucide-react";
import { useChatStore } from "@/stores/chat";
import { ChatMessageBubble } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";

export default function ChatPage() {
  const { messages, isLoading, sendMessage } = useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center gap-2">
        <Bot className="size-6 text-primary" />
        <h1 className="text-xl font-bold">AI 어시스턴트</h1>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-border bg-card/30 p-4"
      >
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <Bot className="size-12 opacity-30" />
            <p className="text-sm">
              AI 어시스턴트에게 질문해 보세요.
            </p>
            <p className="text-xs text-muted-foreground/60">
              아래 빠른 액션을 사용하거나 직접 메시지를 입력하세요.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessageBubble key={msg.id} message={msg} />
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span>응답을 생성하고 있습니다...</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4">
        <ChatInput onSend={sendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
