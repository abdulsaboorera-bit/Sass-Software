"use client";

import { useEffect, useState } from "react";

interface Sale { id: string; invoiceNo: string; total: string; paymentMethod: string; createdAt: string; customer: { name: string } | null; saleItems: { quantity: number; book: { title: string } }[] }
interface BookOption { id: string; title: string; price: string; quantity: number }
interface CustomerOption { id: string; name: string }
interface SaleItemForm { bookId: string; quantity: string }

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [books, setBooks] = useState<BookOption[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [form, setForm] = useState({ customerId: "", paymentMethod: "CASH" });
  const [saleItems, setSaleItems] = useState<SaleItemForm[]>([{ bookId: "", quantity: "1" }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchSales = () => {
    fetch("/api/bookshop/sales?limit=50").then(r => r.json()).then(data => { if (data.sales) setSales(data.sales); }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchSales(); }, []);

  const openForm = async () => {
    setShowForm(true);
    setError("");
    const [bRes, cRes] = await Promise.all([
      fetch("/api/bookshop/books?limit=200").then(r => r.json()),
      fetch("/api/bookshop/customers").then(r => r.json()),
    ]);
    if (bRes.books) setBooks(bRes.books);
    if (cRes.customers) setCustomers(cRes.customers);
  };

  const resetForm = () => { setForm({ customerId: "", paymentMethod: "CASH" }); setSaleItems([{ bookId: "", quantity: "1" }]); setShowForm(false); setError(""); };

  const addSaleItem = () => setSaleItems([...saleItems, { bookId: "", quantity: "1" }]);
  const removeSaleItem = (i: number) => setSaleItems(saleItems.filter((_, idx) => idx !== i));
  const updateSaleItem = (i: number, field: string, value: string) => {
    const updated = [...saleItems];
    updated[i] = { ...updated[i], [field]: value };
    setSaleItems(updated);
  };

  const calculatedTotal = saleItems.reduce((sum, item) => {
    const book = books.find(b => b.id === item.bookId);
    return sum + (book ? Number(book.price) * (parseInt(item.quantity) || 0) : 0);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = saleItems.filter(i => i.bookId && parseInt(i.quantity) > 0);
    if (validItems.length === 0) { setError("Add at least one item"); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/bookshop/sales", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: form.customerId || undefined,
          paymentMethod: form.paymentMethod,
          items: validItems.map(i => ({ bookId: i.bookId, quantity: parseInt(i.quantity) })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      resetForm();
      fetchSales();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setSubmitting(false); }
  };

  const inputCls = "px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500";

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Sales</h2>
          <p className="text-slate-500 text-sm">Transaction history and invoices.</p>
        </div>
        <button onClick={() => { resetForm(); openForm(); }} className="bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm border-none cursor-pointer">
          {showForm ? "Cancel" : "New Sale"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 mb-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-700">Record Sale</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <select value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })} className={inputCls}>
              <option value="">Walk-in customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })} className={inputCls}>
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CARD">Card</option>
              <option value="ONLINE">Online</option>
            </select>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase">Items</p>
            {saleItems.map((item, i) => (
              <div key={i} className="flex gap-2 items-center">
                <select value={item.bookId} onChange={e => updateSaleItem(i, "bookId", e.target.value)} className={`${inputCls} flex-1`}>
                  <option value="">Select book *</option>
                  {books.map(b => <option key={b.id} value={b.id}>{b.title} — PKR {Number(b.price).toLocaleString()} ({b.quantity} in stock)</option>)}
                </select>
                <input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={e => updateSaleItem(i, "quantity", e.target.value)} className={`${inputCls} w-20`} />
                {saleItems.length > 1 && <button type="button" onClick={() => removeSaleItem(i)} className="text-red-500 text-xs font-semibold border-none bg-transparent cursor-pointer">✕</button>}
              </div>
            ))}
            <button type="button" onClick={addSaleItem} className="text-blue-600 text-xs font-semibold border-none bg-transparent cursor-pointer hover:text-blue-700">+ Add book</button>
          </div>
          <p className="text-sm font-bold text-slate-900">Total: PKR {calculatedTotal.toLocaleString()}</p>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={submitting} className="bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 border-none cursor-pointer">
            {submitting ? "Creating..." : "Record Sale"}
          </button>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-slate-200 bg-slate-50">
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Invoice</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Customer</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Items</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Total</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Method</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400 text-sm">Loading...</td></tr>
            : sales.length === 0 ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400 text-sm">No sales yet.</td></tr>
            : sales.map(s => (
              <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-mono text-slate-600">{s.invoiceNo}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{s.customer?.name || "Walk-in"}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{s.saleItems.map(i => `${i.book.title} x${i.quantity}`).join(", ")}</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">PKR {Number(s.total).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{s.paymentMethod}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
