"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, MessageCircle, RotateCcw, Sparkles, X } from "lucide-react";
import ChatInput from "@/components/chat/ChatInput";
import ChatMessage, { type ChatMessageData } from "@/components/chat/ChatMessage";

const STORAGE_KEY = "promptfolio-chat-history";
const QUICK_PROMPTS = [
  "Find a cinematic creator",
  "How does matching work?",
  "Show verified creators",
];
const WELCOME_MESSAGE: ChatMessageData = {
  role: "assistant",
  content: "👋 Hi! I'm the PromptFolio assistant. I can help you:\n• Find AI creators for your campaign\n• Understand how matching works\n• Explain verification signals\n• Browse top creators\nWhat would you like to know?",
};

function readStoredMessages(): ChatMessageData[] {
  if (typeof window === "undefined") return [WELCOME_MESSAGE];

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [WELCOME_MESSAGE];
    const parsed: unknown = JSON.parse(stored);
    if (
      Array.isArray(parsed) &&
      parsed.every(
        (item): item is ChatMessageData =>
          typeof item === "object" &&
          item !== null &&
          "role" in item &&
          (item.role === "user" || item.role === "assistant") &&
          "content" in item &&
          typeof item.content === "string",
      )
    ) {
      return parsed.length > 0 ? parsed : [WELCOME_MESSAGE];
    }
  } catch (cause) {
    console.error("[chat] Unable to restore chat history:", cause);
  }
  return [WELCOME_MESSAGE];
}

/**
 * Provides a floating marketplace assistant on every non-authentication page.
 */
export default function ChatBot() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageData[]>(readStoredMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (cause) {
      console.error("[chat] Unable to persist chat history:", cause);
    }
  }, [messages]);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, open]);

  async function sendMessage(content: string, retry = false) {
    const trimmed = content.trim();
    if (!trimmed || isLoading || requestRef.current) return;

    const updatedMessages: ChatMessageData[] = retry
      ? messages
      : [...messages, { role: "user" as const, content: trimmed }];
    if (!retry) {
      setMessages(updatedMessages);
      setInput("");
    }
    setError("");
    setIsLoading(true);
    requestRef.current = true;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages.slice(-30) }),
      });
      const result = (await response.json()) as { message?: string; error?: string };
      if (!response.ok || !result.message) {
        throw new Error(result.error || "Chat request failed.");
      }
      const assistantMessage: ChatMessageData = { role: "assistant", content: result.message };
      setMessages([...updatedMessages, assistantMessage].slice(-60));
    } catch (cause) {
      console.error("[chat] Unable to send message:", cause);
      setError("Sorry, something went wrong. Try again.");
    } finally {
      setIsLoading(false);
      requestRef.current = false;
    }
  }

  function clearChat() {
    if (isLoading) return;
    setMessages([WELCOME_MESSAGE]);
    setError("");
    window.localStorage.removeItem(STORAGE_KEY);
  }

  async function copyMessage(content: string) {
    try {
      await navigator.clipboard.writeText(content);
    } catch (cause) {
      console.error("[chat] Unable to copy assistant response:", cause);
    }
  }

  function retryLastMessage() {
    const lastUserMessage = [...messages].reverse().find((message) => message.role === "user");
    if (lastUserMessage) void sendMessage(lastUserMessage.content, true);
  }

  if (pathname === "/login" || pathname === "/signup") return null;

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {open && (
        <section
          aria-label="PromptFolio Assistant chat"
          className="glass absolute bottom-20 left-0 flex h-[min(500px,70vh)] w-[calc(100vw-3rem)] max-w-96 flex-col overflow-hidden rounded-2xl shadow-2xl shadow-black/50 animate-[slideInLeft_0.3s_ease-out] sm:h-[500px]"
        >
          <header className="flex shrink-0 items-center justify-between bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white">
                <Sparkles size={17} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-white">PromptFolio Assistant</h2>
                <p className="flex items-center gap-1.5 text-xs text-white/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  Online
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <button
                type="button"
                onClick={clearChat}
                disabled={isLoading}
                aria-label="Clear chat"
                className="rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                <RotateCcw size={15} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                <X size={17} aria-hidden="true" />
              </button>
            </div>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto p-4" aria-live="polite">
            {messages.map((message, index) => (
              <ChatMessage
                key={`${index}-${message.role}`}
                message={message}
                onCopy={message.role === "assistant" ? (value) => void copyMessage(value) : undefined}
              />
            ))}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 pl-9">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendMessage(prompt)}
                    disabled={isLoading}
                    className="rounded-full border border-purple-400/20 bg-purple-500/10 px-3 py-1.5 text-left text-xs text-purple-200 transition hover:border-purple-400/40 hover:bg-purple-500/20 disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
            {isLoading && (
              <div className="flex items-end gap-2" aria-label="Assistant is typing">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  <Bot size={15} aria-hidden="true" />
                </span>
                <div className="flex h-10 items-center gap-1 rounded-2xl rounded-bl-sm border border-white/10 bg-white/5 px-4">
                  <span className="typing-dot" />
                  <span className="typing-dot [animation-delay:150ms]" />
                  <span className="typing-dot [animation-delay:300ms]" />
                </div>
              </div>
            )}
            {error && (
              <p role="alert" className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {error}{" "}
                <button type="button" onClick={retryLastMessage} className="underline underline-offset-2">
                  Retry
                </button>
              </p>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="shrink-0 space-y-2 border-t border-white/10 p-3">
            <ChatInput value={input} disabled={isLoading} onChange={setInput} onSubmit={() => void sendMessage(input)} />
            <div className="flex items-center justify-between px-1">
              <Link href="/creators" onNavigate={() => setOpen(false)} className="flex items-center gap-1 text-xs text-gray-400 transition hover:text-purple-300">
                Find creators <MessageCircle size={12} aria-hidden="true" />
              </Link>
              <Link href="/brief/new" onNavigate={() => setOpen(false)} className="flex items-center gap-1 text-xs text-gray-400 transition hover:text-purple-300">
                New brief <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close PromptFolio Assistant" : "Open PromptFolio Assistant"}
        aria-expanded={open}
        className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/40 transition duration-200 hover:scale-105 hover:shadow-purple-500/30 ${open ? "" : "animate-[chatPulse_2.8s_ease-in-out_infinite]"}`}
      >
        {open ? <X size={22} aria-hidden="true" /> : <MessageCircle size={23} aria-hidden="true" />}
      </button>
    </div>
  );
}
