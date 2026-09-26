import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "~/lib/api";
import { AlertCircleIcon, SendIcon, SpinnerIcon } from "./icons";

type ChatSource = {
  filename: string;
  originalName: string;
  chunkIndex: number;
  similarity: number;
};

type Message = {
  id: string;
  from: "me" | "them";
  text: string;
  time: string;
  sources?: ChatSource[];
};

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  from: "them",
  text: "Ask me anything about your vectorized documents.",
  time: now(),
};

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, isSending]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || isSending) return;

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), from: "me", text, time: now() },
    ]);
    setDraft("");
    setError(null);
    setIsSending(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to get an answer");

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          from: "them",
          text: data.answer,
          time: now(),
          sources: data.sources,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get an answer");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="flex h-full flex-col rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-3 border-b border-gray-200 p-4 dark:border-gray-800">
        <div className="relative">
          <div className="flex size-9 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
            AI
          </div>
          <span className="absolute right-0 bottom-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-900" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Document Assistant
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Answers from your vectorized files
          </p>
        </div>
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.from === "me" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                message.from === "me"
                  ? "rounded-br-sm bg-indigo-600 text-white"
                  : "rounded-bl-sm bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.text}</p>

              {message.sources && message.sources.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1 border-t border-black/10 pt-2 dark:border-white/10">
                  {message.sources.map((source, i) => (
                    <span
                      key={`${source.filename}-${source.chunkIndex}`}
                      className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] text-gray-500 dark:bg-white/10 dark:text-gray-400"
                    >
                      [{i + 1}] {source.originalName} · {Math.round(source.similarity * 100)}%
                    </span>
                  ))}
                </div>
              )}

              <p
                className={`mt-1 text-[10px] ${
                  message.from === "me"
                    ? "text-indigo-200"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {message.time}
              </p>
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-gray-100 px-3.5 py-2 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <SpinnerIcon className="size-4 animate-spin" />
              Thinking…
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-1 px-4 pb-2 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircleIcon className="size-3.5 shrink-0" />
          {error}
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 border-t border-gray-200 p-3 dark:border-gray-800"
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask a question about your documents..."
          disabled={isSending}
          className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        <button
          type="submit"
          disabled={!draft.trim() || isSending}
          aria-label="Send message"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700"
        >
          {isSending ? (
            <SpinnerIcon className="size-4 animate-spin" />
          ) : (
            <SendIcon className="size-4" />
          )}
        </button>
      </form>
    </section>
  );
}
