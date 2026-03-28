"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chatWithDocument } from "@/actions/learn";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface DocumentChatProps {
  documentId: string;
  documentTitle: string;
  initialMessages: ChatMessage[];
  aiMessagesLimit: number;
  userMessageCount: number;
}

export function DocumentChat({
  documentId,
  documentTitle,
  initialMessages,
  aiMessagesLimit,
  userMessageCount: initialCount,
}: DocumentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [userMsgCount, setUserMsgCount] = useState(initialCount);
  const [limitReached, setLimitReached] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isLimited = aiMessagesLimit !== -1;
  const remaining = isLimited ? Math.max(0, aiMessagesLimit - userMsgCount) : -1;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || sending) return;

    if (isLimited && remaining <= 0) {
      setLimitReached(true);
      return;
    }

    setInput("");
    setSending(true);

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setUserMsgCount((c) => c + 1);

    try {
      const result = await chatWithDocument(documentId, msg);

      if (result.error) {
        if (result.tier) setLimitReached(true);
        setMessages((prev) => [
          ...prev,
          { id: `e-${Date.now()}`, role: "assistant", content: result.error! },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        { id: result.chatId || `a-${Date.now()}`, role: "assistant", content: result.reply! },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">AI Assistant</span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
          Ask about &ldquo;{documentTitle}&rdquo;
        </p>
        {isLimited && (
          <p className="text-[10px] text-muted-foreground mt-1">
            {remaining} message{remaining !== 1 ? "s" : ""} remaining
          </p>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-8">
            <Bot className="w-10 h-10 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">Ask a question about this document</p>
            <div className="flex flex-wrap gap-1.5 mt-2 max-w-xs justify-center">
              {["Summarize the key arguments", "What are the main holdings?", "Explain the reasoning"].map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-border/50 text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-2.5",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 text-foreground"
              )}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
            {msg.role === "user" && (
              <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {sending && (
          <div className="flex gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="bg-muted/60 rounded-xl px-3.5 py-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {limitReached ? (
        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-xl px-4 py-3">
            <Lock className="w-4 h-4 shrink-0" />
            <span>Message limit reached. <a href="/pricing" className="text-primary hover:underline font-medium">Upgrade</a> for more.</span>
          </div>
        </div>
      ) : (
        <div className="p-4 border-t border-border/50">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Ask about this document..."
              disabled={sending}
              className="flex-1 rounded-xl"
            />
            <Button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              size="icon"
              className="rounded-xl shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
