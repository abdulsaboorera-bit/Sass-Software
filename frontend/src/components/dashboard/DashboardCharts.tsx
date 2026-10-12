"use client";

import { useMemo } from "react";
import { AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface RevenuePoint { year: number; month: number; total: number }
interface AttendancePoint { day: string; count: number }
interface ExpiringMember { id: string; name: string; endDate: string; plan?: { name: string } | null }
interface GymData {
  dashboard?: {
    members?: { total?: number; active?: number; expired?: number; frozen?: number; cancelled?: number; newThisMonth?: number };
    todayCheckins?: number;
    revenue?: { currentMonth?: number };
    pendingPayments?: { count?: number };
    expiringSoon?: number;
    expiringSoonMembers?: ExpiringMember[];
    staffPresentToday?: number;
  };
  revenue?: { series?: RevenuePoint[] };
  attendance?: { trend?: AttendancePoint[] };
  pending?: { count?: number };
}
interface SalonTopService { serviceId: string; name?: string; price?: number; bookings: number }
interface SalonData {
  revenue?: { series?: RevenuePoint[] };
  topServices?: SalonTopService[];
}
interface ClinicTopDoctor { doctorId: string; name?: string; specialization?: string; appointments: number; revenue: number }
interface ClinicData {
  revenue?: { series?: RevenuePoint[] };
  topDoctors?: ClinicTopDoctor[];
}
interface SchoolLowAttendance { studentId: string; name?: string; admissionNo?: string; percent: number }
interface SchoolData {
  revenue?: { series?: RevenuePoint[] };
  attendance?: { trend?: AttendancePoint[] };
  lowAttendance?: { threshold?: number; rows?: SchoolLowAttendance[] };
}

interface DashboardChartsProps {
  industry: string;
  gymData: GymData | null;
  salonData: SalonData | null;
  clinicData: ClinicData | null;
  schoolData: SchoolData | null;
}

const CHART_COLORS = ["#15757b", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function DashboardCharts({ industry, gymData, salonData, clinicData, schoolData }: DashboardChartsProps) {
  const isGym = industry === "GYM";
  const isSalon = industry === "SALON";
  const isClinic = industry === "CLINIC";
  const isSchool = industry === "SCHOOL";

  const revenueChartData = useMemo(() => {
    if (!gymData?.revenue?.series) return [];
    return gymData.revenue.series.map((s: RevenuePoint) => ({
      name: MONTH_NAMES[s.month - 1] || `${s.month}`,
      revenue: s.total,
    }));
  }, [gymData]);

  const attendanceChartData = useMemo(() => {
    if (!gymData?.attendance?.trend) return [];
    return [...gymData.attendance.trend].reverse().map((d: AttendancePoint) => ({
      name: d.day?.slice(5) || d.day,
      checkins: d.count,
    }));
  }, [gymData]);

  const memberStatusData = useMemo(() => {
    if (!gymData?.dashboard?.members) return [];
    const m = gymData.dashboard.members;
    return [
      { name: "Active", value: m.active || 0 },
      { name: "Expired", value: m.expired || 0 },
      { name: "Frozen", value: m.frozen || 0 },
      { name: "Cancelled", value: m.cancelled || 0 },
    ].filter(d => d.value > 0);
  }, [gymData]);

  const salonRevenueChartData = useMemo(() => {
    if (!salonData?.revenue?.series) return [];
    return salonData.revenue.series.map((s: RevenuePoint) => ({
      name: MONTH_NAMES[s.month - 1] || `${s.month}`,
      revenue: s.total,
    }));
  }, [salonData]);

  const clinicRevenueChartData = useMemo(() => {
    if (!clinicData?.revenue?.series) return [];
    return clinicData.revenue.series.map((s: RevenuePoint) => ({
      name: MONTH_NAMES[s.month - 1] || `${s.month}`,
      revenue: s.total,
    }));
  }, [clinicData]);

  const schoolRevenueChartData = useMemo(() => {
    if (!schoolData?.revenue?.series) return [];
    return schoolData.revenue.series.map((s: RevenuePoint) => ({
      name: MONTH_NAMES[s.month - 1] || `${s.month}`,
      revenue: s.total,
    }));
  }, [schoolData]);

  const schoolAttendanceChartData = useMemo(() => {
    if (!schoolData?.attendance?.trend) return [];
    return schoolData.attendance.trend.map((d: AttendancePoint) => ({
      name: d.day?.slice(5) || d.day,
      present: d.count,
    }));
  }, [schoolData]);

  return (
    <>
      {isGym && gymData && (
        <div className="grid lg:grid-cols-3 gap-4 mb-8">
          {/* Revenue Chart */}
          {revenueChartData.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 text-sm">Revenue Trend</h3>
                <span className="text-xs text-slate-400">Last 6 months</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#15757b" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#15757b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                   <Tooltip formatter={(v: unknown) => [`PKR ${Number(v ?? 0).toLocaleString()}`, "Revenue"]} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
                  <Area type="monotone" dataKey="revenue" stroke="#15757b" fill="url(#revGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Member Status Pie */}
          {memberStatusData.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-bold text-slate-900 text-sm mb-4">Member Status</h3>
              <ResponsiveContainer width="100%" height={220}>
                <RePieChart>
                  <Pie data={memberStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                     {memberStatusData.map((_: unknown, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                   <Tooltip formatter={(v: unknown) => [Number(v ?? 0), "Members"]} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
                </RePieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-2">
                 {memberStatusData.map((d: { name: string; value: number }, i: number) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attendance Trend */}
          {attendanceChartData.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 lg:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 text-sm">Attendance Trend</h3>
                <span className="text-xs text-slate-400">Last 30 days</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={attendanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" interval={Math.floor(attendanceChartData.length / 8)} />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
                  <Bar dataKey="checkins" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Salon Charts Row */}
      {isSalon && salonData && (
        <div className="grid lg:grid-cols-3 gap-4 mb-8">
          {salonRevenueChartData.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 text-sm">Revenue Trend</h3>
                <span className="text-xs text-slate-400">Last 6 months</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={salonRevenueChartData}>
                  <defs>
                    <linearGradient id="salonRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#15757b" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#15757b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip formatter={(v: unknown) => [`PKR ${Number(v ?? 0).toLocaleString()}`, "Revenue"]} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
                  <Area type="monotone" dataKey="revenue" stroke="#15757b" fill="url(#salonRevGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {(salonData.topServices?.length || 0) > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-bold text-slate-900 text-sm mb-4">Top Services (month)</h3>
              <div className="space-y-3">
                {salonData.topServices!.slice(0, 5).map((s) => (
                  <div key={s.serviceId} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 truncate">{s.name || "Service"}</span>
                    <span className="font-semibold text-slate-900">{s.bookings} booked</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Clinic Charts Row */}
      {isClinic && clinicData && (
        <div className="grid lg:grid-cols-3 gap-4 mb-8">
          {clinicRevenueChartData.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 text-sm">Revenue Trend</h3>
                <span className="text-xs text-slate-400">Last 6 months</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={clinicRevenueChartData}>
                  <defs>
                    <linearGradient id="clinicRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#15757b" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#15757b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip formatter={(v: unknown) => [`PKR ${Number(v ?? 0).toLocaleString()}`, "Revenue"]} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
                  <Area type="monotone" dataKey="revenue" stroke="#15757b" fill="url(#clinicRevGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {(clinicData.topDoctors?.length || 0) > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-bold text-slate-900 text-sm mb-4">Top Doctors (month)</h3>
              <div className="space-y-3">
                {clinicData.topDoctors!.slice(0, 5).map((d) => (
                  <div key={d.doctorId} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 truncate">{d.name || "Doctor"}</span>
                    <span className="font-semibold text-slate-900">{d.appointments} appts</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* School Charts Row */}
      {isSchool && schoolData && (
        <div className="grid lg:grid-cols-3 gap-4 mb-8">
          {schoolRevenueChartData.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 text-sm">Fee Collection Trend</h3>
                <span className="text-xs text-slate-400">Last 6 months</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={schoolRevenueChartData}>
                  <defs>
                    <linearGradient id="schoolRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#15757b" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#15757b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip formatter={(v: unknown) => [`PKR ${Number(v ?? 0).toLocaleString()}`, "Collected"]} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
                  <Area type="monotone" dataKey="revenue" stroke="#15757b" fill="url(#schoolRevGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {(schoolData.lowAttendance?.rows?.length || 0) > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-bold text-slate-900 text-sm mb-4">Low Attendance (&lt;{schoolData.lowAttendance?.threshold}%)</h3>
              <div className="space-y-3">
                {schoolData.lowAttendance!.rows!.slice(0, 5).map((s) => (
                  <div key={s.studentId} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 truncate">{s.name || "Student"}</span>
                    <span className="font-semibold text-red-600">{s.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {schoolAttendanceChartData.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 lg:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 text-sm">Attendance Trend</h3>
                <span className="text-xs text-slate-400">Last 30 days</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={schoolAttendanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" interval={Math.max(0, Math.floor(schoolAttendanceChartData.length / 8))} />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip formatter={(v: unknown) => [Number(v ?? 0), "Present"]} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
                  <Bar dataKey="present" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </>
  );
}
