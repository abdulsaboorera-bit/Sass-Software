"use client";

import { useEffect, useRef, useState } from "react";
import { Send, MessageCircle } from "lucide-react";

interface InboxRow {
  tenant: { id: string; name: string; slug: string; industry: string };
  unread: number;
  lastMessage: { body: string; createdAt: string; senderRole: "PLATFORM" | "TENANT" } | null;
}

interface Message {
  id: string;
  senderRole: "PLATFORM" | "TENANT";
  body: string;
  createdAt: string;
}

const POLL_MS = 4000;

export default function AdminMessagesPage() {
  const [inbox, setInbox] = useState<InboxRow[]>([]);
  const [selected, setSelected] = useState<InboxRow | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchInbox = () => {
    fetch("/api/admin/messages", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data.inbox) setInbox(data.inbox); });
  };

  const fetchThread = (tenantId: string) => {
    fetch(`/api/admin/messages/${tenantId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data.messages) setMessages(data.messages); });
  };

  useEffect(() => {
    fetchInbox();
    const t = setInterval(fetchInbox, POLL_MS);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!selected) return;
    fetchThread(selected.tenant.id);
    const t = setInterval(() => fetchThread(selected.tenant.id), POLL_MS);
    return () => clearInterval(t);
  }, [selected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openThread = (row: InboxRow) => {
    setSelected(row);
    setInbox((prev) => prev.map((r) => (r.tenant.id === row.tenant.id ? { ...r, unread: 0 } : r)));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !draft.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/messages/${selected.tenant.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ body: draft }),
      });
      if (res.ok) {
        setDraft("");
        fetchThread(selected.tenant.id);
        fetchInbox();
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Messages</h2>
        <p className="text-slate-500 text-sm">Chat directly with each tenant&apos;s admin.</p>
      </div>

      <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden" style={{ height: "70vh" }}>
        {/* Inbox list */}
        <div className="w-72 border-r border-slate-200 overflow-y-auto shrink-0">
          {inbox.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10 px-3">No tenants yet.</p>
          ) : (
            inbox.map((row) => (
              <button
                key={row.tenant.id}
                onClick={() => openThread(row)}
                className={`w-full text-left px-4 py-3 border-b border-slate-100 cursor-pointer border-x-0 border-t-0 transition-colors ${
                  selected?.tenant.id === row.tenant.id ? "bg-blue-50" : "bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900 truncate">{row.tenant.name}</p>
                  {row.unread > 0 && (
                    <span className="ml-2 shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {row.unread}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {row.lastMessage ? row.lastMessage.body : "No messages yet"}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Thread */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
              <MessageCircle size={40} className="mb-2" />
              <p className="text-sm text-slate-400">Select a tenant to start chatting.</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-slate-200">
                <p className="text-sm font-bold text-slate-900">{selected.tenant.name}</p>
                <p className="text-xs text-slate-400">{selected.tenant.industry}</p>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.senderRole === "PLATFORM" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] px-3.5 py-2 rounded-2xl text-sm ${
                      m.senderRole === "PLATFORM" ? "bg-blue-600 text-white rounded-br-sm" : "bg-slate-100 text-slate-800 rounded-bl-sm"
                    }`}>
                      <p>{m.body}</p>
                      <p className={`text-[10px] mt-1 ${m.senderRole === "PLATFORM" ? "text-blue-100" : "text-slate-400"}`}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={handleSend} className="flex items-center gap-2 p-3 border-t border-slate-200">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button type="submit" disabled={sending || !draft.trim()}
                  className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 border-none cursor-pointer transition-colors">
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
