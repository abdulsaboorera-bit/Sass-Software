"use client";

import { useEffect, useState } from "react";
import { DollarSign, CheckCircle, Clock, Plus, X } from "lucide-react";

interface FeePayment {
  id: string;
  amount: string;
  month: string;
  year: number;
  status: string;
  paidAt: string | null;
  method: string | null;
  student: { id: string; name: string; admissionNo: string };
}

interface StudentOption {
  id: string;
  name: string;
  admissionNo: string;
}

export default function FeesPage() {
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [statusFilter, setStatusFilter] = useState("");
  const [summary, setSummary] = useState({ totalAmount: 0, totalCount: 0, paidCount: 0, pendingCount: 0 });

  const [modalOpen, setModalOpen] = useState(false);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [form, setForm] = useState({ studentId: "", amount: "", month: "", year: new Date().getFullYear(), method: "CASH" });
  const [saving, setSaving] = useState(false);

  const fetchFees = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    if (statusFilter) params.set("status", statusFilter);

    try {
      const res = await fetch(`/api/school/fees?${params}`, { credentials: "include" });
      const data = await res.json();
      if (data.payments) {
        setPayments(data.payments);
        setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to fetch fees:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/school/students?limit=500", { credentials: "include" });
      const data = await res.json();
      if (data.students) setStudents(data.students);
    } catch (err) {
      console.error("Failed to fetch students:", err);
    }
  };

  useEffect(() => { fetchFees(); }, [month, statusFilter]);
  useEffect(() => { fetchStudents(); }, []);

  const openModal = () => {
    setForm({
      studentId: "",
      amount: "",
      month: month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
      year: new Date().getFullYear(),
      method: "CASH",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/school/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          studentId: form.studentId,
          amount: parseFloat(form.amount),
          month: form.month,
          year: form.year,
          method: form.method,
        }),
      });
      if (res.ok) {
        closeModal();
        fetchFees();
      }
    } catch (err) {
      console.error("Failed to create fee record:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Fee Management</h2>
          <p className="text-slate-500 text-sm">Track and manage student fee payments.</p>
        </div>
        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm border-none cursor-pointer"
        >
          <Plus size={16} /> Collect Fee
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Expected", value: `PKR ${Number(summary.totalAmount).toLocaleString()}`, color: "bg-slate-100 text-slate-700" },
          { label: "Total Records", value: summary.totalCount, color: "bg-blue-100 text-blue-700" },
          { label: "Paid", value: summary.paidCount, color: "bg-green-100 text-green-700" },
          { label: "Pending", value: summary.pendingCount, color: "bg-amber-100 text-amber-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl px-4 py-3 ${s.color}`}>
            <p className="text-xs font-semibold uppercase opacity-70">{s.label}</p>
            <p className="text-xl font-black mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div>
            <label className="block text-slate-600 text-xs font-bold mb-1 uppercase tracking-wide">Month</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-slate-600 text-xs font-bold mb-1 uppercase tracking-wide">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">All</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Student</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Month</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Method</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Paid At</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">Loading...</td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">No fee records found for this period.</td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{p.student.name}</p>
                      <p className="text-xs text-slate-400">{p.student.admissionNo}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{p.month}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">PKR {Number(p.amount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{p.method || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${
                        p.status === "PAID" ? "bg-green-100 text-green-700" :
                        p.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {p.status === "PAID" ? <CheckCircle size={11} /> : <Clock size={11} />}
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 hidden sm:table-cell">
                      {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Fee Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900">Collect Fee</h3>
              <button onClick={closeModal} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer border-none bg-transparent">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Student</label>
                <select
                  required
                  value={form.studentId}
                  onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">Select student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.admissionNo})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Amount (PKR)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Method</label>
                  <select
                    value={form.method}
                    onChange={(e) => setForm({ ...form, method: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="EASYPAISA">EasyPaisa</option>
                    <option value="JAZZCASH">JazzCash</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Month</label>
                  <input
                    required
                    type="month"
                    value={form.month}
                    onChange={(e) => setForm({ ...form, month: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Year</label>
                  <input
                    required
                    type="number"
                    min="2020"
                    max="2030"
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 text-slate-600 font-medium text-sm rounded-xl hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 border-none cursor-pointer"
                >
                  {saving ? "Saving..." : "Collect"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
