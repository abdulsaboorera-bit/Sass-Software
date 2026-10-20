"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { usePermissions } from "@/lib/permissions";

interface Ref { id: string; name: string; patientNo?: string }
interface Invoice {
  id: string;
  invoiceRef: string;
  patientId?: Ref;
  type?: string;
  amount: number;
  paidAmount?: number;
  balance?: number;
  status: string;
  dueDate: string;
}
interface Payment {
  id: string;
  patientId?: Ref;
  amount: number;
  method: string;
  type?: string;
  paidAt: string;
  reference?: string;
}

const METHODS = ["CASH", "BANK_TRANSFER", "CARD", "ONLINE", "JAZZCASH", "EASYPAISA"];
const TYPES = ["CONSULTATION", "PROCEDURE", "LAB", "PHARMACY", "SERVICE", "OTHER"];
const emptyInvoice = { patientId: "", type: "CONSULTATION", amount: "", discount: "", tax: "", dueDate: new Date().toISOString().slice(0, 10), notes: "" };
const emptyPayment = { invoiceId: "", amount: "", method: "CASH", reference: "" };

export default function ClinicBillingPage() {
  const [tab, setTab] = useState<"invoices" | "payments">("invoices");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [patients, setPatients] = useState<Ref[]>([]);
  const [invoiceForm, setInvoiceForm] = useState(emptyInvoice);
  const [paymentForm, setPaymentForm] = useState(emptyPayment);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const { can } = usePermissions();

  const load = async () => {
    try {
      const [invoicesResponse, paymentsResponse, patientsResponse] = await Promise.all([
        fetch("/api/clinic/invoices?limit=100", { credentials: "include" }),
        fetch("/api/clinic/payments?limit=100", { credentials: "include" }),
        fetch("/api/clinic/patients?limit=100", { credentials: "include" }),
      ]);
      const [invoicesData, paymentsData, patientsData] = await Promise.all([
        invoicesResponse.json(), paymentsResponse.json(), patientsResponse.json(),
      ]);
      if (!invoicesResponse.ok) throw new Error(invoicesData.error || "Unable to load billing");
      setInvoices(invoicesData.invoices || []);
      setPayments(paymentsData.payments || []);
      setPatients(patientsData.patients || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to load billing");
    }
  };

  useEffect(() => { void load(); }, []);

  const saveInvoice = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!can("billing.create")) {
      setError("You don't have permission to create invoices");
      return;
    }
    setError("");
    try {
      const response = await fetch("/api/clinic/invoices", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: invoiceForm.patientId,
          type: invoiceForm.type,
          amount: Number(invoiceForm.amount || 0),
          discount: Number(invoiceForm.discount || 0),
          tax: Number(invoiceForm.tax || 0),
          dueDate: invoiceForm.dueDate,
          notes: invoiceForm.notes || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create invoice");
      setInvoiceOpen(false);
      setInvoiceForm(emptyInvoice);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to create invoice");
    }
  };

  const savePayment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!can("billing.create")) {
      setError("You don't have permission to record payments");
      return;
    }
    setError("");
    try {
      const response = await fetch("/api/clinic/payments", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: paymentForm.invoiceId, amount: Number(paymentForm.amount || 0), method: paymentForm.method, reference: paymentForm.reference || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to record payment");
      setPaymentOpen(false);
      setPaymentForm(emptyPayment);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to record payment");
    }
  };

  const cancelInvoice = async (invoice: Invoice) => {
    if (!can("billing.edit")) {
      setError("You don't have permission to cancel invoices");
      return;
    }
    if (!confirm(`Cancel invoice ${invoice.invoiceRef}?`)) return;
    const response = await fetch(`/api/clinic/invoices/${invoice.id}/cancel`, { method: "POST", credentials: "include" });
    if (!response.ok) { const data = await response.json().catch(() => ({})); setError(data.error || "Unable to cancel invoice"); return; }
    await load();
  };

  const markOverdue = async () => {
    if (!can("billing.edit")) {
      setError("You don't have permission to mark invoices overdue");
      return;
    }
    setError(""); setInfo("");
    const response = await fetch("/api/clinic/mark-overdue", { method: "POST", credentials: "include" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setError(data.error || "Unable to mark overdue"); return; }
    setInfo(`Marked ${data.marked ?? 0} invoice(s) as overdue.`);
    await load();
  };

  const openPaymentFor = (invoice: Invoice) => {
    setPaymentForm({ ...emptyPayment, invoiceId: invoice.id, amount: String(invoice.balance ?? Math.max(0, Number(invoice.amount) - Number(invoice.paidAmount || 0))) });
    setPaymentOpen(true);
  };

  const payables = invoices.filter((invoice) => invoice.status !== "PAID" && invoice.status !== "CANCELLED");

  const statusColor = (status: string) =>
    status === "PAID" ? "bg-green-100 text-green-700"
      : status === "OVERDUE" ? "bg-red-100 text-red-700"
        : status === "PARTIAL" ? "bg-blue-100 text-blue-700"
          : status === "CANCELLED" ? "bg-slate-100 text-slate-600"
            : "bg-amber-100 text-amber-700";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Billing</h2>
          <p className="text-slate-500 text-sm">Invoices, outstanding balances, and payments.</p>
        </div>
        <div className="flex items-center gap-2">
          {can("billing.edit") && (
            <button onClick={markOverdue} className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-sm cursor-pointer">Mark Overdue</button>
          )}
          {can("billing.create") && (
            <button onClick={() => (tab === "invoices" ? setInvoiceOpen(true) : setPaymentOpen(true))} className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm cursor-pointer">
              <Plus size={16} /> {tab === "invoices" ? "New Invoice" : "Record Payment"}
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("invoices")} className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer border-none ${tab === "invoices" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>Invoices</button>
        <button onClick={() => setTab("payments")} className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer border-none ${tab === "payments" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>Payments</button>
      </div>

      {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
      {info && <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">{info}</div>}

      {tab === "invoices" ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full min-w-[880px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Ref</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Patient</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Type</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Due</th>
                <th className="text-right px-4 py-3 text-xs uppercase text-slate-500">Amount</th>
                <th className="text-right px-4 py-3 text-xs uppercase text-slate-500">Balance</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-sm">No invoices yet.</td></tr>
              ) : invoices.map((invoice) => {
                const balance = invoice.balance ?? Math.max(0, Number(invoice.amount) - Number(invoice.paidAmount || 0));
                return (
                  <tr key={invoice.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">{invoice.invoiceRef}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{invoice.patientId?.name || "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{invoice.type || "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-600">PKR {Number(invoice.amount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-slate-800">PKR {Number(balance).toLocaleString()}</td>
                    <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor(invoice.status)}`}>{invoice.status}</span></td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
                        <>
                          {can("billing.create") && (
                            <button onClick={() => openPaymentFor(invoice)} className="text-xs text-blue-600 border-none bg-transparent cursor-pointer mr-3">Record payment</button>
                          )}
                          {can("billing.edit") && (
                            <button onClick={() => cancelInvoice(invoice)} className="text-xs text-red-600 border-none bg-transparent cursor-pointer">Cancel</button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Date</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Patient</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Method</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Reference</th>
                <th className="text-right px-4 py-3 text-xs uppercase text-slate-500">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">No payments recorded.</td></tr>
              ) : payments.map((payment) => (
                <tr key={payment.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 text-sm text-slate-600">{new Date(payment.paidAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{payment.patientId?.name || "—"}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{payment.method}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{payment.reference || "—"}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-slate-800">PKR {Number(payment.amount).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {invoiceOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4 overflow-y-auto">
          <form onSubmit={saveInvoice} className="bg-white rounded-2xl w-full max-w-md p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">New Invoice</h3>
              <button type="button" onClick={() => setInvoiceOpen(false)} className="text-slate-400 border-none bg-transparent cursor-pointer"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <select required value={invoiceForm.patientId} onChange={(e) => setInvoiceForm({ ...invoiceForm, patientId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="">Select patient</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.name} {p.patientNo ? `(${p.patientNo})` : ""}</option>)}
              </select>
              <select value={invoiceForm.type} onChange={(e) => setInvoiceForm({ ...invoiceForm, type: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input required type="number" placeholder="Amount" value={invoiceForm.amount} onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input required type="date" value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input type="number" placeholder="Discount" value={invoiceForm.discount} onChange={(e) => setInvoiceForm({ ...invoiceForm, discount: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input type="number" placeholder="Tax" value={invoiceForm.tax} onChange={(e) => setInvoiceForm({ ...invoiceForm, tax: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
              <input placeholder="Notes (optional)" value={invoiceForm.notes} onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <button type="submit" className="mt-5 w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl text-sm cursor-pointer">Create Invoice</button>
          </form>
        </div>
      )}

      {paymentOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4">
          <form onSubmit={savePayment} className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Record Payment</h3>
              <button type="button" onClick={() => setPaymentOpen(false)} className="text-slate-400 border-none bg-transparent cursor-pointer"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <select required value={paymentForm.invoiceId} onChange={(e) => setPaymentForm({ ...paymentForm, invoiceId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="">Select invoice</option>
                {payables.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.invoiceRef} · {invoice.patientId?.name || ""} · PKR {Number(invoice.balance ?? Math.max(0, Number(invoice.amount) - Number(invoice.paidAmount || 0))).toLocaleString()}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input required type="number" placeholder="Amount" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <select value={paymentForm.method} onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  {METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
                </select>
              </div>
              <input placeholder="Reference (optional)" value={paymentForm.reference} onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <button type="submit" className="mt-5 w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl text-sm cursor-pointer">Save Payment</button>
          </form>
        </div>
      )}
    </div>
  );
}
