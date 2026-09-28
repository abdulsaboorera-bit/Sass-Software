"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";

type Category = "RENT" | "UTILITIES" | "SALARY" | "COMMISSION" | "MAINTENANCE" | "MARKETING" | "SUPPLIES" | "EQUIPMENT" | "INSURANCE" | "OTHER";
interface Expense { id: string; category: Category; description: string; amount: number; date: string; paymentMethod: string; status: string }
const categories: Category[] = ["RENT", "UTILITIES", "SALARY", "COMMISSION", "MAINTENANCE", "MARKETING", "SUPPLIES", "EQUIPMENT", "INSURANCE", "OTHER"];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ category: "RENT" as Category, description: "", amount: "", date: new Date().toISOString().slice(0, 10), paymentMethod: "CASH" });

  const load = async () => {
    setLoading(true); setError("");
    try { const response = await fetch("/api/gym/expenses?limit=100", { credentials: "include" }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to load expenses"); setExpenses(data.expenses || []); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Unable to load expenses"); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setError("");
    try { const response = await fetch("/api/gym/expenses", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, amount: Number(form.amount) }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to save expense"); setOpen(false); setForm({ ...form, description: "", amount: "" }); await load(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Unable to save expense"); }
  };

  return <div><div className="flex items-center justify-between mb-6"><div><h2 className="text-2xl font-extrabold text-slate-900">Expenses</h2><p className="text-slate-500 text-sm">Track operating costs and protect your real profit.</p></div><button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm cursor-pointer"><Plus size={16} /> Add Expense</button></div>{error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}<div className="bg-white border border-slate-200 rounded-xl overflow-x-auto"><table className="w-full min-w-[700px]"><thead><tr className="bg-slate-50 border-b border-slate-200"><th className="text-left px-4 py-3 text-xs text-slate-500 uppercase">Date</th><th className="text-left px-4 py-3 text-xs text-slate-500 uppercase">Category</th><th className="text-left px-4 py-3 text-xs text-slate-500 uppercase">Description</th><th className="text-left px-4 py-3 text-xs text-slate-500 uppercase">Method</th><th className="text-right px-4 py-3 text-xs text-slate-500 uppercase">Amount</th></tr></thead><tbody>{loading ? <tr><td colSpan={5} className="p-12 text-center text-slate-400 text-sm">Loading expenses...</td></tr> : expenses.length === 0 ? <tr><td colSpan={5} className="p-12 text-center text-slate-400 text-sm">No expenses recorded.</td></tr> : expenses.map((expense) => <tr key={expense.id} className="border-b border-slate-100"><td className="px-4 py-3 text-sm text-slate-600">{new Date(expense.date).toLocaleDateString()}</td><td className="px-4 py-3 text-sm text-slate-600">{expense.category}</td><td className="px-4 py-3 text-sm text-slate-900">{expense.description}</td><td className="px-4 py-3 text-sm text-slate-600">{expense.paymentMethod}</td><td className="px-4 py-3 text-right font-semibold text-red-600">PKR {Number(expense.amount).toLocaleString()}</td></tr>)}</tbody></table></div>{open && <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4"><form onSubmit={save} className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4"><div className="flex items-center justify-between"><h3 className="font-bold text-lg">Add Expense</h3><button type="button" onClick={() => setOpen(false)} className="border-none bg-transparent text-slate-400 cursor-pointer"><X size={18} /></button></div><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm">{categories.map((category) => <option key={category}>{category}</option>)}</select><input required placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" /><div className="grid grid-cols-2 gap-3"><input required min="0" type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" /><input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" /></div><select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"><option>CASH</option><option>BANK_TRANSFER</option><option>CARD</option><option>ONLINE</option></select><button className="w-full bg-blue-600 text-white rounded-xl py-2.5 font-semibold text-sm cursor-pointer">Save Expense</button></form></div>}</div>;
}
