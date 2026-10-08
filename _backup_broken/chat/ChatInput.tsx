"use client";

import { useRef, type FormEvent, type KeyboardEvent } from "react";
import { Send } from "lucide-react";

/**
 * Renders the autosizing chat composer and submit button.
 */
export default function ChatInput({
  value,
  disabled,
  onChange,
  onSubmit,
}: {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function resizeInput() {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 72)}px`;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
    requestAnimationFrame(() => {
      if (inputRef.current) inputRef.current.style.height = "auto";
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      inputRef.current?.form?.requestSubmit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <textarea
        ref={inputRef}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          resizeInput();
        }}
        onKeyDown={handleKeyDown}
        rows={1}
        maxLength={2000}
        aria-label="Message the CreatorIQ assistant"
        placeholder="Ask me anything..."
        disabled={disabled}
        className="max-h-[72px] min-h-11 flex-1 resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm leading-5 text-white outline-none placeholder:text-gray-500 focus:border-purple-500/50 disabled:opacity-60"
      />
      <button
        type="submit"
        aria-label="Send message"
        disabled={disabled || !value.trim()}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white transition hover:shadow-lg hover:shadow-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Send size={17} aria-hidden="true" />
      </button>
    </form>
  );
}
