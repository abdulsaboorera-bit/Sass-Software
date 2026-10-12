"use client";

import { useEffect, useState } from "react";

interface LowAttendance { studentId: string; name: string; admissionNo: string; percent: number; total: number; present: number }
interface SchoolEvent { id: string; title: string; type: string; startDate: string; location?: string }
interface Notice { id: string; title: string; audience: string; publishedAt: string; isPinned?: boolean }

interface ReportData {
  students: { total: number; active: number; newThisMonth: number };
  teachers: { total: number; active: number };
  classes: number;
  subjects: number;
  attendanceToday: { present: number; absent: number; late: number; leave: number; marked: number; totalActive: number };
  fees: { expected: number; collected: number; paid: number; pending: number; overdue: number; outstanding: number };
  revenue: { currentMonth: number; series: { year: number; month: number; total: number; count: number }[] };
  expenses: { currentMonth: number; monthCount: number };
  payroll: { month: string; total: number; paid: number; pending: number; count: number };
  admissions: { total: number; new: number };
  library: { titles: number; copies: number; available: number; issued: number; overdue: number };
  lowAttendance: { threshold: number; rows: LowAttendance[] };
  upcomingEvents: SchoolEvent[];
  notices: Notice[];
}

function money(v: number | undefined) {
  return `PKR ${Number(v || 0).toLocaleString()}`;
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/school/analytics/dashboard", { credentials: "include" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Unable to load reports");
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load reports");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="text-slate-400 text-sm py-12 text-center">Loading reports...</div>;
  if (error) return <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>;
  if (!data) return null;

  const cards = [
    { label: "Students", value: data.students.total, sub: `${data.students.active} active · ${data.students.newThisMonth} new`, color: "bg-blue-50 text-blue-700" },
    { label: "Teachers", value: data.teachers.total, sub: `${data.teachers.active} active`, color: "bg-indigo-50 text-indigo-700" },
    { label: "Classes", value: data.classes, sub: `${data.subjects} subjects`, color: "bg-purple-50 text-purple-700" },
    { label: "Attendance Today", value: data.attendanceToday.marked, sub: `${data.attendanceToday.present} present · ${data.attendanceToday.absent} absent`, color: "bg-green-50 text-green-700" },
    { label: "Fees Expected", value: money(data.fees.expected), sub: `${money(data.fees.collected)} collected`, color: "bg-amber-50 text-amber-700" },
    { label: "Outstanding Fees", value: money(data.fees.outstanding), sub: `${data.fees.overdue} overdue`, color: "bg-red-50 text-red-700" },
    { label: "Revenue (Month)", value: money(data.revenue.currentMonth), sub: "Paid fees", color: "bg-emerald-50 text-emerald-700" },
    { label: "Expenses (Month)", value: money(data.expenses.currentMonth), sub: `${data.expenses.monthCount} entries`, color: "bg-orange-50 text-orange-700" },
    { label: "Payroll", value: money(data.payroll.total), sub: `${money(data.payroll.pending)} pending`, color: "bg-slate-100 text-slate-700" },
    { label: "Admissions", value: data.admissions.total, sub: `${data.admissions.new} new`, color: "bg-cyan-50 text-cyan-700" },
    { label: "Library", value: data.library.titles, sub: `${data.library.issued} issued · ${data.library.overdue} overdue`, color: "bg-teal-50 text-teal-700" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-slate-900">Reports</h2>
        <p className="text-slate-500 text-sm">Key school metrics at a glance.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-xl px-4 py-4 ${c.color}`}>
            <p className="text-xs font-semibold uppercase opacity-70">{c.label}</p>
            <p className="text-2xl font-black mt-1">{c.value}</p>
            <p className="text-xs opacity-80 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-bold text-slate-900 mb-3">Low Attendance (&lt; {data.lowAttendance.threshold}%)</h3>
          {data.lowAttendance.rows.length === 0 ? (
            <p className="text-sm text-slate-400">No students below the threshold.</p>
          ) : (
            <ul className="space-y-2">
              {data.lowAttendance.rows.map((r) => (
                <li key={r.studentId} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{r.name} <span className="text-slate-400 text-xs">{r.admissionNo}</span></span>
                  <span className="font-semibold text-red-600">{r.percent}%</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-bold text-slate-900 mb-3">Upcoming Events</h3>
          {data.upcomingEvents.length === 0 ? (
            <p className="text-sm text-slate-400">No upcoming events.</p>
          ) : (
            <ul className="space-y-2">
              {data.upcomingEvents.map((e) => (
                <li key={e.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{e.title}</span>
                  <span className="text-slate-400 text-xs">{new Date(e.startDate).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 lg:col-span-2">
          <h3 className="font-bold text-slate-900 mb-3">Recent Notices</h3>
          {data.notices.length === 0 ? (
            <p className="text-sm text-slate-400">No notices published.</p>
          ) : (
            <ul className="space-y-2">
              {data.notices.map((n) => (
                <li key={n.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{n.isPinned ? "📌 " : ""}{n.title}</span>
                  <span className="text-slate-400 text-xs">{n.audience} · {new Date(n.publishedAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
