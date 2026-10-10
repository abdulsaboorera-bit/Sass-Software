"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";

interface Ref { id: string; name: string; customerNo?: string }
interface Invoice {
  id: string;
  invoiceRef: string;
  customerId?: Ref;
  amount: number;
  paidAmount?: number;
  balance?: number;
  status: string;
  dueDate: string;
  type?: string;
}
interface Payment {
  id: string;
  customerId?: Ref;
  amount: number;
  method: string;
  type?: string;
  paidAt: string;
  reference?: string;
}

const METHODS = ["CASH", "BANK_TRANSFER", "CARD", "ONLINE", "JAZZCASH", "EASYPAISA"];
const emptyInvoice = { customerId: "", amount: "", dueDate: new Date().toISOString().slice(0, 10), notes: "" };
const emptyPayment = { invoiceId: "", amount: "", method: "CASH", reference: "" };

export default function SalonBillingPage() {
  const [tab, setTab] = useState<"invoices" | "payments">("invoices");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Ref[]>([]);
  const [invoiceForm, setInvoiceForm] = useState(emptyInvoice);
  const [paymentForm, setPaymentForm] = useState(emptyPayment);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [invoicesResponse, paymentsResponse, customersResponse] = await Promise.all([
        fetch("/api/salon/invoices?limit=100", { credentials: "include" }),
        fetch("/api/salon/payments?limit=100", { credentials: "include" }),
        fetch("/api/salon/customers?limit=100", { credentials: "include" }),
      ]);
      const [invoicesData, paymentsData, customersData] = await Promise.all([
        invoicesResponse.json(), paymentsResponse.json(), customersResponse.json(),
      ]);
      if (!invoicesResponse.ok) throw new Error(invoicesData.error || "Unable to load billing");
      setInvoices(invoicesData.invoices || []);
      setPayments(paymentsData.payments || []);
      setCustomers(customersData.customers || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to load billing");
    }
  };

  useEffect(() => { void load(); }, []);

  const saveInvoice = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      const response = await fetch("/api/salon/invoices", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: invoiceForm.customerId, amount: Number(invoiceForm.amount || 0), dueDate: invoiceForm.dueDate, notes: invoiceForm.notes || undefined }),
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
    setError("");
    try {
      const response = await fetch("/api/salon/payments", {
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
        <button onClick={() => (tab === "invoices" ? setInvoiceOpen(true) : setPaymentOpen(true))} className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm cursor-pointer">
          <Plus size={16} /> {tab === "invoices" ? "New Invoice" : "Record Payment"}
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("invoices")} className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer border-none ${tab === "invoices" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>Invoices</button>
        <button onClick={() => setTab("payments")} className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer border-none ${tab === "payments" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>Payments</button>
      </div>

      {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      {tab === "invoices" ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Ref</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Customer</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Due</th>
                <th className="text-right px-4 py-3 text-xs uppercase text-slate-500">Amount</th>
                <th className="text-right px-4 py-3 text-xs uppercase text-slate-500">Balance</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">No invoices yet.</td></tr>
              ) : invoices.map((invoice) => {
                const balance = invoice.balance ?? Math.max(0, Number(invoice.amount) - Number(invoice.paidAmount || 0));
                return (
                  <tr key={invoice.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">{invoice.invoiceRef}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{invoice.customerId?.name || "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-600">PKR {Number(invoice.amount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-slate-800">PKR {Number(balance).toLocaleString()}</td>
                    <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor(invoice.status)}`}>{invoice.status}</span></td>
                    <td className="px-4 py-3 text-right">
                      {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
                        <button onClick={() => openPaymentFor(invoice)} className="text-xs text-blue-600 border-none bg-transparent cursor-pointer">Record payment</button>
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
                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Customer</th>
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
                  <td className="px-4 py-3 text-sm text-slate-600">{payment.customerId?.name || "—"}</td>
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
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4">
          <form onSubmit={saveInvoice} className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">New Invoice</h3>
              <button type="button" onClick={() => setInvoiceOpen(false)} className="text-slate-400 border-none bg-transparent cursor-pointer"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <select required value={invoiceForm.customerId} onChange={(e) => setInvoiceForm({ ...invoiceForm, customerId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="">Select customer</option>
                {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} {customer.customerNo ? `(${customer.customerNo})` : ""}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input required type="number" placeholder="Amount" value={invoiceForm.amount} onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input required type="date" value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
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
                {payables.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.invoiceRef} · {invoice.customerId?.name || ""} · PKR {Number(invoice.balance ?? Math.max(0, Number(invoice.amount) - Number(invoice.paidAmount || 0))).toLocaleString()}</option>)}
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
