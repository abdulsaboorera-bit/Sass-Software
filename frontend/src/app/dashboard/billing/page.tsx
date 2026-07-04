"use client";

import { useEffect, useState } from "react";
import { Plus, X, DollarSign, CheckCircle } from "lucide-react";

interface Invoice {
  id: string;
  invoiceNo: string;
  totalAmount: string;
  status: string;
  paidAt: string | null;
  items: { description: string; amount: number }[];
  patient: { id: string; name: string; patientNo: string };
  createdAt: string;
}

interface PatientOption { id: string; name: string; patientNo: string }

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [form, setForm] = useState({ patientNo: "", items: [{ description: "", amount: "" }] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchInvoices = () => {
    fetch("/api/clinic/invoices?limit=50", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data.invoices) setInvoices(data.invoices); })
      .finally(() => setLoading(false));
  };

  const fetchPatients = () => {
    fetch("/api/clinic/patients?limit=200", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data.patients) setPatients(data.patients); });
  };

  useEffect(() => { fetchInvoices(); fetchPatients(); }, []);

  const openCreate = () => {
    setForm({ patientNo: "", items: [{ description: "", amount: "" }] });
    setError("");
    setModalOpen(true);
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { description: "", amount: "" }] });

  const removeItem = (i: number) => {
    const items = form.items.filter((_, idx) => idx !== i);
    setForm({ ...form, items: items.length ? items : [{ description: "", amount: "" }] });
  };

  const updateItem = (i: number, field: string, value: string) => {
    const items = [...form.items];
    (items[i] as Record<string, string>)[field] = value;
    setForm({ ...form, items });
  };

  const total = form.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  const handleCreate = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        patientNo: form.patientNo,
        items: form.items.map((item) => ({
          description: item.description,
          amount: parseFloat(item.amount),
        })),
      };
      const res = await fetch("/api/clinic/invoices", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create invoice");
      setModalOpen(false);
      fetchInvoices();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create invoice");
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async (id: string) => {
    try {
      const res = await fetch("/api/clinic/invoices", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "PAID" }),
      });
      if (!res.ok) throw new Error("Failed to update");
      fetchInvoices();
    } catch {
      alert("Failed to mark as paid");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Billing</h2>
          <p className="text-slate-500 text-sm">Manage invoices and payments.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm cursor-pointer">
          <Plus size={16} /> New Invoice
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Invoice</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Patient</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Amount</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Date</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">Loading...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">No invoices yet.</td></tr>
            ) : invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-mono font-semibold text-slate-900">{inv.invoiceNo}</td>
                <td className="px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{inv.patient.name}</p>
                  <p className="text-xs text-slate-400">{inv.patient.patientNo}</p>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">PKR {Number(inv.totalAmount).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${inv.status === "PAID" ? "bg-green-100 text-green-700" : inv.status === "CANCELLED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{new Date(inv.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  {inv.status !== "PAID" && (
                    <button onClick={() => markPaid(inv.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors cursor-pointer">
                      <CheckCircle size={12} /> Mark Paid
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">New Invoice</h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"><X size={18} /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Patient *</label>
                <select value={form.patientNo} onChange={(e) => setForm({ ...form, patientNo: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select patient</option>
                  {patients.map((p) => <option key={p.id} value={p.patientNo}>{p.name} ({p.patientNo})</option>)}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-600">Items *</label>
                  <button onClick={addItem} className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer">+ Add Item</button>
                </div>
                <div className="space-y-2">
                  {form.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input placeholder="Description" value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <input type="number" placeholder="Amount" value={item.amount} onChange={(e) => updateItem(i, "amount", e.target.value)} className="w-28 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      {form.items.length > 1 && (
                        <button onClick={() => removeItem(i)} className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"><X size={14} /></button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-right text-sm font-bold text-slate-900">
                  Total: PKR {total.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">Cancel</button>
              <button onClick={handleCreate} disabled={saving || !form.patientNo || form.items.some((i) => !i.description || !i.amount)} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer">{saving ? "Creating..." : "Create Invoice"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
