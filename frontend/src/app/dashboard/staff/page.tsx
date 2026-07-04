"use client";

import { useEffect, useState } from "react";

interface Staff { id: string; name: string; role: string; phone: string; email: string | null; salary: string | null; isActive: boolean }

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [form, setForm] = useState({ name: "", role: "", phone: "", email: "", salary: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchStaff = () => {
    fetch("/api/restaurant/staff").then(r => r.json()).then(data => { if (data.staff) setStaff(data.staff); }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchStaff(); }, []);

  const resetForm = () => { setForm({ name: "", role: "", phone: "", email: "", salary: "" }); setEditingStaff(null); setShowForm(false); setError(""); };

  const startEdit = (s: Staff) => {
    setEditingStaff(s);
    setForm({ name: s.name, role: s.role, phone: s.phone, email: s.email || "", salary: s.salary || "" });
    setShowForm(true);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.role || !form.phone) { setError("Name, role, and phone are required"); return; }
    setSubmitting(true);
    setError("");
    try {
      const body: Record<string, unknown> = { name: form.name, role: form.role, phone: form.phone, email: form.email || undefined, salary: form.salary ? parseFloat(form.salary) : undefined };
      if (editingStaff) {
        body.id = editingStaff.id;
        const res = await fetch("/api/restaurant/staff", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
      } else {
        const res = await fetch("/api/restaurant/staff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
      }
      resetForm();
      fetchStaff();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setSubmitting(false); }
  };

  const deleteStaff = async (id: string) => {
    if (!confirm("Remove this staff member?")) return;
    await fetch(`/api/restaurant/staff?id=${id}`, { method: "DELETE" });
    fetchStaff();
  };

  const inputCls = "px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500";

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Staff</h2>
          <p className="text-slate-500 text-sm">{staff.length} staff members</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm border-none cursor-pointer">
          {showForm ? "Cancel" : "Add Staff"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 mb-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-700">{editingStaff ? "Edit Staff" : "New Staff"}</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <input type="text" placeholder="Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
            <input type="text" placeholder="Role *" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className={inputCls} />
            <input type="text" placeholder="Phone *" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} />
            <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} />
            <input type="number" placeholder="Salary" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} className={inputCls} />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={submitting} className="bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 border-none cursor-pointer">
            {submitting ? "Saving..." : editingStaff ? "Update Staff" : "Add Staff"}
          </button>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-slate-200 bg-slate-50">
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Name</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Role</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Phone</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase hidden sm:table-cell">Email</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase hidden sm:table-cell">Salary</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Actions</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">Loading...</td></tr>
            : staff.length === 0 ? <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">No staff members yet.</td></tr>
            : staff.map(s => (
              <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">{s.name}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">{s.role}</span></td>
                <td className="px-4 py-3 text-sm text-slate-600">{s.phone}</td>
                <td className="px-4 py-3 text-sm text-slate-600 hidden sm:table-cell">{s.email || "—"}</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900 hidden sm:table-cell">{s.salary ? `PKR ${Number(s.salary).toLocaleString()}` : "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(s)} className="text-xs text-blue-600 font-semibold hover:text-blue-700 border-none bg-transparent cursor-pointer">Edit</button>
                    <button onClick={() => deleteStaff(s.id)} className="text-xs text-red-500 font-semibold hover:text-red-600 border-none bg-transparent cursor-pointer">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
