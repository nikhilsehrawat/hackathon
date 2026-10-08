"use client";

import { Bot, Copy, UserRound } from "lucide-react";

export interface ChatMessageData {
  role: "user" | "assistant";
  content: string;
}

/**
 * Renders a single user or assistant message in the chat transcript.
 */
export default function ChatMessage({
  message,
  onCopy,
}: {
  message: ChatMessageData;
  onCopy?: (content: string) => void;
}) {
  const assistant = message.role === "assistant";

  return (
    <div className={`flex items-end gap-2 ${assistant ? "justify-start" : "justify-end"}`}>
      {assistant && (
        <span className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white">
          <Bot size={15} aria-hidden="true" />
        </span>
      )}
      <div className={`group relative max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${
        assistant
          ? "rounded-bl-sm border border-white/10 bg-white/5 text-gray-200"
          : "rounded-br-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white"
      }`}>
        <p className="whitespace-pre-wrap">{message.content}</p>
        {assistant && onCopy && (
          <button
            type="button"
            onClick={() => onCopy(message.content)}
            aria-label="Copy assistant response"
            className="absolute -right-2 -top-2 rounded-md border border-white/10 bg-gray-950 p-1 text-gray-400 opacity-0 transition hover:text-white focus:opacity-100 group-hover:opacity-100"
          >
            <Copy size={12} aria-hidden="true" />
          </button>
        )}
      </div>
      {!assistant && (
        <span className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300">
          <UserRound size={14} aria-hidden="true" />
        </span>
      )}
    </div>
  );
}
