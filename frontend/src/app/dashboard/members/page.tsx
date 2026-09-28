"use client";

import { Fragment, useEffect, useState, useCallback } from "react";
import { Plus, Search, Pencil, Trash2, X, ChevronDown, ChevronUp, Download, Filter, Calendar, CreditCard } from "lucide-react";

interface Member {
  id: string;
  memberNo: string;
  name: string;
  phone: string;
  email?: string;
  status: string;
  startDate: string;
  endDate: string;
  plan: { id: string; name: string; price: string };
  daysUntilExpiry?: number;
  effectiveStatus?: string;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  duration: number;
}

interface CheckIn {
  id: string;
  checkInTime: string;
  checkOutTime?: string;
  dayKey: string;
}

interface Payment {
  id: string;
  amount: number;
  type: string;
  method: string;
  paidAt: string;
  notes?: string;
}

const emptyForm = {
  memberNo: "",
  name: "",
  phone: "",
  email: "",
  planId: "",
  paymentAmount: "",
  paymentMethod: "CASH",
  status: "ACTIVE",
  freezeReason: "",
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [memberHistory, setMemberHistory] = useState<{ checkins: CheckIn[]; payments: Payment[] }>({ checkins: [], payments: [] });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [renewingMember, setRenewingMember] = useState<Member | null>(null);
  const [renewForm, setRenewForm] = useState({ planId: "", amount: "", paymentAmount: "", paymentMethod: "CASH" });

  const fetchMembers = useCallback(() => {
    setLoading(true);
    setFetchError("");
    const params = new URLSearchParams({ page: String(page), limit: "25" });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/gym/members?${params}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.members) setMembers(data.members);
         if (data.pagination?.total !== undefined) setTotalCount(data.pagination.total);
         setPages(data.pagination?.pages || 1);
      })
      .catch(() => setFetchError("Failed to load members"))
      .finally(() => setLoading(false));
  }, [page, search, statusFilter]);

  const fetchPlans = () => {
    fetch("/api/gym/plans", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.plans) setPlans(data.plans.filter((p: Plan & { isActive?: boolean }) => p.isActive !== false));
      });
  };

  useEffect(() => { fetchMembers(); }, [fetchMembers]);
  useEffect(() => { fetchPlans(); }, []);

  const fetchMemberHistory = async (memberId: string) => {
    setHistoryLoading(true);
    try {
      const [checkinsRes, paymentsRes] = await Promise.all([
        fetch(`/api/gym/checkins?memberId=${memberId}&limit=10`, { credentials: "include" }).then(r => r.json()).catch(() => ({ checkIns: [] })),
        fetch(`/api/gym/payments?memberId=${memberId}&limit=10`, { credentials: "include" }).then(r => r.json()).catch(() => ({ payments: [] })),
      ]);
      setMemberHistory({
        checkins: checkinsRes.checkIns || [],
        payments: paymentsRes.payments || [],
      });
    } catch {
      setMemberHistory({ checkins: [], payments: [] });
    }
    setHistoryLoading(false);
  };

  const toggleExpand = (memberId: string) => {
    if (expandedMember === memberId) {
      setExpandedMember(null);
    } else {
      setExpandedMember(memberId);
      fetchMemberHistory(memberId);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (m: Member) => {
    setEditing(m);
    setForm({
      memberNo: m.memberNo,
      name: m.name,
      phone: m.phone,
      email: m.email || "",
      planId: m.plan?.id || "",
      paymentAmount: "",
      paymentMethod: "CASH",
      status: m.status,
      freezeReason: "",
    });
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setError("");
  };

  const openRenew = (member: Member) => {
    setRenewingMember(member);
    setRenewForm({ planId: member.plan?.id || "", amount: member.plan ? String(member.plan.price) : "", paymentAmount: "", paymentMethod: "CASH" });
    setError("");
  };

  const renew = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!renewingMember) return;
    setSaving(true); setError("");
    try {
      const response = await fetch(`/api/gym/members/${renewingMember.id}/renew`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: renewForm.planId, amount: Number(renewForm.amount), paymentAmount: Number(renewForm.paymentAmount || 0), paymentMethod: renewForm.paymentMethod, createInvoice: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to renew membership");
      setRenewingMember(null); fetchMembers();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Unable to renew membership"); }
    finally { setSaving(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editing) {
        const res = await fetch("/api/gym/members", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
             body: JSON.stringify({
            id: editing.id,
            name: form.name,
            phone: form.phone,
            email: form.email || undefined,
            planId: form.planId || undefined,
            status: form.status,
            freezeReason: form.freezeReason || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update member");
      } else {
        const res = await fetch("/api/gym/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            memberNo: form.memberNo,
            name: form.name,
            phone: form.phone,
             email: form.email || undefined,
             planId: form.planId,
             createInvoice: true,
             paymentAmount: form.paymentAmount ? Number(form.paymentAmount) : 0,
             paymentMethod: form.paymentMethod,
           }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create member");
      }
      closeModal();
      fetchMembers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (m: Member) => {
    if (!confirm(`Archive member "${m.name}" (${m.memberNo})? Financial and attendance history will be preserved.`)) return;
    try {
      const res = await fetch(`/api/gym/members?id=${m.id}`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      fetchMembers();
    } catch {
      alert("Failed to delete member");
    }
  };

  const exportCSV = () => {
    const headers = ["Member No", "Name", "Phone", "Email", "Plan", "Status", "Start Date", "End Date"];
    const rows = members.map(m => [
      m.memberNo, m.name, m.phone, m.email || "", m.plan?.name || "", m.status,
      new Date(m.startDate).toLocaleDateString(), new Date(m.endDate).toLocaleDateString(),
    ]);
    const csvValue = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map(r => r.map(csvValue).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `members-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-700";
      case "EXPIRED": return "bg-red-100 text-red-700";
      case "FROZEN": return "bg-blue-100 text-blue-700";
      case "CANCELLED": return "bg-slate-100 text-slate-600";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  return (
               <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Members</h2>
          <p className="text-slate-500 text-sm">{totalCount || members.length} total members</p>
               </div>
        <div className="flex items-center gap-3">
          <button onClick={exportCSV} className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 font-semibold px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors text-sm cursor-pointer">
            <Download size={14} /> Export
          </button>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
               onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              placeholder="Search members..."
              className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={statusFilter}
               onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
              className="pl-8 pr-6 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRED">Expired</option>
              <option value="FROZEN">Frozen</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors text-sm border-none cursor-pointer"
          >
            <Plus size={16} /> New Member
          </button>
        </div>
      </div>

      {pages > 1 && <div className="flex items-center justify-between mt-4 text-sm"><span className="text-slate-500">Page {page} of {pages}</span><div className="flex gap-2"><button disabled={page === 1} onClick={() => setPage((current) => current - 1)} className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 cursor-pointer">Previous</button><button disabled={page === pages} onClick={() => setPage((current) => current + 1)} className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 cursor-pointer">Next</button></div></div>}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase w-8"></th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Member</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase hidden md:table-cell">Phone</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase hidden lg:table-cell">Plan</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase hidden lg:table-cell">Expires</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">Loading...</td></tr>
            ) : fetchError ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-red-500 text-sm">{fetchError}</td></tr>
            ) : members.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">No members found.</td></tr>
            ) : (
              members.map((m) => (
                <Fragment key={m.id}>
                  <tr className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-2 py-3">
                      <button onClick={() => toggleExpand(m.id)} className="p-1 rounded hover:bg-slate-200 text-slate-400 border-none bg-transparent cursor-pointer">
                        {expandedMember === m.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{m.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{m.memberNo}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell">{m.phone}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 hidden lg:table-cell">{m.plan?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(m.effectiveStatus || m.status)}`}>
                        {m.effectiveStatus || m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 hidden lg:table-cell">
                      <span>{new Date(m.endDate).toLocaleDateString()}</span>
                      {m.daysUntilExpiry !== undefined && m.daysUntilExpiry <= 7 && m.daysUntilExpiry > 0 && (
                        <span className="ml-2 text-xs text-orange-600 font-semibold">({m.daysUntilExpiry}d)</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors border-none bg-transparent cursor-pointer">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => openRenew(m)} className="px-2 py-1 rounded-lg hover:bg-green-50 text-xs font-semibold text-green-600 border-none bg-transparent cursor-pointer">Renew</button>
                        <button onClick={() => handleDelete(m)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors border-none bg-transparent cursor-pointer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedMember === m.id && (
                    <tr key={`${m.id}-expand`}>
                      <td colSpan={7} className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1.5">
                              <Calendar size={12} /> Recent Check-ins
                            </h4>
                            {historyLoading ? (
                              <p className="text-xs text-slate-400">Loading...</p>
                            ) : memberHistory.checkins.length === 0 ? (
                              <p className="text-xs text-slate-400">No check-ins yet</p>
                            ) : (
                              <div className="space-y-1">
                                {memberHistory.checkins.map(c => (
                                  <div key={c.id} className="flex items-center justify-between text-xs">
                                    <span className="text-slate-600">{new Date(c.checkInTime).toLocaleDateString()}</span>
                                    <span className="text-slate-400">{new Date(c.checkInTime).toLocaleTimeString()}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1.5">
                              <CreditCard size={12} /> Recent Payments
                            </h4>
                            {historyLoading ? (
                              <p className="text-xs text-slate-400">Loading...</p>
                            ) : memberHistory.payments.length === 0 ? (
                              <p className="text-xs text-slate-400">No payments yet</p>
                            ) : (
                              <div className="space-y-1">
                                {memberHistory.payments.map(p => (
                                  <div key={p.id} className="flex items-center justify-between text-xs">
                                    <span className="text-slate-600">{p.type} — {p.method}</span>
                                    <span className="font-semibold text-slate-900">PKR {Number(p.amount).toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeModal}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">{editing ? "Edit Member" : "New Member"}</h3>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 border-none bg-transparent cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
              {!editing && (
                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Member No</label>
                  <input type="text" required value={form.memberNo} onChange={(e) => setForm({ ...form, memberNo: e.target.value })} placeholder="e.g. M-001"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
              )}
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Name</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Phone</label>
                <input type="text" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone number"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Email (optional)</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email address"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Plan</label>
                <select required value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                  <option value="">Select a plan</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — PKR {Number(p.price).toLocaleString()} ({p.duration} days)</option>
                  ))}
                </select>
              </div>
              {editing && <div className="grid sm:grid-cols-2 gap-3"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white"><option value="ACTIVE">Active</option><option value="FROZEN">Frozen</option><option value="CANCELLED">Cancelled</option></select><input placeholder="Freeze/cancellation reason" value={form.freezeReason} onChange={(e) => setForm({ ...form, freezeReason: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" /></div>}
              {!editing && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Payment collected now</label>
                    <input type="number" min="0" value={form.paymentAmount} onChange={(e) => setForm({ ...form, paymentAmount: e.target.value })} placeholder="0 for unpaid" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Payment method</label>
                    <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white"><option>CASH</option><option>BANK_TRANSFER</option><option>CARD</option><option>ONLINE</option><option>JAZZCASH</option><option>EASYPAISA</option></select>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors bg-white cursor-pointer">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 border-none cursor-pointer">
                  {saving ? "Saving..." : editing ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {renewingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setRenewingMember(null)}>
          <form onSubmit={renew} onClick={(event) => event.stopPropagation()} className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between"><h3 className="text-lg font-bold text-slate-900">Renew {renewingMember.name}</h3><button type="button" onClick={() => setRenewingMember(null)} className="p-1 rounded-lg border-none bg-transparent text-slate-400 cursor-pointer"><X size={18} /></button></div>
            {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
            <select required value={renewForm.planId} onChange={(event) => { const plan = plans.find((item) => item.id === event.target.value); setRenewForm({ ...renewForm, planId: event.target.value, amount: plan ? String(plan.price) : "" }); }} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white"><option value="">Select plan</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} — PKR {Number(plan.price).toLocaleString()}</option>)}</select>
            <div className="grid grid-cols-2 gap-3"><input required min="0" type="number" placeholder="Invoice amount" value={renewForm.amount} onChange={(event) => setRenewForm({ ...renewForm, amount: event.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" /><input min="0" type="number" placeholder="Payment now" value={renewForm.paymentAmount} onChange={(event) => setRenewForm({ ...renewForm, paymentAmount: event.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" /></div>
            <select value={renewForm.paymentMethod} onChange={(event) => setRenewForm({ ...renewForm, paymentMethod: event.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white"><option>CASH</option><option>BANK_TRANSFER</option><option>CARD</option><option>ONLINE</option><option>JAZZCASH</option><option>EASYPAISA</option></select>
            <button disabled={saving} className="w-full bg-green-600 text-white rounded-xl py-2.5 font-semibold text-sm cursor-pointer disabled:opacity-50">{saving ? "Renewing..." : "Renew Membership"}</button>
          </form>
        </div>
      )}
    </div>
  );
}
