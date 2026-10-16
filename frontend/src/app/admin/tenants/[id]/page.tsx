"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Building2, Users, ShieldCheck, CreditCard, Mail, Phone,
  Calendar, AlertCircle, Loader2,
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

  const toggleStatus = async () => {
    if (!data) return;
    const newStatus = data.tenant.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setActionLoading(true);
    try {
      await fetch("/api/admin/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: data.tenant.id, status: newStatus }),
      });
      await load();
    } finally {
      setActionLoading(false);
    }
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
        <div className="flex items-center gap-2">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColor(tenant.status)}`}>
            {tenant.status}
          </span>
          <button
            onClick={toggleStatus}
            disabled={actionLoading}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer border-none transition-colors disabled:opacity-50 ${
              tenant.status === "ACTIVE" ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
            }`}
          >
            {actionLoading ? "..." : tenant.status === "ACTIVE" ? "Suspend" : "Activate"}
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

      {/* Subscription */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><CreditCard size={15} /> Subscription</h3>
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
          <span className="text-xs text-slate-400">{members.length} total</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Member</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Role</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Contact</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Last login</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-sm">No members yet.</td></tr>
            ) : members.map((m) => (
              <tr key={m.id} className="border-b border-slate-100 last:border-0">
                <td className="px-5 py-3.5">
                  <p className="text-slate-900 font-semibold text-sm">{m.name}</p>
                  <p className="text-slate-400 text-xs">{m.email}</p>
                </td>
                <td className="px-5 py-3.5">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    {m.role?.name || "—"}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-sm text-slate-600">
                  <div className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-1"><Mail size={12} className="text-slate-400" />{m.email}</span>
                    {m.phone && <span className="flex items-center gap-1"><Phone size={12} className="text-slate-400" />{m.phone}</span>}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-slate-500">{m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleDateString() : "—"}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${m.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {m.isActive ? "Active" : "Disabled"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Roles */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><ShieldCheck size={15} /> Roles</h3>
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
    </div>
  );
}
