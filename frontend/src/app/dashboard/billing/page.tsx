"use client";

import { useEffect, useState } from "react";
import { Plus, X, DollarSign, CheckCircle, CreditCard, FileText } from "lucide-react";

interface Invoice {
  id: string;
  invoiceRef: string;
  amount: number;
  paidAmount: number;
  status: string;
  type: string;
  dueDate: string;
  memberId?: { id: string; name: string; memberNo: string; phone?: string };
  createdAt: string;
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  type: string;
  reference?: string;
  paidAt: string;
  memberId?: { id: string; name: string; memberNo: string };
  invoiceId?: string;
}

interface MemberOption { id: string; name: string; memberNo: string }

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"invoices" | "payments">("invoices");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"invoice" | "payment">("invoice");
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [form, setForm] = useState({ invoiceId: "", memberId: "", amount: "", method: "CASH", reference: "", type: "MEMBERSHIP", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");

  const fetchInvoices = () => {
    setLoadError("");
    fetch("/api/gym/billing/invoices?limit=50", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data.invoices) setInvoices(data.invoices); })
      .catch((err: unknown) => setLoadError(err instanceof Error ? err.message : "Failed to load invoices"))
      .finally(() => setLoading(false));
  };

  const fetchPayments = () => {
    setLoadError("");
    fetch("/api/gym/payments?limit=50", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data.payments) setPayments(data.payments); })
      .catch((err: unknown) => setLoadError(err instanceof Error ? err.message : "Failed to load payments"))
      .finally(() => setLoading(false));
  };

  const fetchMembers = () => {
    fetch("/api/gym/members?limit=200", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data.members) setMembers(data.members); })
      .catch(() => {});
  };

  useEffect(() => {
    if (tab === "invoices") fetchInvoices();
    else fetchPayments();
  }, [tab]);

  useEffect(() => { fetchMembers(); }, []);

  const openCreate = (type: "invoice" | "payment") => {
    setModalType(type);
    setForm({ invoiceId: "", memberId: "", amount: "", method: "CASH", reference: "", type: "MEMBERSHIP", notes: "" });
    setError("");
    setModalOpen(true);
  };

  const handleCreate = async () => {
    setSaving(true);
    setError("");
    try {
      if (modalType === "invoice") {
        if (!form.memberId || !form.amount) { setError("Member and amount are required"); setSaving(false); return; }
        const res = await fetch("/api/gym/billing/invoices", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            memberId: form.memberId,
            amount: parseFloat(form.amount),
            type: form.type,
            notes: form.notes || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create invoice");
        setModalOpen(false);
        fetchInvoices();
        fetchPayments();
      } else {
        if (!form.memberId || !form.amount) { setError("Member and amount are required"); setSaving(false); return; }
        const res = await fetch("/api/gym/billing/payments", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invoiceId: form.invoiceId || undefined,
            memberId: form.memberId,
            amount: parseFloat(form.amount),
            method: form.method,
            reference: form.reference || undefined,
            type: form.type,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to record payment");
        setModalOpen(false);
        fetchPayments();
        fetchInvoices();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async (invoice: Invoice) => {
    const balance = Math.max(0, Number(invoice.amount) - Number(invoice.paidAmount || 0));
    if (balance <= 0) return;
    try {
      const res = await fetch("/api/gym/billing/payments", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id, amount: balance, method: "CASH" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed");
      }
      fetchInvoices();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to mark as paid");
    }
  };

  const selectInvoice = (invoiceId: string) => {
    const invoice = invoices.find((item) => item.id === invoiceId);
    if (!invoice) {
      setForm({ ...form, invoiceId: "" });
      return;
    }
    setForm({
      ...form,
      invoiceId,
      memberId: invoice.memberId?.id || "",
      amount: String(Math.max(0, Number(invoice.amount) - Number(invoice.paidAmount || 0))),
      type: invoice.type,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID": return "bg-green-100 text-green-700";
      case "PARTIAL": return "bg-blue-100 text-blue-700";
      case "OVERDUE": return "bg-red-100 text-red-700";
      case "CANCELLED": return "bg-slate-100 text-slate-600";
      default: return "bg-amber-100 text-amber-700";
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Billing</h2>
          <p className="text-slate-500 text-sm">Manage invoices and payments.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => openCreate("invoice")} className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm cursor-pointer">
            <Plus size={16} /> New Invoice
          </button>
          <button onClick={() => openCreate("payment")} className="inline-flex items-center gap-2 bg-green-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-green-700 transition-colors text-sm cursor-pointer">
            <CreditCard size={16} /> Record Payment
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1">
         <button onClick={() => { if (tab === "invoices") fetchInvoices(); else { setTab("invoices"); setLoading(true); } }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all border-none cursor-pointer ${tab === "invoices" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 bg-transparent"}`}>
          <FileText size={14} /> Invoices
        </button>
         <button onClick={() => { if (tab === "payments") fetchPayments(); else { setTab("payments"); setLoading(true); } }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all border-none cursor-pointer ${tab === "payments" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 bg-transparent"}`}>
          <CreditCard size={14} /> Payments
        </button>
      </div>

       {loadError && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{loadError}</div>}

       {/* Invoices Table */}
      {tab === "invoices" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Invoice</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Member</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Due Date</th>
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
                  <td className="px-4 py-3 text-sm font-mono font-semibold text-slate-900">{inv.invoiceRef}</td>
                  <td className="px-4 py-3">
                    {inv.memberId ? (
                      <>
                        <p className="text-sm font-semibold text-slate-900">{inv.memberId.name}</p>
                        <p className="text-xs text-slate-400">{inv.memberId.memberNo}</p>
                      </>
                    ) : <span className="text-slate-400 text-sm">—</span>}
                  </td>
                   <td className="px-4 py-3 text-sm font-semibold text-slate-900"><div>PKR {Number(inv.amount).toLocaleString()}</div><div className="text-[11px] font-normal text-slate-400">Paid {Number(inv.paidAmount || 0).toLocaleString()} · Due {Math.max(0, Number(inv.amount) - Number(inv.paidAmount || 0)).toLocaleString()}</div></td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(inv.status)}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{new Date(inv.dueDate).toLocaleDateString()}</td>
                   <td className="px-4 py-3 text-right">
                     <a href={`/api/gym/insights/invoices/${inv.id}/pdf`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center mr-2 px-2 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600">Receipt</a>
                    {inv.status !== "PAID" && inv.status !== "CANCELLED" && (
                       <button onClick={() => markPaid(inv)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors cursor-pointer">
                        <CheckCircle size={12} /> Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payments Table */}
      {tab === "payments" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Member</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Method</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Type</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Reference</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">Loading...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">No payments yet.</td></tr>
              ) : payments.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-600">{new Date(p.paidAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {p.memberId ? (
                      <>
                        <p className="text-sm font-semibold text-slate-900">{p.memberId.name}</p>
                        <p className="text-xs text-slate-400">{p.memberId.memberNo}</p>
                      </>
                    ) : <span className="text-slate-400 text-sm">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-700">PKR {Number(p.amount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{p.method}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{p.type}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 font-mono">{p.reference || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">{modalType === "invoice" ? "New Invoice" : "Record Payment"}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"><X size={18} /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              {modalType === "payment" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Invoice (optional)</label>
                  <select value={form.invoiceId} onChange={(e) => selectInvoice(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Unapplied payment</option>
                    {invoices.filter((invoice) => !["PAID", "CANCELLED"].includes(invoice.status)).map((invoice) => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.invoiceRef} · {invoice.memberId?.name || "Member"} · PKR {Math.max(0, Number(invoice.amount) - Number(invoice.paidAmount || 0)).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Member *</label>
                <select value={form.memberId} disabled={Boolean(form.invoiceId)} onChange={(e) => setForm({ ...form, memberId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50">
                  <option value="">Select member</option>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.memberNo})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Amount (PKR) *</label>
                <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {modalType === "payment" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Method *</label>
                  <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CARD">Card</option>
                    <option value="ONLINE">Online</option>
                    <option value="JAZZCASH">JazzCash</option>
                    <option value="EASYPAISA">EasyPaisa</option>
                  </select>
                </div>
              )}
              {modalType === "invoice" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="MEMBERSHIP">Membership</option>
                    <option value="RENEWAL">Renewal</option>
                    <option value="PERSONAL_TRAINING">Personal Training</option>
                    <option value="PRODUCT">Product</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              )}
              {modalType === "payment" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Reference</label>
                  <input type="text" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Optional reference"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">Cancel</button>
              <button onClick={handleCreate} disabled={saving || !form.memberId || !form.amount} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer">
                {saving ? "Saving..." : modalType === "invoice" ? "Create Invoice" : "Record Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
