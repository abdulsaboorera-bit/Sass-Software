"use client";

import { useEffect, useState } from "react";

interface Table { id: string; number: number; capacity: number; status: string; section: string | null }

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [form, setForm] = useState({ number: "", capacity: "", section: "Indoor" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchTables = () => {
    fetch("/api/restaurant/tables").then(r => r.json()).then(data => { if (data.tables) setTables(data.tables); }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchTables(); }, []);

  const resetForm = () => { setForm({ number: "", capacity: "", section: "Indoor" }); setEditingTable(null); setShowForm(false); setError(""); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.number || !form.capacity) { setError("Number and capacity are required"); return; }
    setSubmitting(true);
    setError("");
    try {
      if (editingTable) {
        const res = await fetch("/api/restaurant/tables", {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingTable.id, number: parseInt(form.number), capacity: parseInt(form.capacity), section: form.section }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
      } else {
        const res = await fetch("/api/restaurant/tables", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ number: parseInt(form.number), capacity: parseInt(form.capacity), section: form.section }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
      }
      resetForm();
      fetchTables();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setSubmitting(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/restaurant/tables", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    fetchTables();
  };

  const deleteTable = async (id: string) => {
    if (!confirm("Delete this table?")) return;
    await fetch(`/api/restaurant/tables?id=${id}`, { method: "DELETE" });
    fetchTables();
  };

  const statusStyles: Record<string, string> = {
    AVAILABLE: "bg-green-100 border-green-300 text-green-700",
    OCCUPIED: "bg-red-100 border-red-300 text-red-700",
    RESERVED: "bg-amber-100 border-amber-300 text-amber-700",
  };

  const inputCls = "px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500";

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Tables</h2>
          <p className="text-slate-500 text-sm">Visual floor plan management.</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm border-none cursor-pointer">
          {showForm ? "Cancel" : "Add Table"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 mb-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-700">{editingTable ? "Edit Table" : "New Table"}</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            <input type="number" placeholder="Table number *" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} className={inputCls} />
            <input type="number" placeholder="Capacity *" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} className={inputCls} />
            <select value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} className={inputCls}>
              <option value="Indoor">Indoor</option>
              <option value="Outdoor">Outdoor</option>
            </select>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={submitting} className="bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 border-none cursor-pointer">
            {submitting ? "Saving..." : editingTable ? "Update Table" : "Add Table"}
          </button>
        </form>
      )}

      {loading ? <div className="text-center py-12 text-slate-400 text-sm">Loading...</div>
      : tables.length === 0 ? <div className="text-center py-12 text-slate-400 text-sm">No tables configured.</div>
      : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {tables.map(t => (
            <div key={t.id} className={`border-2 rounded-xl p-4 text-center transition-all hover:shadow-md ${statusStyles[t.status] || "border-slate-200"}`}>
              <p className="text-2xl font-black">{t.number}</p>
              <p className="text-xs font-medium mt-1">{t.capacity} seats</p>
              <p className="text-[10px] font-semibold uppercase mt-1">{t.status}</p>
              {t.section && <p className="text-[10px] opacity-60 mt-0.5">{t.section}</p>}
              <div className="flex justify-center gap-1 mt-2">
                {t.status === "AVAILABLE" && <button onClick={() => updateStatus(t.id, "OCCUPIED")} className="text-[10px] text-red-600 font-semibold hover:text-red-700 border-none bg-transparent cursor-pointer">Occupy</button>}
                {t.status === "OCCUPIED" && <button onClick={() => updateStatus(t.id, "AVAILABLE")} className="text-[10px] text-green-600 font-semibold hover:text-green-700 border-none bg-transparent cursor-pointer">Free</button>}
                {t.status !== "RESERVED" && <button onClick={() => updateStatus(t.id, "RESERVED")} className="text-[10px] text-amber-600 font-semibold hover:text-amber-700 border-none bg-transparent cursor-pointer">Reserve</button>}
                {t.status === "RESERVED" && <button onClick={() => updateStatus(t.id, "AVAILABLE")} className="text-[10px] text-green-600 font-semibold hover:text-green-700 border-none bg-transparent cursor-pointer">Cancel</button>}
                <button onClick={() => { setEditingTable(t); setForm({ number: String(t.number), capacity: String(t.capacity), section: t.section || "Indoor" }); setShowForm(true); }} className="text-[10px] text-blue-600 font-semibold hover:text-blue-700 border-none bg-transparent cursor-pointer">Edit</button>
                <button onClick={() => deleteTable(t.id)} className="text-[10px] text-red-500 font-semibold hover:text-red-600 border-none bg-transparent cursor-pointer">Del</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
