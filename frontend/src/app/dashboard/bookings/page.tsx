"use client";

import { useCallback, useEffect, useState } from "react";
import { Inbox, Loader2, Search, Phone, Mail, Trash2, CalendarClock, Users, Link2, Check } from "lucide-react";
import { getCurrentUser } from "@/lib/currentUser";

interface Booking {
  id: string;
  type: string;
  name: string;
  phone?: string;
  email?: string;
  service?: string;
  message?: string;
  preferredDate?: string;
  preferredTime?: string;
  partySize?: number;
  status: string;
  source?: string;
  createdAt: string;
}

const STATUSES = ["NEW", "CONTACTED", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;

const statusStyle: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-600 border-blue-200",
  CONTACTED: "bg-purple-50 text-purple-600 border-purple-200",
  CONFIRMED: "bg-green-50 text-green-600 border-green-200",
  COMPLETED: "bg-slate-100 text-slate-600 border-slate-200",
  CANCELLED: "bg-red-50 text-red-600 border-red-200",
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then((data) => setSlug(data.user?.tenant?.slug || null))
      .catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (statusFilter) qs.set("status", statusFilter);
    if (search) qs.set("search", search);
    fetch(`/api/bookings?${qs.toString()}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { bookings: [] }))
      .then((d) => setBookings(d.bookings || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const setStatus = async (id: string, status: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
      }
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this request?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) setBookings((prev) => prev.filter((b) => b.id !== id));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-1">
        <Inbox size={22} className="text-blue-600" />
        <h2 className="text-2xl font-extrabold text-slate-900">Bookings &amp; Requests</h2>
      </div>
      <p className="text-slate-500 text-sm mb-6">Requests submitted from your public booking page.</p>

      {slug && (() => {
        const url = typeof window !== "undefined" ? `${window.location.origin}/book/${slug}` : `/book/${slug}`;
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 flex flex-wrap items-center gap-3">
            <Link2 size={16} className="text-blue-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Your public booking link</p>
              <p className="text-sm text-slate-700 truncate">{url}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a href={`/book/${slug}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-blue-600 hover:text-blue-700 no-underline px-3 py-1.5 border border-blue-200 rounded-lg bg-white">
                Open
              </a>
              <button
                onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg border-none cursor-pointer"
              >
                {copied ? <><Check size={12} /> Copied</> : "Copy"}
              </button>
            </div>
          </div>
        );
      })()}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, email…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          <FilterChip active={statusFilter === ""} onClick={() => setStatusFilter("")}>All</FilterChip>
          {STATUSES.map((s) => (
            <FilterChip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </FilterChip>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-slate-400"><Loader2 className="animate-spin" /></div>
      ) : bookings.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-16 text-center text-sm text-slate-400">
          No requests yet.
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-slate-900">{b.name}</p>
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${statusStyle[b.status] || statusStyle.NEW}`}>
                      {b.status}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{b.type}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500">
                    {b.phone && <a href={`tel:${b.phone}`} className="inline-flex items-center gap-1 text-slate-500 no-underline hover:text-blue-600"><Phone size={12} /> {b.phone}</a>}
                    {b.email && <a href={`mailto:${b.email}`} className="inline-flex items-center gap-1 text-slate-500 no-underline hover:text-blue-600"><Mail size={12} /> {b.email}</a>}
                    {b.service && <span>{b.service}</span>}
                    {b.preferredDate && <span className="inline-flex items-center gap-1"><CalendarClock size={12} /> {b.preferredDate}{b.preferredTime ? ` ${b.preferredTime}` : ""}</span>}
                    {b.partySize ? <span className="inline-flex items-center gap-1"><Users size={12} /> {b.partySize}</span> : null}
                  </div>
                  {b.message && <p className="text-xs text-slate-600 mt-2 bg-slate-50 rounded-lg px-3 py-2">{b.message}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={b.status}
                    onChange={(e) => setStatus(b.id, e.target.value)}
                    disabled={busyId === b.id}
                    className="text-xs font-semibold border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 cursor-pointer focus:outline-none"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
                  </select>
                  {b.phone && (
                    <a
                      href={`https://wa.me/${b.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg border border-slate-200 text-green-600 hover:bg-green-50 no-underline"
                      title="WhatsApp"
                    >
                      <Phone size={14} />
                    </a>
                  )}
                  <button
                    onClick={() => remove(b.id)}
                    disabled={busyId === b.id}
                    className="p-2 rounded-lg border border-slate-200 text-red-500 hover:bg-red-50 bg-white cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border cursor-pointer transition-colors ${
        active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}
