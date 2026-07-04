"use client";

import { useState, useMemo } from "react";
import { BarChart3, Users, Calendar, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type ReportTab = "membership" | "attendance" | "revenue" | "trainers" | "pnl";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("revenue");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [months, setMonths] = useState(6);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async (tab: ReportTab) => {
    setLoading(true); setData(null);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      if (tab === "revenue") params.set("months", String(months));

      const res = await fetch(`/api/gym/reports/${tab}?${params}`, { credentials: "include" });
      const json = await res.json();
      setData(json);
    } catch { setData(null); }
    setLoading(false);
  };

  const handleTabChange = (tab: ReportTab) => {
    setActiveTab(tab);
    fetchReport(tab);
  };

  const tabs: { key: ReportTab; label: string; icon: typeof BarChart3 }[] = [
    { key: "revenue", label: "Revenue", icon: DollarSign },
    { key: "membership", label: "Membership", icon: Users },
    { key: "attendance", label: "Attendance", icon: Calendar },
    { key: "trainers", label: "Trainers", icon: TrendingUp },
    { key: "pnl", label: "P&L", icon: BarChart3 },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Reports</h2>
          <p className="text-slate-500 text-sm">Analytics and business intelligence</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          {activeTab === "revenue" && (
            <select value={months} onChange={e => setMonths(Number(e.target.value))}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value={3}>3 months</option>
              <option value={6}>6 months</option>
              <option value={12}>12 months</option>
            </select>
          )}
          <button onClick={() => fetchReport(activeTab)}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors border-none cursor-pointer">
            Generate
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => handleTabChange(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all border-none cursor-pointer ${
              activeTab === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 bg-transparent"
            }`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && <div className="text-center py-12 text-slate-400 text-sm">Generating report...</div>}
      {!loading && !data && (
        <div className="text-center py-16 text-slate-400">
          <BarChart3 size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm">Select a report type and click <strong>Generate</strong> to view analytics.</p>
        </div>
      )}
      {!loading && data && (
        <div className="space-y-6">
          {activeTab === "revenue" && <RevenueReport data={data} />}
          {activeTab === "membership" && <MembershipReport data={data} />}
          {activeTab === "attendance" && <AttendanceReport data={data} />}
          {activeTab === "trainers" && <TrainerReport data={data} />}
          {activeTab === "pnl" && <PnLReport data={data} />}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: typeof DollarSign; color: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}><Icon size={18} /></div>
      <div>
        <p className="text-xl font-black text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function RevenueReport({ data }: { data: any }) {
  const chartData = useMemo(() => {
    if (!data?.series) return [];
    return data.series.map((s: any) => ({
      name: MONTHS[s.month - 1] || `${s.month}`,
      Revenue: s.revenue,
      Expenses: s.expenses,
      Profit: s.profit,
    }));
  }, [data]);

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={`PKR ${Number(data.totalRevenue || 0).toLocaleString()}`} icon={DollarSign} color="bg-blue-50 text-blue-600" />
        <StatCard label="Total Expenses" value={`PKR ${Number(data.totalExpenses || 0).toLocaleString()}`} icon={AlertTriangle} color="bg-red-50 text-red-600" />
        <StatCard label="Net Profit" value={`PKR ${Number(data.netProfit || 0).toLocaleString()}`} icon={TrendingUp} color="bg-green-50 text-green-600" />
        <StatCard label="Pending" value={`PKR ${Number(data.pendingAmount || 0).toLocaleString()}`} icon={DollarSign} color="bg-amber-50 text-amber-600" />
      </div>
      {chartData.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Revenue vs Expenses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip formatter={(v: number) => [`PKR ${v.toLocaleString()}`, ""]} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
              <Legend />
              <Area type="monotone" dataKey="Revenue" stroke="#3b82f6" fill="url(#revGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="Expenses" stroke="#ef4444" fill="url(#expGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="Profit" stroke="#10b981" fill="none" strokeWidth={2} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  );
}

function MembershipReport({ data }: { data: any }) {
  const statusData = useMemo(() => (data?.byStatus || []).map((s: any) => ({ name: s.status, value: s.count })), [data]);
  const planData = useMemo(() => (data?.byPlan || []).map((p: any) => ({ name: p.plan, value: p.count })), [data]);
  const monthData = useMemo(() => (data?.newByMonth || []).map((m: any) => ({ name: MONTHS[m.month - 1], count: m.count })).reverse(), [data]);

  return (
    <>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-bold text-slate-900 text-sm mb-4">By Status</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {statusData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-400 text-center py-8">No data</p>}
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {statusData.map((d: any, i: number) => (
              <span key={d.name} className="flex items-center gap-1 text-xs text-slate-600">
                <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} /> {d.name} ({d.value})
              </span>
            ))}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-bold text-slate-900 text-sm mb-4">By Plan</h3>
          {planData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={planData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" width={80} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-400 text-center py-8">No data</p>}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-bold text-slate-900 text-sm mb-4">New Members by Month</h3>
          {monthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-400 text-center py-8">No data</p>}
        </div>
      </div>
    </>
  );
}

function AttendanceReport({ data }: { data: any }) {
  const dailyData = useMemo(() => (data?.daily || []).map((d: any) => ({ name: d.date?.slice(5) || d.date, checkins: d.count, unique: d.uniqueMembers })).reverse(), [data]);
  const peakData = useMemo(() => (data?.peakHours || []).map((h: any) => ({ name: `${h.hour}:00`, count: h.count })), [data]);

  return (
    <>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Daily Check-ins</h3>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" interval={Math.floor(dailyData.length / 8)} />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
                <Legend />
                <Bar dataKey="checkins" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total" />
                <Bar dataKey="unique" fill="#10b981" radius={[4, 4, 0, 0]} name="Unique" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-400 text-center py-8">No attendance data</p>}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Peak Hours</h3>
          {peakData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={peakData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
                <Area type="monotone" dataKey="count" stroke="#8b5cf6" fill="#8b5cf630" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-400 text-center py-8">No peak hour data</p>}
        </div>
      </div>
      {data?.topMembers?.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Most Active Members</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100">
                <th className="text-left py-2 font-semibold text-slate-500">#</th>
                <th className="text-left py-2 font-semibold text-slate-500">Member</th>
                <th className="text-left py-2 font-semibold text-slate-500">Member No</th>
                <th className="text-right py-2 font-semibold text-slate-500">Visits</th>
              </tr></thead>
              <tbody>
                {data.topMembers.map((m: any, i: number) => (
                  <tr key={m._id} className="border-b border-slate-50">
                    <td className="py-2 text-slate-400">{i + 1}</td>
                    <td className="py-2 font-medium text-slate-900">{m.name}</td>
                    <td className="py-2 text-slate-500 font-mono text-xs">{m.memberNo}</td>
                    <td className="py-2 text-right font-bold text-slate-900">{m.visits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function TrainerReport({ data }: { data: any }) {
  const trainers = data?.trainers || [];
  const chartData = useMemo(() => trainers.map((t: any) => ({
    name: t.name?.split(" ")[0] || "—",
    Members: t.memberCount,
    Active: t.activeMembers,
    Sessions: t.sessions,
  })), [trainers]);

  return (
    <>
      {chartData.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Trainer Workload</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
              <Legend />
              <Bar dataKey="Members" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Active" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Sessions" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-200 bg-slate-50">
            <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase text-xs">Trainer</th>
            <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase text-xs">Specialization</th>
            <th className="text-right px-4 py-3 font-bold text-slate-500 uppercase text-xs">Members</th>
            <th className="text-right px-4 py-3 font-bold text-slate-500 uppercase text-xs">Active</th>
            <th className="text-right px-4 py-3 font-bold text-slate-500 uppercase text-xs">Sessions</th>
            <th className="text-right px-4 py-3 font-bold text-slate-500 uppercase text-xs">Fee</th>
          </tr></thead>
          <tbody>
            {trainers.map((t: any) => (
              <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">{t.name}</td>
                <td className="px-4 py-3 text-slate-600">{t.specialization || "—"}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-900">{t.memberCount}</td>
                <td className="px-4 py-3 text-right font-semibold text-green-700">{t.activeMembers}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-900">{t.sessions}</td>
                <td className="px-4 py-3 text-right text-slate-600">PKR {Number(t.fee).toLocaleString()}</td>
              </tr>
            ))}
            {trainers.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">No trainer data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function PnLReport({ data }: { data: any }) {
  const incomeBreakdown = data?.income?.breakdown || [];
  const expenseBreakdown = data?.expenses?.breakdown || [];

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="font-bold text-slate-900 text-sm mb-4">Income</h3>
        <div className="space-y-2 mb-4">
          {incomeBreakdown.map((item: any) => (
            <div key={item.type} className="flex items-center justify-between py-2 border-b border-slate-50">
              <span className="text-sm text-slate-600">{item.type || "General"}</span>
              <span className="text-sm font-bold text-green-700">PKR {Number(item.total).toLocaleString()}</span>
            </div>
          ))}
          {incomeBreakdown.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No income data</p>}
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <span className="text-sm font-bold text-slate-900">Total Income</span>
          <span className="text-lg font-black text-green-700">PKR {Number(data?.income?.total || 0).toLocaleString()}</span>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="font-bold text-slate-900 text-sm mb-4">Expenses</h3>
        <div className="space-y-2 mb-4">
          {expenseBreakdown.map((item: any) => (
            <div key={item.category} className="flex items-center justify-between py-2 border-b border-slate-50">
              <span className="text-sm text-slate-600">{item.category || "General"}</span>
              <span className="text-sm font-bold text-red-600">PKR {Number(item.total).toLocaleString()}</span>
            </div>
          ))}
          {expenseBreakdown.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No expense data</p>}
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <span className="text-sm font-bold text-slate-900">Total Expenses</span>
          <span className="text-lg font-black text-red-600">PKR {Number(data?.expenses?.total || 0).toLocaleString()}</span>
        </div>
      </div>
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-slate-900">Net Profit / Loss</span>
          <span className={`text-2xl font-black ${(data?.netProfit || 0) >= 0 ? "text-green-700" : "text-red-600"}`}>
            PKR {Number(data?.netProfit || 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
