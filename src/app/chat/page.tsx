"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  SendHorizontal,
  Stethoscope,
  AlertCircle,
  FileText,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const query = input.trim();
    if (!query || streaming) return;

    const userMsg: Message = { role: "user", content: query };
    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setStreaming(true);
    setError(null);

    const assistantMsg: Message = {
      role: "assistant",
      content: "",
      sources: [],
    };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, history }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Request failed");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = JSON.parse(line.slice(6));

          if (payload.type === "sources") {
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                sources: payload.sources,
              };
              return updated;
            });
          } else if (payload.type === "text") {
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: updated[updated.length - 1].content + payload.text,
              };
              return updated;
            });
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setStreaming(false);
    }
  }, [input, messages, streaming]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-[#fafafa] flex flex-col relative">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-8 pb-32">
        <div className="max-w-3xl mx-auto space-y-6 w-full">
          {messages.length === 0 && (
            <div className="text-center mt-24">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Stethoscope className="w-8 h-8 text-slate-400" />
              </div>
              <h2 className="text-xl font-medium text-slate-900 mb-2">
                Clinical Assistant
              </h2>
              <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                Ask questions about your uploaded medical documents, clinical
                notes, or lab results.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                {[
                  "Summarize the latest visit",
                  "What medications were prescribed?",
                  "Are there any abnormal lab results?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                    }}
                    className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full hover:border-teal-500 hover:text-teal-700 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-5 py-4 ${
                  msg.role === "user"
                    ? "bg-slate-800 text-white ml-12"
                    : "bg-white text-slate-800 border border-slate-200 border-l-2 border-l-teal-500 shadow-sm mr-12"
                }`}
              >
                <div className="prose prose-sm max-w-none prose-slate">
                  <p className="whitespace-pre-wrap leading-relaxed m-0 text-[15px]">
                    {msg.content}
                    {streaming &&
                      i === messages.length - 1 &&
                      msg.role === "assistant" && (
                        <span className="inline-block w-[3px] h-4 bg-teal-500 animate-pulse ml-1 align-text-bottom" />
                      )}
                  </p>
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Sources Referenced
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 text-slate-600 px-2 py-1 rounded"
                        >
                          <FileText className="w-3 h-3 text-slate-400" />
                          <span className="font-mono truncate max-w-[200px]">
                            {s}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-lg p-4 text-red-800 text-sm max-w-[85%] mx-auto">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div ref={bottomRef} className="h-4" />
        </div>
      </div>

      {/* Input */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#fafafa] via-[#fafafa] to-transparent pt-6 pb-6 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end shadow-sm bg-white rounded-xl border border-slate-200 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={streaming}
              placeholder="Ask a clinical question..."
              rows={1}
              className="flex-1 max-h-32 min-h-[56px] resize-none bg-transparent border-0 px-4 py-4 text-[15px] focus:outline-none disabled:opacity-50 text-slate-800 placeholder:text-slate-400"
              style={{ height: "auto" }}
            />
            <div className="px-2 py-2 shrink-0">
              <button
                onClick={sendMessage}
                disabled={!input.trim() || streaming}
                className="bg-teal-600 text-white p-2.5 rounded-lg hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Send message"
              >
                <SendHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>
          <p className="text-center text-[11px] text-slate-400 mt-3 font-medium">
            AI-generated responses should not replace professional medical
            judgment.
          </p>
        </div>
      </div>
    </main>
  );
}
