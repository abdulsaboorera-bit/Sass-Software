"use client";

import { useEffect, useState } from "react";
import { DollarSign, CheckCircle, AlertTriangle, Clock, HelpCircle, X } from "lucide-react";

interface PlanInfo {
  label: string;
  days: number;
  amount: number;
}

type Status = "ACTIVE" | "DUE_SOON" | "OVERDUE" | "NEVER_PAID";

interface SubscriptionRow {
  tenant: { id: string; name: string; slug: string; industry: string };
  package: string | null;
  periodEnd: string | null;
  paidAt: string | null;
  status: Status;
}

const STATUS_META: Record<Status, { label: string; color: string; icon: typeof CheckCircle }> = {
  ACTIVE: { label: "Active", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  DUE_SOON: { label: "Due Soon", color: "bg-amber-100 text-amber-700", icon: Clock },
  OVERDUE: { label: "Overdue", color: "bg-red-100 text-red-700", icon: AlertTriangle },
  NEVER_PAID: { label: "Never Paid", color: "bg-slate-100 text-slate-600", icon: HelpCircle },
};

export default function PaymentsPage() {
  const [rows, setRows] = useState<SubscriptionRow[]>([]);
  const [plans, setPlans] = useState<Record<string, PlanInfo>>({});
  const [loading, setLoading] = useState(true);

  const [modalRow, setModalRow] = useState<SubscriptionRow | null>(null);
  const [form, setForm] = useState({ package: "MONTHLY", method: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/billing", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/admin/billing/plans", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([subs, planData]) => {
        if (subs.subscriptions) setRows(subs.subscriptions);
        if (planData.plans) setPlans(planData.plans);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const openRecord = (row: SubscriptionRow) => {
    setModalRow(row);
    setForm({ package: row.package || "MONTHLY", method: "", notes: "" });
    setError("");
  };

  const closeModal = () => { setModalRow(null); setError(""); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalRow) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tenantId: modalRow.tenant.id, package: form.package, method: form.method || undefined, notes: form.notes || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record payment");
      closeModal();
      fetchAll();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const counts = rows.reduce(
    (acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; },
    {} as Record<Status, number>
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Payments</h2>
        <p className="text-slate-500 text-sm">Track each tenant&apos;s software subscription — who&apos;s paid, who isn&apos;t, and who&apos;s coming due.</p>
      </div>

      {/* Summary */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {(Object.keys(STATUS_META) as Status[]).map((s) => {
          const meta = STATUS_META[s];
          return (
            <div key={s} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${meta.color}`}>
                <meta.icon size={18} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{counts[s] || 0}</p>
                <p className="text-xs text-slate-500">{meta.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Packages reference */}
      <div className="flex flex-wrap gap-3 mb-6">
        {Object.entries(plans).map(([key, p]) => (
          <div key={key} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm">
            <span className="font-semibold text-slate-900">{p.label}</span>
            <span className="text-slate-400 mx-1.5">·</span>
            <span className="text-slate-600">${p.amount}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Tenant</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Industry</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Package</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Renews / Expired</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-sm">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-sm">No tenants yet.</td></tr>
            ) : (
              rows.map((r) => {
                const meta = STATUS_META[r.status];
                return (
                  <tr key={r.tenant.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-slate-900 font-semibold text-sm">{r.tenant.name}</p>
                      <p className="text-slate-400 text-xs">{r.tenant.slug}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{r.tenant.industry}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{r.package ? plans[r.package]?.label || r.package : "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${meta.color}`}>
                        <meta.icon size={12} /> {meta.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">
                      {r.periodEnd ? new Date(r.periodEnd).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => openRecord(r)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border-none bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        <DollarSign size={13} /> Record Payment
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Record Payment Modal */}
      {modalRow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900">Record Payment — {modalRow.tenant.name}</h3>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer border-none bg-transparent">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Package</label>
                <select value={form.package} onChange={(e) => setForm({ ...form, package: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                  {Object.entries(plans).map(([key, p]) => (
                    <option key={key} value={key}>{p.label} — ${p.amount}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Method (optional)</label>
                <input type="text" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}
                  placeholder="e.g. Bank Transfer, Cash"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notes (optional)</label>
                <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer border-none bg-transparent">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 cursor-pointer border-none disabled:opacity-50">
                  {saving ? "Saving..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
