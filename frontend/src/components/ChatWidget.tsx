"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";

interface Message {
  id: string;
  senderRole: "PLATFORM" | "TENANT";
  body: string;
  createdAt: string;
}

const POLL_MS = 4000;

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchUnread = () => {
    fetch("/api/messages/unread", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (typeof data.unread === "number") setUnread(data.unread); })
      .catch(() => {});
  };

  const fetchThread = async () => {
    try {
      const response = await fetch("/api/messages", { credentials: "include" });
      const data = await response.json();
      if (data.messages) setMessages(data.messages);
    } catch {
      // The widget is non-critical and can retry on the next poll.
    }
  };

  useEffect(() => {
    fetchUnread();
    const t = setInterval(fetchUnread, POLL_MS);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    void fetchThread().then(() => setUnread(0));
    const t = setInterval(fetchThread, POLL_MS);
    return () => clearInterval(t);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ body: draft }),
      });
      if (res.ok) {
        setDraft("");
        fetchThread();
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center border-none cursor-pointer transition-colors"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-40 w-80 sm:w-96 h-[28rem] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-[#0d3b3f] text-white">
            <p className="text-sm font-bold">Support</p>
            <p className="text-xs text-slate-400">Chat with the NexusSoft team</p>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No messages yet — say hello!</p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.senderRole === "TENANT" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                    m.senderRole === "TENANT" ? "bg-blue-600 text-white rounded-br-sm" : "bg-slate-100 text-slate-800 rounded-bl-sm"
                  }`}>
                    <p>{m.body}</p>
                    <p className={`text-[10px] mt-1 ${m.senderRole === "TENANT" ? "text-blue-100" : "text-slate-400"}`}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={handleSend} className="flex items-center gap-2 p-2.5 border-t border-slate-200">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <button type="submit" disabled={sending || !draft.trim()}
              className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 border-none cursor-pointer transition-colors">
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
