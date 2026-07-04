"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

interface Book { id: string; title: string; author: string; price: string; quantity: number }
interface Customer { id: string; name: string; phone: string | null }

export default function NewSalePage() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [items, setItems] = useState<{ bookId: string; quantity: number }[]>([]);
  const [discount, setDiscount] = useState("0");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/bookshop/books?limit=200").then(r => r.json()),
      fetch("/api/bookshop/customers").then(r => r.json()),
    ]).then(([booksData, custData]) => {
      if (booksData.books) setBooks(booksData.books);
      if (custData.customers) setCustomers(custData.customers);
    });
  }, []);

  const addItem = () => setItems([...items, { bookId: books[0]?.id || "", quantity: 1 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string | number) => {
    const next = [...items];
    (next[i] as Record<string, unknown>)[field] = value;
    setItems(next);
  };

  const subtotal = items.reduce((sum, item) => {
    const book = books.find(b => b.id === item.bookId);
    return sum + (book ? Number(book.price) * item.quantity : 0);
  }, 0);
  const total = subtotal - (parseFloat(discount) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { setError("Add at least one book"); return; }
    for (const item of items) {
      const book = books.find(b => b.id === item.bookId);
      if (book && item.quantity > book.quantity) {
        setError(`Insufficient stock for "${book.title}" (available: ${book.quantity})`);
        return;
      }
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/bookshop/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customerId || undefined,
          items,
          discount: parseFloat(discount) || 0,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      router.push("/dashboard/sales");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <Link href="/dashboard/sales" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm mb-4 no-underline">
        <ArrowLeft size={14} /> Back to Sales
      </Link>
      <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Record Sale</h2>
      <p className="text-slate-500 text-sm mb-6">Create a new sale transaction.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Customer (optional)</label>
            <select value={customerId} onChange={e => setCustomerId(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
              <option value="">Walk-in customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` (${c.phone})` : ""}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Payment Method</label>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CARD">Card</option>
              <option value="ONLINE">Online</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-slate-700">Books</label>
            <button type="button" onClick={addItem} className="inline-flex items-center gap-1 text-blue-600 text-sm font-semibold hover:text-blue-700 bg-transparent border-none cursor-pointer">
              <Plus size={14} /> Add Book
            </button>
          </div>
          {items.length === 0 ? (
            <p className="text-slate-400 text-sm py-4 text-center border border-dashed border-slate-200 rounded-xl">No books added.</p>
          ) : (
            <div className="space-y-3">
              {items.map((item, i) => {
                const book = books.find(b => b.id === item.bookId);
                return (
                  <div key={i} className="flex gap-2 items-center bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <select value={item.bookId} onChange={e => updateItem(i, "bookId", e.target.value)} className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                      {books.map(b => <option key={b.id} value={b.id}>{b.title} — PKR {Number(b.price).toLocaleString()} (stock: {b.quantity})</option>)}
                    </select>
                    <input type="number" min="1" value={item.quantity} onChange={e => updateItem(i, "quantity", parseInt(e.target.value) || 1)} className="w-16 px-2 py-2 bg-white border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    <span className="text-sm font-semibold text-slate-700 w-24 text-right">PKR {book ? (Number(book.price) * item.quantity).toLocaleString() : 0}</span>
                    <button type="button" onClick={() => removeItem(i)} className="p-2 text-slate-400 hover:text-red-500 bg-transparent border-none cursor-pointer">
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Discount (PKR)</label>
            <input type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>
          <div className="flex items-end">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 w-full text-right">
              <span className="text-slate-500 text-sm">Total: </span>
              <span className="text-xl font-black text-slate-900">PKR {total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button type="submit" disabled={submitting || items.length === 0} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm border-none cursor-pointer">
          {submitting ? "Processing..." : "Complete Sale"}
        </button>
      </form>
    </div>
  );
}
