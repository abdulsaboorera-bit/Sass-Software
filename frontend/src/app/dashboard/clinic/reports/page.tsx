"use client";

import { useEffect, useState } from "react";
import { Users, Calendar, TrendingUp, AlertCircle, Package, DollarSign, UserCheck, Pill, FlaskConical } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface TopDoctor { doctorId: string; name?: string; specialization?: string; appointments: number; revenue: number }
interface ReportData {
  patients?: { total?: number; newThisMonth?: number };
  appointments?: { today?: number; upcoming?: number; completedToday?: number; pending?: number };
  revenue?: { currentMonth?: number; series?: { year: number; month: number; total: number }[] };
  pendingInvoices?: { count?: number; totalOutstanding?: number };
  inventory?: { totalItems?: number; lowStockCount?: number; expiredCount?: number; totalValue?: number };
  pharmacy?: { today?: { sales?: number; revenue?: number }; month?: { sales?: number; revenue?: number } };
  expenses?: { currentMonth?: number; monthCount?: number };
  payroll?: { total?: number; paid?: number; pending?: number };
  doctorsCount?: number;
  prescriptionsPending?: number;
  labPending?: number;
  topDoctors?: TopDoctor[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ClinicReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/clinic/analytics/dashboard", { credentials: "include" });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || "Unable to load reports");
        setData(json);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Unable to load reports");
      }
    })();
  }, []);

  if (error) return <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>;
  if (!data) return <p className="text-slate-400 text-sm">Loading reports...</p>;

  const cards = [
    { label: "Patients", value: data.patients?.total ?? 0, icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "Today's Appointments", value: data.appointments?.today ?? 0, icon: Calendar, color: "bg-emerald-50 text-emerald-600" },
    { label: "Revenue (month)", value: `PKR ${Number(data.revenue?.currentMonth || 0).toLocaleString()}`, icon: TrendingUp, color: "bg-green-50 text-green-700" },
    { label: "Outstanding", value: `PKR ${Number(data.pendingInvoices?.totalOutstanding || 0).toLocaleString()}`, icon: AlertCircle, color: "bg-red-50 text-red-600" },
    { label: "Pharmacy (month)", value: `PKR ${Number(data.pharmacy?.month?.revenue || 0).toLocaleString()}`, icon: Pill, color: "bg-cyan-50 text-cyan-600" },
    { label: "Expenses (month)", value: `PKR ${Number(data.expenses?.currentMonth || 0).toLocaleString()}`, icon: DollarSign, color: "bg-orange-50 text-orange-600" },
    { label: "Payroll Pending", value: `PKR ${Number(data.payroll?.pending || 0).toLocaleString()}`, icon: UserCheck, color: "bg-purple-50 text-purple-600" },
    { label: "Pending Lab Results", value: data.labPending ?? 0, icon: FlaskConical, color: "bg-indigo-50 text-indigo-600" },
    { label: "Doctors", value: data.doctorsCount ?? 0, icon: Users, color: "bg-slate-100 text-slate-600" },
    { label: "Pending Prescriptions", value: data.prescriptionsPending ?? 0, icon: Pill, color: "bg-amber-50 text-amber-600" },
    { label: "Low Stock Items", value: data.inventory?.lowStockCount ?? 0, icon: Package, color: "bg-amber-50 text-amber-600" },
    { label: "Expired Medicines", value: data.inventory?.expiredCount ?? 0, icon: Package, color: "bg-red-50 text-red-600" },
  ];

  const revenueChart = (data.revenue?.series || []).map((s) => ({ name: MONTHS[s.month - 1] || `${s.month}`, revenue: s.total }));
  const doctorChart = (data.topDoctors || []).map((d) => ({ name: d.name || "Doctor", appointments: d.appointments }));

  return (
    <div>
      <h2 className="text-2xl font-extrabold text-slate-900">Reports</h2>
      <p className="text-slate-500 text-sm mb-6">Patients, appointments, revenue, pharmacy, inventory, and payroll performance.</p>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg grid place-items-center shrink-0 ${card.color}`}><card.icon size={18} /></div>
            <div>
              <p className="text-xs text-slate-500">{card.label}</p>
              <p className="font-bold text-slate-900 text-sm">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h3 className="font-semibold text-sm text-slate-700 mb-3">Revenue — last 6 months</h3>
          <div className="h-64">
            {revenueChart.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChart}>
                  <defs>
                    <linearGradient id="clinicRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: unknown) => [`PKR ${Number(v ?? 0).toLocaleString()}`, "Revenue"]} />
                  <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="url(#clinicRevGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div className="h-full grid place-items-center text-slate-400 text-sm">No revenue yet.</div>}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h3 className="font-semibold text-sm text-slate-700 mb-3">Top doctors (month)</h3>
          <div className="h-64">
            {doctorChart.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={doctorChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="appointments" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-full grid place-items-center text-slate-400 text-sm">No completed appointments yet.</div>}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 mt-4">
        <h3 className="font-semibold text-sm text-slate-700 mb-3">Top doctors by revenue (month)</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 text-xs uppercase text-slate-500">Doctor</th>
                <th className="text-left py-2 text-xs uppercase text-slate-500">Specialization</th>
                <th className="text-right py-2 text-xs uppercase text-slate-500">Appointments</th>
                <th className="text-right py-2 text-xs uppercase text-slate-500">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {(data.topDoctors || []).length === 0 ? (
                <tr><td colSpan={4} className="py-6 text-center text-slate-400 text-sm">No completed appointments yet.</td></tr>
              ) : data.topDoctors!.map((doctor) => (
                <tr key={doctor.doctorId} className="border-b border-slate-50">
                  <td className="py-2.5 text-sm font-medium text-slate-800">{doctor.name || "—"}</td>
                  <td className="py-2.5 text-sm text-slate-600">{doctor.specialization || "—"}</td>
                  <td className="py-2.5 text-sm text-right text-slate-600">{doctor.appointments}</td>
                  <td className="py-2.5 text-sm text-right font-semibold text-slate-800">PKR {Number(doctor.revenue || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
