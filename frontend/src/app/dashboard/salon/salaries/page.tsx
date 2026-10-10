"use client";

import { useEffect, useState } from "react";
import { CalendarClock, CheckCircle } from "lucide-react";

interface StaffRef { name: string; role?: string; phone?: string }
interface Salary {
  id: string;
  staffId?: StaffRef | string;
  staff?: StaffRef;
  month: string;
  baseSalary: number;
  commission: number;
  bonuses?: number;
  deductions?: number;
  netPay: number;
  status: string;
}
interface Summary { total?: number; base?: number; commission?: number; paid?: number; pending?: number; count?: number }

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export default function SalonSalariesPage() {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [summary, setSummary] = useState<Summary>({});
  const [month, setMonth] = useState(currentMonth());
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const load = async () => {
    try {
      const [salariesResponse, summaryResponse] = await Promise.all([
        fetch(`/api/salon/salaries?month=${month}`, { credentials: "include" }),
        fetch(`/api/salon/salaries/summary?month=${month}`, { credentials: "include" }),
      ]);
      const salariesData = await salariesResponse.json();
      const summaryData = await summaryResponse.json();
      if (!salariesResponse.ok) throw new Error(salariesData.error || "Unable to load salaries");
      setSalaries(salariesData.salaries || []);
      setSummary(summaryData || {});
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to load salaries");
    }
  };

  useEffect(() => { void load(); }, [month]); // eslint-disable-line react-hooks/exhaustive-deps

  const generate = async () => {
    setError(""); setInfo("");
    try {
      const response = await fetch("/api/salon/salaries/generate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to generate payroll");
      setInfo(`Generated ${data.created} payroll record(s), skipped ${data.skipped}.`);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to generate payroll");
    }
  };

  const markPaid = async (salary: Salary) => {
    const response = await fetch(`/api/salon/salaries/${salary.id}/pay`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentMethod: "CASH" }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Unable to mark as paid");
      return;
    }
    await load();
  };

  const staffName = (salary: Salary) => {
    const ref = salary.staff || (typeof salary.staffId === "object" ? salary.staffId : undefined);
    return ref?.name || "—";
  };
  const staffRole = (salary: Salary) => {
    const ref = salary.staff || (typeof salary.staffId === "object" ? salary.staffId : undefined);
    return ref?.role || "";
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Salaries</h2>
          <p className="text-slate-500 text-sm">Monthly payroll with base salary and appointment commissions.</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
          <button onClick={generate} className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm cursor-pointer">
            <CalendarClock size={16} /> Generate Payroll
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
      {info && <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">{info}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Total Payroll</p>
          <p className="font-bold text-slate-900 text-lg mt-1">PKR {Number(summary.total || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Commission</p>
          <p className="font-bold text-slate-900 text-lg mt-1">PKR {Number(summary.commission || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Paid</p>
          <p className="font-bold text-green-700 text-lg mt-1">PKR {Number(summary.paid || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Pending</p>
          <p className="font-bold text-amber-700 text-lg mt-1">PKR {Number(summary.pending || 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Staff</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Month</th>
              <th className="text-right px-4 py-3 text-xs uppercase text-slate-500">Base</th>
              <th className="text-right px-4 py-3 text-xs uppercase text-slate-500">Commission</th>
              <th className="text-right px-4 py-3 text-xs uppercase text-slate-500">Net Pay</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {salaries.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">No payroll for {month}. Generate it above.</td></tr>
            ) : salaries.map((salary) => (
              <tr key={salary.id} className="border-b border-slate-100">
                <td className="px-4 py-3 text-sm font-semibold text-slate-800">{staffName(salary)}<span className="block text-xs text-slate-400 font-normal">{staffRole(salary)}</span></td>
                <td className="px-4 py-3 text-sm text-slate-600">{salary.month}</td>
                <td className="px-4 py-3 text-sm text-right text-slate-600">PKR {Number(salary.baseSalary || 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-right text-slate-600">PKR {Number(salary.commission || 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-slate-800">PKR {Number(salary.netPay || 0).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${salary.status === "PAID" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{salary.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  {salary.status !== "PAID" && (
                    <button onClick={() => markPaid(salary)} className="inline-flex items-center gap-1 text-xs text-green-700 border-none bg-transparent cursor-pointer"><CheckCircle size={14} /> Mark Paid</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
