"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Clock, RefreshCw } from "lucide-react";

interface Salary {
  id: string;
  month: string;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  netPay: number;
  status: string;
  paidAt: string | null;
  staff?: { id: string; name: string; designation?: string } | null;
}

interface Summary {
  total: number;
  base: number;
  bonuses: number;
  deductions: number;
  count: number;
  paid: number;
  pending: number;
}

export default function SalariesPage() {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, base: 0, bonuses: 0, deductions: 0, count: 0, paid: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [listRes, sumRes] = await Promise.all([
        fetch(`/api/school/salaries?month=${month}&limit=500`, { credentials: "include" }),
        fetch(`/api/school/salaries/summary?month=${month}`, { credentials: "include" }),
      ]);
      const listData = await listRes.json();
      const sumData = await sumRes.json();
      if (!listRes.ok) throw new Error(listData.error || "Unable to load payroll");
      setSalaries(Array.isArray(listData.salaries) ? listData.salaries : []);
      setSummary({
        total: sumData.total || 0, base: sumData.base || 0, bonuses: sumData.bonuses || 0,
        deductions: sumData.deductions || 0, count: sumData.count || 0, paid: sumData.paid || 0, pending: sumData.pending || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load payroll");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const handleGenerate = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/school/salaries/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ month }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to generate payroll");
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate payroll");
    } finally {
      setBusy(false);
    }
  };

  const handlePay = async (salary: Salary) => {
    if (!window.confirm(`Mark salary for ${salary.staff?.name || "staff"} as paid?`)) return;
    try {
      const res = await fetch(`/api/school/salaries/${salary.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ paymentMethod: "CASH" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to mark paid");
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to mark paid");
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Payroll</h2>
          <p className="text-slate-500 text-sm">Generate and manage monthly staff salaries.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <button
            onClick={handleGenerate}
            disabled={busy}
            className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm border-none cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={16} className={busy ? "animate-spin" : ""} /> Generate
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      <div className="grid sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Payroll", value: `PKR ${Number(summary.total).toLocaleString()}`, color: "bg-slate-100 text-slate-700" },
          { label: "Paid", value: `PKR ${Number(summary.paid).toLocaleString()}`, color: "bg-green-100 text-green-700" },
          { label: "Pending", value: `PKR ${Number(summary.pending).toLocaleString()}`, color: "bg-amber-100 text-amber-700" },
          { label: "Staff", value: summary.count, color: "bg-blue-100 text-blue-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl px-4 py-3 ${s.color}`}>
            <p className="text-xs font-semibold uppercase opacity-70">{s.label}</p>
            <p className="text-xl font-black mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Staff</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Base</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Bonuses</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Deductions</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Net Pay</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">Loading...</td></tr>
              ) : salaries.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">No payroll for this month. Click Generate to create it.</td></tr>
              ) : (
                salaries.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{s.staff?.name || "—"}</p>
                      <p className="text-xs text-slate-400">{s.staff?.designation || ""}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">PKR {Number(s.baseSalary).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">PKR {Number(s.bonuses).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">PKR {Number(s.deductions).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">PKR {Number(s.netPay).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${
                        s.status === "PAID" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {s.status === "PAID" ? <CheckCircle size={11} /> : <Clock size={11} />}
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {s.status !== "PAID" && (
                        <button
                          onClick={() => handlePay(s)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors border-none cursor-pointer"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
