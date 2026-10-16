"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarSearch, FileWarning, ClipboardCheck, Loader2, Plus, Trash2 } from "lucide-react";

interface Car {
  id: string;
  registrationNo: string;
  make: string;
  model: string;
  year?: number;
  dailyRate: number;
  status: string;
  category?: string;
  insuranceExpiry?: string | null;
  registrationExpiry?: string | null;
  nextServiceDue?: string | null;
  daysLeft?: number | null;
  kind?: string;
}

interface Rental {
  id: string;
  rentalNo: string;
  status: string;
  dueAt: string;
  carId?: { registrationNo: string; make: string; model: string };
  customerId?: { name: string; phone: string };
  checklist?: { phase: string; label: string; ok: boolean; note?: string }[];
}

type Tab = "availability" | "documents" | "checklist";

const CATEGORIES = ["ECONOMY", "COMPACT", "SEDAN", "SUV", "LUXURY", "VAN", "OTHER"];
const DOC_KINDS: { key: string; label: string }[] = [
  { key: "insuranceExpiry", label: "Insurance" },
  { key: "registrationExpiry", label: "Registration" },
  { key: "nextServiceDue", label: "Next service" },
];

const localInput = (offsetMs: number) => {
  const date = new Date(Date.now() + offsetMs);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

const DEFAULT_ITEMS = ["Fuel level", "Body / dents", "Tyres", "Interior & seats", "Documents in car"];

export default function FleetPage() {
  const [tab, setTab] = useState<Tab>("availability");
  const [error, setError] = useState("");

  const [from, setFrom] = useState(localInput(0));
  const [to, setTo] = useState(localInput(86400000));
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [available, setAvailable] = useState<Car[]>([]);
  const [availLoading, setAvailLoading] = useState(false);

  const [kind, setKind] = useState("insuranceExpiry");
  const [days, setDays] = useState(30);
  const [docs, setDocs] = useState<Car[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  const [rentals, setRentals] = useState<Rental[]>([]);
  const [rentalId, setRentalId] = useState("");
  const [phase, setPhase] = useState<"PICKUP" | "RETURN">("PICKUP");
  const [items, setItems] = useState<{ label: string; ok: boolean; note: string }[]>(DEFAULT_ITEMS.map((label) => ({ label, ok: true, note: "" })));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<Rental | null>(null);

  const loadAvailability = useCallback(async () => {
    setError("");
    setAvailLoading(true);
    try {
      const params = new URLSearchParams({ from, to });
      if (category) params.set("category", category);
      if (search) params.set("search", search);
      const response = await fetch(`/api/car-rental/cars/availability?${params}`, { credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to check availability");
      setAvailable(data.cars || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to check availability");
    } finally {
      setAvailLoading(false);
    }
  }, [from, to, category, search]);

  const loadDocs = useCallback(async () => {
    setError("");
    setDocsLoading(true);
    try {
      const response = await fetch(`/api/car-rental/cars/expiring-documents?days=${days}&kind=${kind}`, { credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load expiring documents");
      setDocs(data.cars || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to load expiring documents");
    } finally {
      setDocsLoading(false);
    }
  }, [days, kind]);

  const loadRentals = useCallback(async () => {
    try {
      const response = await fetch("/api/car-rental/rentals?limit=100&status=ACTIVE", { credentials: "include" });
      const data = await response.json();
      setRentals(data.rentals || []);
    } catch {
      setRentals([]);
    }
  }, []);

  useEffect(() => { if (tab === "availability") void loadAvailability(); }, [tab, loadAvailability]);
  useEffect(() => { if (tab === "documents") void loadDocs(); }, [tab, loadDocs]);
  useEffect(() => { if (tab === "checklist") void loadRentals(); }, [tab, loadRentals]);

  const submitChecklist = async () => {
    if (!rentalId) { setError("Select a rental first"); return; }
    const cleaned = items.filter((it) => it.label.trim());
    if (cleaned.length === 0) { setError("Add at least one checklist item"); return; }
    setSaving(true); setError("");
    try {
      const response = await fetch(`/api/car-rental/rentals/${rentalId}/checklist`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase, items: cleaned.map((it) => ({ label: it.label.trim(), ok: it.ok, note: it.note.trim() || undefined })) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save checklist");
      setSaved(data.rental);
      await loadRentals();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to save checklist");
    } finally {
      setSaving(false);
    }
  };

  const docDate = (car: Car) => {
    const value = car.kind === "insuranceExpiry" ? car.insuranceExpiry : car.kind === "registrationExpiry" ? car.registrationExpiry : car.nextServiceDue;
    return value ? new Date(value).toLocaleDateString() : "—";
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-slate-900">Fleet Tools</h2>
        <p className="text-slate-500 text-sm">Check availability, track document expiries, and record pickup/return checklists.</p>
      </div>

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {([
          { key: "availability", label: "Availability", icon: CalendarSearch },
          { key: "documents", label: "Documents", icon: FileWarning },
          { key: "checklist", label: "Checklists", icon: ClipboardCheck },
        ] as { key: Tab; label: string; icon: typeof CalendarSearch }[]).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border cursor-pointer ${tab === t.key ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"}`}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      {tab === "availability" && (
        <div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4 grid sm:grid-cols-4 gap-3">
            <label className="text-xs font-semibold text-slate-600">From<input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" /></label>
            <label className="text-xs font-semibold text-slate-600">To<input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" /></label>
            <label className="text-xs font-semibold text-slate-600">Category<select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"><option value="">All categories</option>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
            <label className="text-xs font-semibold text-slate-600">Search<input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Reg / make / model" className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" /></label>
          </div>
          {availLoading ? (
            <div className="py-16 grid place-items-center"><Loader2 className="animate-spin text-slate-400" /></div>
          ) : available.length === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center">No cars available for the selected window.</p>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
              {available.map((car) => (
                <div key={car.id} className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900">{car.make} {car.model}</h3>
                      <p className="text-xs text-slate-500">{car.registrationNo} · {car.year} · {car.category}</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">AVAILABLE</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700 mt-3">PKR {Number(car.dailyRate).toLocaleString()} / day</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "documents" && (
        <div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4 flex items-end gap-3 flex-wrap">
            <label className="text-xs font-semibold text-slate-600">Document<select value={kind} onChange={(e) => setKind(e.target.value)} className="mt-1 block border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white">{DOC_KINDS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}</select></label>
            <label className="text-xs font-semibold text-slate-600">Within<select value={days} onChange={(e) => setDays(Number(e.target.value))} className="mt-1 block border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white">{[7, 14, 30, 60, 90, 180, 365].map((d) => <option key={d} value={d}>{d} days</option>)}</select></label>
          </div>
          {docsLoading ? (
            <div className="py-16 grid place-items-center"><Loader2 className="animate-spin text-slate-400" /></div>
          ) : docs.length === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center">Nothing due in this window.</p>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Car</th>
                    <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Registration</th>
                    <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Due date</th>
                    <th className="text-right px-4 py-3 text-xs uppercase text-slate-500">Days left</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((car) => (
                    <tr key={car.id} className="border-b border-slate-100">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800">{car.make} {car.model}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{car.registrationNo}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{docDate(car)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs font-bold ${(car.daysLeft ?? 0) <= 7 ? "text-red-600" : "text-amber-600"}`}>{car.daysLeft}d</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "checklist" && (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <label className="text-xs font-semibold text-slate-600">Rental<select value={rentalId} onChange={(e) => { setRentalId(e.target.value); setSaved(null); }} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"><option value="">Select active rental</option>{rentals.map((r) => <option key={r.id} value={r.id}>{r.rentalNo} · {r.carId?.registrationNo} · {r.customerId?.name}</option>)}</select></label>
              <label className="text-xs font-semibold text-slate-600">Phase<select value={phase} onChange={(e) => setPhase(e.target.value as "PICKUP" | "RETURN")} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"><option value="PICKUP">Pickup</option><option value="RETURN">Return</option></select></label>
            </div>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input type="checkbox" checked={item.ok} onChange={(e) => setItems((prev) => prev.map((it, i) => i === index ? { ...it, ok: e.target.checked } : it))} className="w-4 h-4" />
                  <input value={item.label} onChange={(e) => setItems((prev) => prev.map((it, i) => i === index ? { ...it, label: e.target.value } : it))} placeholder="Item" className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-sm" />
                  <input value={item.note} onChange={(e) => setItems((prev) => prev.map((it, i) => i === index ? { ...it, note: e.target.value } : it))} placeholder="Note" className="w-28 border border-slate-200 rounded-lg px-2 py-1.5 text-sm" />
                  <button onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))} className="p-1.5 text-slate-400 hover:text-red-600 border-none bg-transparent cursor-pointer"><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
            <button onClick={() => setItems((prev) => [...prev, { label: "", ok: true, note: "" }])} className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600 font-semibold border-none bg-transparent cursor-pointer"><Plus size={14} /> Add item</button>
            <button onClick={submitChecklist} disabled={saving} className="mt-4 w-full bg-blue-600 text-white rounded-xl py-2.5 font-semibold text-sm border-none cursor-pointer disabled:opacity-50">{saving ? "Saving..." : "Save checklist"}</button>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <h3 className="font-bold text-slate-800 text-sm mb-3">Checklist history</h3>
            {saved?.checklist && saved.checklist.length > 0 ? (
              <div className="space-y-2">
                {saved.checklist.map((entry, index) => (
                  <div key={index} className="flex items-start justify-between gap-3 bg-white border border-slate-100 rounded-lg px-3 py-2 text-sm">
                    <div>
                      <span className={`text-[11px] font-bold mr-2 ${entry.phase === "PICKUP" ? "text-blue-600" : "text-purple-600"}`}>{entry.phase}</span>
                      <span className="text-slate-700">{entry.label}</span>
                      {entry.note && <p className="text-xs text-slate-400">{entry.note}</p>}
                    </div>
                    <span className={entry.ok ? "text-green-600" : "text-red-600"}>{entry.ok ? "OK" : "!"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">Save a checklist for a rental to see it here.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
