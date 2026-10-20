"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { usePermissions } from "@/lib/permissions";

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  paymentMethod: string;
  status?: string;
}
interface Summary { total?: number; count?: number }

const CATEGORIES = ["RENT", "UTILITIES", "SALARY", "COMMISSION", "MAINTENANCE", "MARKETING", "SUPPLIES", "EQUIPMENT", "INSURANCE", "OTHER"];
const METHODS = ["CASH", "BANK_TRANSFER", "CARD", "ONLINE", "JAZZCASH", "EASYPAISA"];
const empty = { category: "SUPPLIES", description: "", amount: "", date: new Date().toISOString().slice(0, 10), paymentMethod: "CASH" };

export default function SalonExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Summary>({});
  const [form, setForm] = useState(empty);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const { can } = usePermissions();

  const load = async () => {
    try {
      const [expensesResponse, summaryResponse] = await Promise.all([
        fetch("/api/salon/expenses?limit=100", { credentials: "include" }),
        fetch("/api/salon/expenses/summary", { credentials: "include" }),
      ]);
      const expensesData = await expensesResponse.json();
      const summaryData = await summaryResponse.json();
      if (!expensesResponse.ok) throw new Error(expensesData.error || "Unable to load expenses");
      setExpenses(expensesData.expenses || []);
      setSummary(summaryData || {});
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to load expenses");
    }
  };

  useEffect(() => { void load(); }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!can("expenses.create")) {
      setError("You don't have permission to add expenses");
      return;
    }
    setError("");
    try {
      const response = await fetch("/api/salon/expenses", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: form.category,
          description: form.description,
          amount: Number(form.amount || 0),
          date: form.date,
          paymentMethod: form.paymentMethod,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save expense");
      setOpen(false);
      setForm(empty);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to save expense");
    }
  };

  const archive = async (expense: Expense) => {
    if (!can("expenses.edit")) {
      setError("You don't have permission to delete expenses");
      return;
    }
    if (!confirm(`Delete "${expense.description}"?`)) return;
    const response = await fetch(`/api/salon/expenses/${expense.id}`, { method: "DELETE", credentials: "include" });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Unable to delete expense");
      return;
    }
    await load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Expenses</h2>
          <p className="text-slate-500 text-sm">Operating costs for the salon.</p>
        </div>
        {can("expenses.create") && (
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm cursor-pointer">
            <Plus size={16} /> Add Expense
          </button>
        )}
      </div>

      {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      <div className="grid grid-cols-2 gap-4 mb-6 max-w-md">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Total Expenses</p>
          <p className="font-bold text-slate-900 text-lg mt-1">PKR {Number(summary.total || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Entries</p>
          <p className="font-bold text-slate-900 text-lg mt-1">{summary.count ?? 0}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Date</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Category</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Description</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Method</th>
              <th className="text-right px-4 py-3 text-xs uppercase text-slate-500">Amount</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">No expenses recorded.</td></tr>
            ) : expenses.map((expense) => (
              <tr key={expense.id} className="border-b border-slate-100">
                <td className="px-4 py-3 text-sm text-slate-600">{new Date(expense.date).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{expense.category}</td>
                <td className="px-4 py-3 text-sm font-medium text-slate-800">{expense.description}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{expense.paymentMethod}</td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-slate-800">PKR {Number(expense.amount).toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  {can("expenses.edit") && (
                    <button onClick={() => archive(expense)} className="text-xs text-red-600 border-none bg-transparent cursor-pointer">Delete</button>
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
              <h3 className="font-bold text-slate-900">Add Expense</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 border-none bg-transparent cursor-pointer"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
              <input required placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input required type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
              <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                {METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
              </select>
            </div>
            <button type="submit" className="mt-5 w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl text-sm cursor-pointer">Save Expense</button>
          </form>
        </div>
      )}
    </div>
  );
}
