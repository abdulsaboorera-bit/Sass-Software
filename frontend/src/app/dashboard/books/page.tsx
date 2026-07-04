"use client";

import { useEffect, useState } from "react";

interface Book { id: string; title: string; author: string; isbn: string | null; price: string; costPrice: string; quantity: number; category: string | null }

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [form, setForm] = useState({ title: "", author: "", isbn: "", category: "", price: "", costPrice: "", quantity: "1" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchBooks = () => {
    fetch("/api/bookshop/books?limit=50").then(r => r.json()).then(data => { if (data.books) setBooks(data.books); }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchBooks(); }, []);

  const resetForm = () => { setForm({ title: "", author: "", isbn: "", category: "", price: "", costPrice: "", quantity: "1" }); setEditingBook(null); setShowForm(false); setError(""); };

  const startEdit = (b: Book) => {
    setEditingBook(b);
    setForm({ title: b.title, author: b.author, isbn: b.isbn || "", category: b.category || "", price: b.price, costPrice: b.costPrice, quantity: String(b.quantity) });
    setShowForm(true);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.author || !form.price || !form.costPrice) { setError("Title, author, price, and cost price are required"); return; }
    setSubmitting(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        title: form.title, author: form.author, isbn: form.isbn || undefined,
        category: form.category || undefined, price: parseFloat(form.price),
        costPrice: parseFloat(form.costPrice), quantity: parseInt(form.quantity) || 0,
      };
      if (editingBook) {
        body.id = editingBook.id;
        const res = await fetch("/api/bookshop/books", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
      } else {
        const res = await fetch("/api/bookshop/books", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
      }
      resetForm();
      fetchBooks();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setSubmitting(false); }
  };

  const deleteBook = async (id: string) => {
    if (!confirm("Delete this book?")) return;
    await fetch(`/api/bookshop/books?id=${id}`, { method: "DELETE" });
    fetchBooks();
  };

  const inputCls = "px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500";

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Books</h2>
          <p className="text-slate-500 text-sm">{books.length} titles in inventory</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm border-none cursor-pointer">
          {showForm ? "Cancel" : "Add Book"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 mb-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-700">{editingBook ? "Edit Book" : "New Book"}</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <input type="text" placeholder="Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputCls} />
            <input type="text" placeholder="Author *" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} className={inputCls} />
            <input type="text" placeholder="ISBN" value={form.isbn} onChange={e => setForm({ ...form, isbn: e.target.value })} className={inputCls} />
            <input type="text" placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inputCls} />
            <input type="number" step="0.01" placeholder="Price *" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className={inputCls} />
            <input type="number" step="0.01" placeholder="Cost price *" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })} className={inputCls} />
            <input type="number" placeholder="Quantity" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className={inputCls} />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={submitting} className="bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 border-none cursor-pointer">
            {submitting ? "Saving..." : editingBook ? "Update Book" : "Add Book"}
          </button>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-slate-200 bg-slate-50">
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Title</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Author</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase hidden sm:table-cell">ISBN</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Price</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Stock</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Actions</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">Loading...</td></tr>
            : books.length === 0 ? <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">No books yet.</td></tr>
            : books.map(b => (
              <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3"><p className="text-sm font-semibold text-slate-900">{b.title}</p>{b.category && <p className="text-xs text-slate-400">{b.category}</p>}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{b.author}</td>
                <td className="px-4 py-3 text-sm text-slate-600 font-mono hidden sm:table-cell">{b.isbn || "—"}</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">PKR {Number(b.price).toLocaleString()}</td>
                <td className="px-4 py-3"><span className={`text-sm font-semibold ${b.quantity <= 5 ? "text-red-600" : "text-slate-900"}`}>{b.quantity}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(b)} className="text-xs text-blue-600 font-semibold hover:text-blue-700 border-none bg-transparent cursor-pointer">Edit</button>
                    <button onClick={() => deleteBook(b.id)} className="text-xs text-red-500 font-semibold hover:text-red-600 border-none bg-transparent cursor-pointer">Delete</button>
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
