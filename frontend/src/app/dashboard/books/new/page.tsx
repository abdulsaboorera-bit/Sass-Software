"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewBookPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", author: "", isbn: "", publisher: "", category: "", price: "", costPrice: "", quantity: "10" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const update = (field: string, value: string) => setForm({ ...form, [field]: value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.author || !form.price || !form.costPrice) { setError("Title, author, price, and cost price are required"); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/bookshop/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          author: form.author,
          isbn: form.isbn || undefined,
          publisher: form.publisher || undefined,
          category: form.category || undefined,
          price: parseFloat(form.price),
          costPrice: parseFloat(form.costPrice),
          quantity: parseInt(form.quantity) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      router.push("/dashboard/books");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl">
      <Link href="/dashboard/books" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm mb-4 no-underline">
        <ArrowLeft size={14} /> Back to Books
      </Link>
      <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Add Book</h2>
      <p className="text-slate-500 text-sm mb-6">Add a new book to your inventory.</p>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-slate-200 rounded-xl p-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Title *</label>
          <input type="text" value={form.title} onChange={e => update("title", e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="Book title" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Author *</label>
          <input type="text" value={form.author} onChange={e => update("author", e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="Author name" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">ISBN</label>
            <input type="text" value={form.isbn} onChange={e => update("isbn", e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="ISBN" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
            <input type="text" value={form.category} onChange={e => update("category", e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="e.g. Fiction" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Publisher</label>
          <input type="text" value={form.publisher} onChange={e => update("publisher", e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="Publisher name" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Selling Price *</label>
            <input type="number" min="0" step="0.01" value={form.price} onChange={e => update("price", e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="0" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Cost Price *</label>
            <input type="number" min="0" step="0.01" value={form.costPrice} onChange={e => update("costPrice", e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="0" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Quantity</label>
            <input type="number" min="0" value={form.quantity} onChange={e => update("quantity", e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="0" />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm border-none cursor-pointer">
          {submitting ? "Adding..." : "Add Book"}
        </button>
      </form>
    </div>
  );
}
