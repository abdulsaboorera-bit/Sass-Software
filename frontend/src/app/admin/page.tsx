"use client";

import { useEffect, useState } from "react";
import { Building2, Users, TrendingUp, DollarSign, ChevronRight, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Stats {
  totalTenants: number;
  totalUsers: number;
  activeTenants: number;
  trialTenants: number;
  revenue: number;
  recentTenants: { id: string; name: string; industry: string; createdAt: string }[];
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [tenantsRes, usersRes] = await Promise.all([
        fetch("/api/admin/tenants?limit=100", { credentials: "include" }),
        fetch("/api/admin/users?limit=100", { credentials: "include" }),
      ]);

      const tenantsData = await tenantsRes.json();
      const usersData = await usersRes.json();

      const tenants = tenantsData.tenants || [];
      const users = usersData.users || [];

      setStats({
        totalTenants: tenantsData.pagination?.total || tenants.length,
        totalUsers: usersData.pagination?.total || users.length,
        activeTenants: tenants.filter((t: { status: string }) => t.status === "ACTIVE").length,
        trialTenants: tenants.filter((t: { status: string }) => t.status === "TRIAL").length,
        revenue: 0,
        recentTenants: tenants.slice(0, 5).map((t: { id: string; name: string; industry: string; createdAt: string }) => ({
          id: t.id,
          name: t.name,
          industry: t.industry,
          createdAt: t.createdAt,
        })),
      });
    } catch (e) {
      setError("Failed to fetch stats. Please ensure you are logged in as a super admin.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
        Loading stats...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 justify-center py-20 text-red-500 text-sm">
        <AlertCircle size={16} />
        {error}
      </div>
    );
  }

  const statCards = [
    { label: "Total Tenants", value: stats?.totalTenants ?? 0, icon: Building2, color: "bg-blue-50 text-blue-600", href: "/admin/tenants" },
    { label: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "bg-emerald-50 text-emerald-600", href: "/admin/users" },
    { label: "Active Tenants", value: stats?.activeTenants ?? 0, icon: TrendingUp, color: "bg-purple-50 text-purple-600", href: "/admin/tenants?status=ACTIVE" },
    { label: "Trial Tenants", value: stats?.trialTenants ?? 0, icon: DollarSign, color: "bg-amber-50 text-amber-600", href: "/admin/tenants?status=TRIAL" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Platform Overview</h2>
        <p className="text-slate-500 text-sm">Manage tenants, users, and platform settings.</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow no-underline group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon size={18} />
              </div>
              <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            <p className="text-slate-500 text-xs mt-0.5">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent Signups */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="text-slate-900 font-bold text-lg mb-4">Recent Signups</h3>
        {stats?.recentTenants && stats.recentTenants.length > 0 ? (
          <div className="space-y-3">
            {stats.recentTenants.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <div>
                  <p className="text-slate-900 font-semibold text-sm">{t.name}</p>
                  <p className="text-slate-500 text-xs">{t.industry}</p>
                </div>
                <span className="text-slate-400 text-xs">
                  {new Date(t.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm">No tenants yet.</p>
        )}
      </div>
    </div>
  );
}
