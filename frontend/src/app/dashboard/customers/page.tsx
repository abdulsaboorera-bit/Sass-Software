"use client";

import { useEffect, useState } from "react";

interface Customer { id: string; name: string; phone: string | null; email: string | null; loyaltyPoints: number }

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchCustomers = () => {
    fetch("/api/bookshop/customers").then(r => r.json()).then(data => { if (data.customers) setCustomers(data.customers); }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCustomers(); }, []);

  const resetForm = () => { setForm({ name: "", phone: "", email: "" }); setEditingCustomer(null); setShowForm(false); setError(""); };

  const startEdit = (c: Customer) => {
    setEditingCustomer(c);
    setForm({ name: c.name, phone: c.phone || "", email: c.email || "" });
    setShowForm(true);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { setError("Name is required"); return; }
    setSubmitting(true);
    setError("");
    try {
      const body: Record<string, unknown> = { name: form.name, phone: form.phone || undefined, email: form.email || undefined };
      if (editingCustomer) {
        body.id = editingCustomer.id;
        const res = await fetch("/api/bookshop/customers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
      } else {
        const res = await fetch("/api/bookshop/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
      }
      resetForm();
      fetchCustomers();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setSubmitting(false); }
  };

  const deleteCustomer = async (id: string) => {
    if (!confirm("Delete this customer?")) return;
    await fetch(`/api/bookshop/customers?id=${id}`, { method: "DELETE" });
    fetchCustomers();
  };

  const inputCls = "px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500";

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Customers</h2>
          <p className="text-slate-500 text-sm">{customers.length} registered customers</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm border-none cursor-pointer">
          {showForm ? "Cancel" : "Add Customer"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 mb-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-700">{editingCustomer ? "Edit Customer" : "New Customer"}</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            <input type="text" placeholder="Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
            <input type="text" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} />
            <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={submitting} className="bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 border-none cursor-pointer">
            {submitting ? "Saving..." : editingCustomer ? "Update Customer" : "Add Customer"}
          </button>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-slate-200 bg-slate-50">
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Name</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Phone</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Email</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Loyalty Points</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Actions</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400 text-sm">Loading...</td></tr>
            : customers.length === 0 ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400 text-sm">No customers yet.</td></tr>
            : customers.map(c => (
              <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">{c.name}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{c.phone || "—"}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{c.email || "—"}</td>
                <td className="px-4 py-3 text-sm font-semibold text-amber-600">{c.loyaltyPoints} pts</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(c)} className="text-xs text-blue-600 font-semibold hover:text-blue-700 border-none bg-transparent cursor-pointer">Edit</button>
                    <button onClick={() => deleteCustomer(c.id)} className="text-xs text-red-500 font-semibold hover:text-red-600 border-none bg-transparent cursor-pointer">Delete</button>
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
