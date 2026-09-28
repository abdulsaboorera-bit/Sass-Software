"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Archive, X } from "lucide-react";

interface Plan { id: string; name: string; duration: number; price: number; description?: string; isActive?: boolean }
const empty = { name: "", duration: "30", price: "", description: "" };

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/gym/plans", { credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load plans");
      setPlans(data.plans || []);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Unable to load plans"); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const start = (plan?: Plan) => {
    setEditing(plan || null);
    setForm(plan ? { name: plan.name, duration: String(plan.duration), price: String(plan.price), description: plan.description || "" } : empty);
    setError(""); setOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const payload = { name: form.name, duration: Number(form.duration), price: Number(form.price), description: form.description || undefined };
      const response = await fetch("/api/gym/plans" + (editing ? `/${editing.id}` : ""), {
        method: editing ? "PATCH" : "POST", credentials: "include",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save plan");
      setOpen(false); await load();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Unable to save plan"); }
    finally { setSaving(false); }
  };

  const archive = async (plan: Plan) => {
    if (!confirm(`Archive ${plan.name}? Existing members will keep their plan.`)) return;
    const response = await fetch("/api/gym/plans", { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: plan.id, isActive: false }) });
    if (!response.ok) { const data = await response.json().catch(() => ({})); setError(data.error || "Unable to archive plan"); return; }
    await load();
  };

  return <div>
    <div className="flex items-center justify-between mb-6">
      <div><h2 className="text-2xl font-extrabold text-slate-900">Membership Plans</h2><p className="text-slate-500 text-sm">Configure the products your gym sells.</p></div>
      <button onClick={() => start()} className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm cursor-pointer"><Plus size={16} /> New Plan</button>
    </div>
    {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>}
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {loading ? <p className="p-12 text-center text-slate-400 text-sm">Loading plans...</p> : plans.length === 0 ? <div className="p-12 text-center"><p className="text-slate-700 font-semibold">Create your first membership plan</p><p className="text-slate-400 text-sm mt-1">Members cannot be enrolled until at least one active plan exists.</p><button onClick={() => start()} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer">Create Plan</button></div> : <table className="w-full"><thead><tr className="bg-slate-50 border-b border-slate-200"><th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Plan</th><th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Duration</th><th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Price</th><th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Status</th><th /></tr></thead><tbody>{plans.map((plan) => <tr key={plan.id} className="border-b border-slate-100"><td className="px-4 py-3"><p className="font-semibold text-sm text-slate-900">{plan.name}</p><p className="text-xs text-slate-400">{plan.description || "No description"}</p></td><td className="px-4 py-3 text-sm text-slate-600">{plan.duration} days</td><td className="px-4 py-3 text-sm font-semibold text-slate-900">PKR {Number(plan.price).toLocaleString()}</td><td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-1 rounded-full ${plan.isActive === false ? "bg-slate-100 text-slate-500" : "bg-green-100 text-green-700"}`}>{plan.isActive === false ? "Archived" : "Active"}</span></td><td className="px-4 py-3 text-right"><button onClick={() => start(plan)} className="p-2 text-slate-400 hover:text-blue-600 bg-transparent border-none cursor-pointer"><Pencil size={15} /></button>{plan.isActive !== false && <button onClick={() => archive(plan)} className="p-2 text-slate-400 hover:text-red-600 bg-transparent border-none cursor-pointer"><Archive size={15} /></button>}</td></tr>)}</tbody></table>}
    </div>
    {open && <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4"><form onSubmit={save} className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4"><div className="flex justify-between items-center"><h3 className="font-bold text-lg">{editing ? "Edit Plan" : "New Plan"}</h3><button type="button" onClick={() => setOpen(false)} className="border-none bg-transparent text-slate-400 cursor-pointer"><X size={18} /></button></div>{error && <p className="text-sm text-red-600">{error}</p>}<input required placeholder="Plan name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" /><div className="grid grid-cols-2 gap-3"><input required min="1" type="number" placeholder="Duration (days)" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" /><input required min="0" type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" /></div><textarea placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" /><button disabled={saving} className="w-full bg-blue-600 text-white rounded-xl py-2.5 font-semibold text-sm cursor-pointer disabled:opacity-50">{saving ? "Saving..." : "Save Plan"}</button></form></div>}
  </div>;
}
