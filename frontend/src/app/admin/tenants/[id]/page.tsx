"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Building2, Users, ShieldCheck, CreditCard, Mail, Phone,
  Calendar, AlertCircle, Loader2, Plus, Trash2, X, KeyRound, ExternalLink,
} from "lucide-react";

interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  lastLoginAt: string | null;
  joinedAt: string;
  isActive: boolean;
  role: { id: string; name: string; slug: string } | null;
}

interface Role {
  id: string;
  name: string;
  slug: string;
  isSystem: boolean;
  permissionCount: number;
}

interface TenantDetail {
  tenant: {
    id: string;
    name: string;
    slug: string;
    industry: string;
    plan: string;
    status: string;
    createdAt: string;
    trialEndsAt?: string;
    timezone?: string;
    currency?: string;
    _count: { users: number; roles: number };
  };
  members: Member[];
  roles: Role[];
  subscription: {
    package: string;
    amount: number;
    periodStart: string;
    periodEnd: string;
    paidAt: string;
    current: boolean;
  } | null;
}

const PLANS = ["TRIAL", "STARTER", "PROFESSIONAL", "ENTERPRISE"];

const statusColor = (s: string) => {
  if (s === "ACTIVE") return "bg-emerald-100 text-emerald-700";
  if (s === "TRIAL") return "bg-blue-100 text-blue-700";
  if (s === "SUSPENDED") return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-600";
};

export default function TenantDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", roleId: "", password: "" });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [tempPassword, setTempPassword] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/tenants/${params.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Tenant not found");
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tenant");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  const patchTenant = async (body: Record<string, unknown>) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/tenants/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (res.ok) await load();
    } finally {
      setActionLoading(false);
    }
  };

  const toggleStatus = () => {
    if (!data) return;
    patchTenant({ status: data.tenant.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" });
  };

  const deleteTenant = async () => {
    if (!data) return;
    if (!window.confirm(`Permanently delete "${data.tenant.name}" and ALL of its data? This cannot be undone.`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/tenants/${params.id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) router.push("/admin/tenants");
      else alert("Failed to delete tenant");
    } finally {
      setActionLoading(false);
    }
  };

  const openWorkspace = () => {
    if (!data) return;
    document.cookie = `active_tenant_id=${data.tenant.id}; path=/; max-age=86400; samesite=lax`;
    window.location.href = "/dashboard";
  };

  const teamUrl = (path: string) => `/api/team${path}${path.includes("?") ? "&" : "?"}tenantId=${params.id}`;

  const openAdd = () => {
    setForm({ name: "", email: "", roleId: data?.roles[0]?.id || "", password: "" });
    setFormError("");
    setTempPassword("");
    setShowAdd(true);
  };

  const createMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const res = await fetch(teamUrl("/members"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name || undefined,
          email: form.email,
          roleId: form.roleId,
          password: form.password || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error || "Failed to add member");
        return;
      }
      setTempPassword(json.temporaryPassword || "");
      setForm({ name: "", email: "", roleId: data?.roles[0]?.id || "", password: "" });
      await load();
    } finally {
      setSaving(false);
    }
  };

  const changeRole = async (member: Member, roleId: string) => {
    const res = await fetch(teamUrl(`/members/${member.id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ roleId }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      alert(json.error || "Failed to change role");
    }
    await load();
  };

  const toggleMember = async (member: Member) => {
    const res = await fetch(teamUrl(`/members/${member.id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isActive: !member.isActive }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      alert(json.error || "Failed to update member");
    }
    await load();
  };

  const removeMember = async (member: Member) => {
    if (!window.confirm(`Remove ${member.name} (${member.email})? Their account will be deleted.`)) return;
    const res = await fetch(teamUrl(`/members/${member.id}`), { method: "DELETE", credentials: "include" });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      alert(json.error || "Failed to remove member");
    }
    await load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 size={22} className="animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center">
        <AlertCircle size={28} className="mx-auto text-red-500 mb-3" />
        <p className="text-slate-700 font-semibold">{error || "Tenant not found"}</p>
        <Link href="/admin/tenants" className="text-blue-600 text-sm hover:underline mt-2 inline-block">Back to tenants</Link>
      </div>
    );
  }

  const { tenant, members, roles, subscription } = data;

  return (
    <div>
      <button
        onClick={() => router.push("/admin/tenants")}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-5 cursor-pointer border-none bg-transparent"
      >
        <ArrowLeft size={15} /> All tenants
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#0d3b3f] text-white flex items-center justify-center">
            <Building2 size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">{tenant.name}</h2>
            <p className="text-slate-500 text-sm">{tenant.slug} · {tenant.industry}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColor(tenant.status)}`}>
            {tenant.status}
          </span>
          <button
            onClick={openWorkspace}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#0d3b3f] text-white hover:opacity-90 cursor-pointer border-none"
          >
            <ExternalLink size={13} /> Open workspace
          </button>
          <button
            onClick={toggleStatus}
            disabled={actionLoading}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer border-none transition-colors disabled:opacity-50 ${
              tenant.status === "ACTIVE" ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
            }`}
          >
            {actionLoading ? "..." : tenant.status === "ACTIVE" ? "Suspend" : "Activate"}
          </button>
          <button
            onClick={deleteTenant}
            disabled={actionLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 cursor-pointer border-none disabled:opacity-50"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { icon: Users, label: "Team members", value: tenant._count.users },
          { icon: ShieldCheck, label: "Roles", value: tenant._count.roles },
          { icon: CreditCard, label: "Plan", value: tenant.plan },
          { icon: Calendar, label: "Created", value: new Date(tenant.createdAt).toLocaleDateString() },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4">
            <s.icon size={16} className="text-slate-400 mb-2" />
            <p className="text-lg font-bold text-slate-900">{s.value}</p>
            <p className="text-slate-500 text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Plan + Subscription */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><CreditCard size={15} /> Subscription</h3>
          <label className="flex items-center gap-2 text-xs text-slate-500">
            Plan
            <select
              value={tenant.plan}
              onChange={(e) => patchTenant({ plan: e.target.value })}
              disabled={actionLoading}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:border-blue-400"
            >
              {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
        </div>
        {subscription ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div><p className="text-slate-400 text-xs mb-0.5">Package</p><p className="text-slate-800 font-semibold">{subscription.package}</p></div>
            <div><p className="text-slate-400 text-xs mb-0.5">Amount</p><p className="text-slate-800 font-semibold">{tenant.currency || "PKR"} {subscription.amount.toLocaleString()}</p></div>
            <div><p className="text-slate-400 text-xs mb-0.5">Period end</p><p className="text-slate-800 font-semibold">{new Date(subscription.periodEnd).toLocaleDateString()}</p></div>
            <div>
              <p className="text-slate-400 text-xs mb-0.5">Status</p>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${subscription.current ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                {subscription.current ? "Current" : "Expired"}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-slate-400 text-sm">No platform subscription recorded (leased by hand from the Payments screen).</p>
        )}
        {tenant.trialEndsAt && (
          <p className="text-xs text-slate-400 mt-3">Trial ends {new Date(tenant.trialEndsAt).toLocaleDateString()}</p>
        )}
      </div>

      {/* Members */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-6">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Users size={15} /> Team members</h3>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer border-none"
          >
            <Plus size={13} /> Add member
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Member</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Contact</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-sm">No members yet.</td></tr>
              ) : members.map((m) => (
                <tr key={m.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-5 py-3.5">
                    <p className="text-slate-900 font-semibold text-sm">{m.name}</p>
                    <p className="text-slate-400 text-xs">{m.lastLoginAt ? `Last login ${new Date(m.lastLoginAt).toLocaleDateString()}` : "Never logged in"}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <select
                      value={m.role?.id || ""}
                      onChange={(e) => changeRole(m, e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:border-blue-400"
                    >
                      {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1"><Mail size={12} className="text-slate-400" />{m.email}</span>
                      {m.phone && <span className="flex items-center gap-1"><Phone size={12} className="text-slate-400" />{m.phone}</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggleMember(m)}
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer border-none ${m.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                    >
                      {m.isActive ? "Active" : "Disabled"}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => removeMember(m)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer border-none bg-transparent"
                      title="Remove member"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Roles */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><ShieldCheck size={15} /> Roles</h3>
          <button
            onClick={openWorkspace}
            className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer border-none bg-transparent"
          >
            Manage permissions in workspace →
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {roles.map((r) => (
            <div key={r.id} className="border border-slate-100 rounded-lg px-3.5 py-3">
              <div className="flex items-center justify-between">
                <p className="text-slate-800 text-sm font-semibold">{r.name}</p>
                {r.isSystem && <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">SYSTEM</span>}
              </div>
              <p className="text-slate-400 text-xs mt-1">{r.permissionCount} permissions</p>
            </div>
          ))}
        </div>
      </div>

      {/* Add member modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-900 font-bold text-lg">Add team member</h3>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer border-none bg-transparent">
                <X size={18} />
              </button>
            </div>

            {tempPassword ? (
              <div className="space-y-4">
                <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <KeyRound size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="text-emerald-800 font-semibold">Member created</p>
                    <p className="text-emerald-700 text-xs mt-1">Share this temporary password — it is shown only once:</p>
                    <code className="block mt-2 px-3 py-2 bg-white border border-emerald-200 rounded font-mono text-sm text-slate-900 select-all">{tempPassword}</code>
                  </div>
                </div>
                <button
                  onClick={() => { setTempPassword(""); setShowAdd(false); }}
                  className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 cursor-pointer border-none"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={createMember} className="space-y-3.5">
                {formError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">
                    <AlertCircle size={14} /> {formError}
                  </div>
                )}
                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Optional"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Email</label>
                  <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@company.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Role</label>
                  <select required value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-blue-400">
                    {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Password</label>
                  <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Leave blank to auto-generate"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-blue-400" />
                </div>
                <button type="submit" disabled={saving}
                  className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-50 cursor-pointer border-none">
                  {saving ? "Adding..." : "Add member"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
