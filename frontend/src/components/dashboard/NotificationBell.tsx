"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Check, MessageCircle, Loader2 } from "lucide-react";

interface Notification {
  id: string;
  event: string;
  channel: string;
  title: string;
  message: string;
  status: string;
  link?: string;
  readAt?: string | null;
  createdAt: string;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const statusColor: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-600",
  QUEUED: "bg-orange-100 text-orange-700",
  SENT: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  SKIPPED: "bg-slate-100 text-slate-500",
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchCount = useCallback(() => {
    fetch("/api/notifications/unread-count", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { count: 0 }))
      .then((data) => setCount(data.count || 0))
      .catch(() => {});
  }, []);

  const fetchList = useCallback(() => {
    setLoading(true);
    fetch("/api/notifications?limit=15", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { notifications: [] }))
      .then((data) => setItems(data.notifications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCount();
    const timer = setInterval(fetchCount, 60000);
    return () => clearInterval(timer);
  }, [fetchCount]);

  useEffect(() => {
    if (open) fetchList();
  }, [open, fetchList]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: "POST", credentials: "include" });
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
    fetchCount();
  };

  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "POST", credentials: "include" });
    setItems((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
    setCount(0);
  };

  const confirmSent = async (id: string) => {
    await fetch(`/api/notifications/${id}/send`, { method: "POST", credentials: "include" });
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, status: "SENT" } : n)));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer border-none bg-transparent"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
            {count > 0 && (
              <button onClick={markAllRead} className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-transparent border-none cursor-pointer">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-slate-400">
                <Loader2 size={18} className="animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">No notifications yet.</p>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${n.readAt ? "" : "bg-blue-50/40"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                    <span className={`shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${statusColor[n.status] || statusColor.PENDING}`}>
                      {n.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-slate-400">{timeAgo(n.createdAt)}</span>
                    {n.link && (
                      <a
                        href={n.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => n.status !== "SENT" && confirmSent(n.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-600 hover:text-green-700 no-underline"
                      >
                        <MessageCircle size={12} /> Send on WhatsApp
                      </a>
                    )}
                    {!n.readAt && (
                      <button
                        onClick={() => markRead(n.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700 bg-transparent border-none cursor-pointer"
                      >
                        <Check size={12} /> Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
