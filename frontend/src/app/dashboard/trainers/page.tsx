"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Users, Dumbbell, Calendar } from "lucide-react";

interface Trainer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  specialization: string | null;
  fee: string;
  assignedMembers: number;
  activeMembers: number;
}

const emptyForm = { name: "", phone: "", email: "", specialization: "", fee: "" };

export default function TrainersPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Trainer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchTrainers = () => {
    setLoading(true);
    fetch("/api/gym/trainers", { credentials: "include" })
      .then(r => r.json())
      .then(data => { if (data.trainers) setTrainers(data.trainers); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTrainers(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setError(""); setModalOpen(true); };
  const openEdit = (t: Trainer) => {
    setEditing(t);
    setForm({ name: t.name, phone: t.phone, email: t.email || "", specialization: t.specialization || "", fee: t.fee });
    setError(""); setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditing(null); setForm(emptyForm); setError(""); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const payload: Record<string, unknown> = {
        name: form.name, phone: form.phone, email: form.email || undefined,
        specialization: form.specialization || undefined, fee: Number(form.fee),
      };
      if (editing) {
        payload.id = editing.id;
        const res = await fetch("/api/gym/trainers", { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(payload) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update trainer");
      } else {
        const res = await fetch("/api/gym/trainers", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(payload) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create trainer");
      }
      closeModal(); fetchTrainers();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Something went wrong"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (t: Trainer) => {
    if (!confirm(`Delete trainer "${t.name}"?`)) return;
    try {
      const res = await fetch(`/api/gym/trainers?id=${t.id}`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      fetchTrainers();
    } catch { alert("Failed to delete trainer"); }
  };

  const totalAssigned = trainers.reduce((s, t) => s + (t.assignedMembers || 0), 0);
  const totalActive = trainers.reduce((s, t) => s + (t.activeMembers || 0), 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Trainers</h2>
          <p className="text-slate-500 text-sm">{trainers.length} active trainers</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm border-none cursor-pointer">
          <Plus size={16} /> New Trainer
        </button>
      </div>

      {/* Summary */}
      {trainers.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><Users size={18} className="text-blue-600" /></div>
            <div>
              <p className="text-2xl font-black text-slate-900">{totalAssigned}</p>
              <p className="text-xs text-slate-500">Total Assigned</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center"><Dumbbell size={18} className="text-green-600" /></div>
            <div>
              <p className="text-2xl font-black text-slate-900">{totalActive}</p>
              <p className="text-xs text-slate-500">Active Members</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center"><Calendar size={18} className="text-purple-600" /></div>
            <div>
              <p className="text-2xl font-black text-slate-900">{trainers.length}</p>
              <p className="text-xs text-slate-500">Trainers</p>
            </div>
          </div>
        </div>
      )}

      {/* Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 text-slate-400 text-sm">Loading...</div>
        ) : trainers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400 text-sm">No trainers yet.</div>
        ) : (
          trainers.map((t) => {
            const assigned = t.assignedMembers || 0;
            const active = t.activeMembers || 0;
            const workload = assigned > 0 ? Math.round((active / assigned) * 100) : 0;
            return (
              <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow relative group">
                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors border-none bg-transparent cursor-pointer"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(t)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors border-none bg-transparent cursor-pointer"><Trash2 size={14} /></button>
                </div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {t.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-slate-900 font-bold text-sm truncate">{t.name}</h3>
                    {t.specialization && <p className="text-blue-600 text-xs font-medium">{t.specialization}</p>}
                    <p className="text-slate-400 text-xs">{t.phone}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center mb-3">
                  <div className="bg-blue-50 rounded-lg py-2">
                    <p className="text-lg font-bold text-blue-700">{assigned}</p>
                    <p className="text-[10px] text-slate-500 font-medium">Assigned</p>
                  </div>
                  <div className="bg-green-50 rounded-lg py-2">
                    <p className="text-lg font-bold text-green-700">{active}</p>
                    <p className="text-[10px] text-slate-500 font-medium">Active</p>
                  </div>
                </div>
                {assigned > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500">Activity Rate</span>
                      <span className="font-semibold text-slate-700">{workload}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${workload > 80 ? "bg-green-500" : workload > 50 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${Math.min(workload, 100)}%` }} />
                    </div>
                  </div>
                )}
                <p className="text-slate-500 text-xs">Fee: PKR {Number(t.fee).toLocaleString()}/mo</p>
              </div>
            );
          })
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeModal}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">{editing ? "Edit Trainer" : "New Trainer"}</h3>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 border-none bg-transparent cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Name</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Trainer name"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Phone</label>
                <input type="text" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone number"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Email (optional)</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email address"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Specialization (optional)</label>
                <input type="text" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder="e.g. Strength Training"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Fee (PKR)</label>
                <input type="number" required min="1" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} placeholder="Monthly fee"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors bg-white cursor-pointer">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 border-none cursor-pointer">
                  {saving ? "Saving..." : editing ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
