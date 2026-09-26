import { useEffect, useRef, useState } from "react";
import { SendIcon } from "./icons";

type Message = {
  id: string;
  from: "me" | "them";
  text: string;
  time: string;
};

const AUTO_REPLIES = [
  "Got it, thanks for the update!",
  "Sounds good, I'll take a look.",
  "Nice one — let me know if you need anything else.",
  "Makes sense, appreciate the heads up.",
];

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const INITIAL_MESSAGES: Message[] = [
  { id: "1", from: "them", text: "Hey! How's the dashboard coming along?", time: "09:12" },
  { id: "2", from: "me", text: "Almost done, just wiring up the upload panel now.", time: "09:14" },
  { id: "3", from: "them", text: "Nice, send a screenshot when you can.", time: "09:15" },
];

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const replyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (replyTimeout.current) clearTimeout(replyTimeout.current);
    };
  }, []);

  function handleSend() {
    const text = draft.trim();
    if (!text) return;

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), from: "me", text, time: now() },
    ]);
    setDraft("");

    replyTimeout.current = setTimeout(() => {
      const reply =
        AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), from: "them", text: reply, time: now() },
      ]);
    }, 900);
  }

  return (
    <section className="flex h-full flex-col rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-3 border-b border-gray-200 p-4 dark:border-gray-800">
        <div className="relative">
          <div className="flex size-9 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
            JD
          </div>
          <span className="absolute right-0 bottom-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-900" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Jordan Diaz
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            Online
          </p>
        </div>
      </div>

      <div
        ref={listRef}
        className="flex-1 space-y-3 overflow-y-auto p-4"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.from === "me" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                message.from === "me"
                  ? "rounded-br-sm bg-indigo-600 text-white"
                  : "rounded-bl-sm bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
              }`}
            >
              <p>{message.text}</p>
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
      </div>

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
          placeholder="Type a message..."
          className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="Send message"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700"
        >
          <SendIcon className="size-4" />
        </button>
      </form>
    </section>
  );
}
