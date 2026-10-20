"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { usePermissions } from "@/lib/permissions";

interface Customer {
  id: string;
  customerNo: string;
  name: string;
  phone: string;
  email?: string;
  gender?: string;
  loyaltyPoints?: number;
  totalSpent?: number;
  visits?: number;
  isActive?: boolean;
}

const empty = { name: "", phone: "", email: "", gender: "FEMALE", notes: "" };

export default function SalonCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState(empty);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { can } = usePermissions();

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/salon/customers?limit=100", { credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load customers");
      setCustomers(data.customers || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!can("customers.create")) {
      setError("You don't have permission to add customers");
      return;
    }
    setError("");
    try {
      const response = await fetch("/api/salon/customers", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, email: form.email || undefined, notes: form.notes || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save customer");
      setOpen(false);
      setForm(empty);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to save customer");
    }
  };

  const archive = async (customer: Customer) => {
    if (!can("customers.edit")) {
      setError("You don't have permission to archive customers");
      return;
    }
    if (!confirm(`Archive ${customer.name}?`)) return;
    const response = await fetch(`/api/salon/customers/${customer.id}`, { method: "DELETE", credentials: "include" });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Unable to archive customer");
      return;
    }
    await load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Customers</h2>
          <p className="text-slate-500 text-sm">Your salon client book, loyalty points, and spend.</p>
        </div>
        {can("customers.create") && (
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm cursor-pointer">
            <Plus size={16} /> Add Customer
          </button>
        )}
      </div>

      {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">No</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Name</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Phone</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Gender</th>
              <th className="text-right px-4 py-3 text-xs uppercase text-slate-500">Visits</th>
              <th className="text-right px-4 py-3 text-xs uppercase text-slate-500">Spent</th>
              <th className="text-right px-4 py-3 text-xs uppercase text-slate-500">Points</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-sm">Loading customers...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-sm">No customers yet.</td></tr>
            ) : customers.map((customer) => (
              <tr key={customer.id} className="border-b border-slate-100">
                <td className="px-4 py-3 text-sm text-slate-500">{customer.customerNo}</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-800">{customer.name}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{customer.phone}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{customer.gender || "—"}</td>
                <td className="px-4 py-3 text-sm text-right text-slate-600">{customer.visits ?? 0}</td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-slate-800">PKR {Number(customer.totalSpent || 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-right text-slate-600">{customer.loyaltyPoints ?? 0}</td>
                <td className="px-4 py-3 text-right">
                  {can("customers.edit") && (
                    <button onClick={() => archive(customer)} className="text-xs text-red-600 border-none bg-transparent cursor-pointer">Archive</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4">
          <form onSubmit={save} className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Add Customer</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 border-none bg-transparent cursor-pointer"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <input required placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <input placeholder="Email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
                <option value="OTHER">Other</option>
              </select>
              <textarea placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" rows={2} />
            </div>
            <button type="submit" className="mt-5 w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl text-sm cursor-pointer">Save Customer</button>
          </form>
        </div>
      )}
    </div>
  );
}
