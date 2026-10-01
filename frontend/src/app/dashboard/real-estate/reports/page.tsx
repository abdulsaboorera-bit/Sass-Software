"use client";

import { useEffect, useState } from "react";
import { Building2, Home, CheckCircle, AlertCircle, Wrench, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

interface DashboardData {
  totalProperties: number; totalUnits: number; occupiedUnits: number; vacantUnits: number; maintenanceUnits: number;
  occupancyRate: number; expectedRent: number; collectedThisMonth: number; expensesThisMonth: number; netIncome: number;
  overdueRent: number; overdueCount: number; upcomingExpirations: number; openMaintenance: number;
  monthly: { month: string; collected: number; expenses: number; net: number }[];
}

export default function ReportsPage() {
  const [data, setData] = useState<DashboardData | null>(null); const [error, setError] = useState("");
  useEffect(() => { (async () => { try { const response = await fetch("/api/real-estate/dashboard", { credentials: "include" }); const json = await response.json(); if (!response.ok) throw new Error(json.error || "Unable to load reports"); setData(json); } catch (e: unknown) { setError(e instanceof Error ? e.message : "Unable to load reports"); } })(); }, []);
  if (error) return <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>;
  if (!data) return <p className="text-slate-400 text-sm">Loading reports...</p>;
  const cards = [
    { label: "Properties", value: data.totalProperties, icon: Building2, color: "bg-blue-50 text-blue-600" },
    { label: "Units", value: `${data.occupiedUnits} / ${data.totalUnits}`, icon: Home, color: "bg-purple-50 text-purple-600" },
    { label: "Occupancy", value: `${data.occupancyRate}%`, icon: CheckCircle, color: "bg-emerald-50 text-emerald-600" },
    { label: "Expected Rent / mo", value: `PKR ${data.expectedRent.toLocaleString()}`, icon: Calendar, color: "bg-amber-50 text-amber-600" },
    { label: "Collected (month)", value: `PKR ${data.collectedThisMonth.toLocaleString()}`, icon: TrendingUp, color: "bg-green-50 text-green-700" },
    { label: "Overdue Rent", value: `PKR ${data.overdueRent.toLocaleString()}`, icon: AlertCircle, color: "bg-red-50 text-red-600" },
    { label: "Expenses (month)", value: `PKR ${data.expensesThisMonth.toLocaleString()}`, icon: TrendingDown, color: "bg-orange-50 text-orange-600" },
    { label: "Open Maintenance", value: data.openMaintenance, icon: Wrench, color: "bg-slate-100 text-slate-600" },
  ];
  const occupancy = [
    { name: "Occupied", value: data.occupiedUnits }, { name: "Vacant", value: data.vacantUnits },
    ...(data.maintenanceUnits ? [{ name: "Maintenance", value: data.maintenanceUnits }] : []),
  ];
  const OCCUPANCY_COLORS = ["#3b82f6", "#10b981", "#f59e0b"];
  return <div><h2 className="text-2xl font-extrabold text-slate-900">Reports</h2><p className="text-slate-500 text-sm mb-6">Portfolio performance, rent collection, and 6-month cashflow.</p><div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">{cards.map((card) => <div key={card.label} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3"><div className={`w-10 h-10 rounded-lg grid place-items-center shrink-0 ${card.color}`}><card.icon size={18} /></div><div><p className="text-xs text-slate-500">{card.label}</p><p className="font-bold text-slate-900 text-sm">{card.value}</p></div></div>)}</div><div className="grid lg:grid-cols-2 gap-4"><div className="bg-white border border-slate-200 rounded-xl p-4"><h3 className="font-semibold text-sm text-slate-700 mb-3">Cashflow — last 6 months</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.monthly}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Legend /><Bar dataKey="collected" name="Collected" fill="#3b82f6" /><Bar dataKey="expenses" name="Expenses" fill="#f59e0b" /></BarChart></ResponsiveContainer></div></div><div className="bg-white border border-slate-200 rounded-xl p-4"><h3 className="font-semibold text-sm text-slate-700 mb-3">Unit occupancy</h3><div className="h-64">{data.totalUnits ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={occupancy} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={{ fontSize: 12 }}>{occupancy.map((_, index) => <Cell key={index} fill={OCCUPANCY_COLORS[index % OCCUPANCY_COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer> : <div className="h-full grid place-items-center text-slate-400 text-sm">No units yet.</div>}</div></div></div></div>;
}
