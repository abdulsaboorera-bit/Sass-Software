"use client";

import { useEffect, useState } from "react";
import { QrCode, CheckCircle, XCircle, Users, UserCog, Plus, X, Download, FileText } from "lucide-react";

type Tab = "members" | "staff";

export default function AttendancePage() {
  const [tab, setTab] = useState<Tab>("members");

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-slate-900">Attendance</h2>
        <p className="text-slate-500 text-sm">Check members in and mark daily staff attendance.</p>
      </div>

      <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1 w-fit">
        <button onClick={() => setTab("members")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all border-none cursor-pointer ${
            tab === "members" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 bg-transparent"
          }`}>
          <Users size={14} /> Members
        </button>
        <button onClick={() => setTab("staff")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all border-none cursor-pointer ${
            tab === "staff" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 bg-transparent"
          }`}>
          <UserCog size={14} /> Staff
        </button>
      </div>

      {tab === "members" ? <MemberAttendance /> : <StaffAttendance />}
    </div>
  );
}

interface CheckInRecord {
  id: string;
  memberId: { name: string; memberNo: string } | string;
  checkInTime: string;
  feeStatus?: string | null;
}

/** "now" formatted for a <input type="datetime-local"> in local time. */
function nowForInput() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const FEE_COLORS: Record<string, string> = {
  PAID: "bg-green-100 text-green-700",
  PENDING: "bg-amber-100 text-amber-700",
  PARTIAL: "bg-orange-100 text-orange-700",
  OVERDUE: "bg-red-100 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

function FeeBadge({ status }: { status?: string | null }) {
  if (!status) return <span className="text-xs text-slate-400">—</span>;
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${FEE_COLORS[status] || "bg-slate-100 text-slate-500"}`}>
      {status}
    </span>
  );
}

function MemberAttendance() {
  const [memberNo, setMemberNo] = useState("");
  const [action, setAction] = useState<"checkin" | "checkout">("checkin");
  const [at, setAt] = useState(nowForInput());
  const [result, setResult] = useState<{ action?: string; member?: { name: string }; feeStatus?: string | null; error?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<CheckInRecord[]>([]);
  const [logLoading, setLogLoading] = useState(true);
  const [summary, setSummary] = useState<{ totalCheckIns: number; uniqueMembers: number; averagePerDay: number } | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);

  const fetchLog = (f = from, t = to) => {
    setLogLoading(true);
    fetch(`/api/gym/attendance?from=${f}&to=${t}&limit=200`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data.checkIns) setLog(data.checkIns); })
      .finally(() => setLogLoading(false));
  };

  const fetchSummary = () => {
    fetch("/api/gym/attendance/summary", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setSummary(data))
      .catch(() => setSummary(null));
  };

  useEffect(() => { fetchLog(today, today); fetchSummary(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/gym/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
         body: JSON.stringify({ memberNo, action, at: new Date(at).toISOString() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ error: data.error });
      } else {
         setResult({ action: data.action, member: data.member, feeStatus: data.feeStatus });
        setMemberNo("");
        setAt(nowForInput());
        if (from === today && to === today) fetchLog(today, today);
        fetchSummary();
      }
    } catch {
      setResult({ error: "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  const exportUrl = (kind: "csv" | "pdf") => `/api/gym/insights/export/attendance.${kind}?from=${from}&to=${to}`;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-slate-900 font-bold text-sm">Member kiosk</h3>
             <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
               <button type="button" onClick={() => setAction("checkin")} className={`px-2.5 py-1 text-xs font-semibold rounded-md border-none cursor-pointer ${action === "checkin" ? "bg-white text-slate-900 shadow-sm" : "bg-transparent text-slate-500"}`}>Check in</button>
               <button type="button" onClick={() => setAction("checkout")} className={`px-2.5 py-1 text-xs font-semibold rounded-md border-none cursor-pointer ${action === "checkout" ? "bg-white text-slate-900 shadow-sm" : "bg-transparent text-slate-500"}`}>Check out</button>
             </div>
           </div>
          <form onSubmit={handleCheckIn} className="space-y-4">
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Member Number</label>
              <div className="relative">
                <QrCode size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  autoFocus
                  type="text"
                  value={memberNo}
                  onChange={e => setMemberNo(e.target.value)}
                  placeholder="Enter member number"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Date &amp; Time</label>
              <input
                type="datetime-local"
                value={at}
                onChange={(e) => setAt(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <p className="text-xs text-slate-400 mt-1">Defaults to now — change it only to record a past check-in.</p>
            </div>
            <button type="submit" disabled={loading || !memberNo} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 border-none cursor-pointer text-sm">
               {loading ? "Processing..." : action === "checkin" ? "Check In" : "Check Out"}
            </button>
          </form>

          {result && (
            <div className={`mt-4 p-4 rounded-xl ${result.error ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}>
              {result.error ? (
                <div className="flex items-center gap-2 text-red-700 text-sm"><XCircle size={16} /> {result.error}</div>
              ) : (
                <div className="flex items-center gap-2 justify-between text-green-700 text-sm">
                   <span className="flex items-center gap-2"><CheckCircle size={16} /> <strong>{result.member?.name}</strong> {result.action === "checkout" ? "checked out" : "checked in"}</span>
                  <FeeBadge status={result.feeStatus} />
                </div>
              )}
            </div>
          )}
        </div>

        {summary && (
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
              <p className="text-xl font-black text-slate-900">{summary.totalCheckIns}</p>
              <p className="text-xs text-slate-500">This Month</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
              <p className="text-xl font-black text-slate-900">{summary.uniqueMembers}</p>
              <p className="text-xs text-slate-500">Unique Members</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
              <p className="text-xl font-black text-slate-900">{summary.averagePerDay}</p>
              <p className="text-xs text-slate-500">Avg / Day</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-900 font-bold text-sm">Previous Attendance</h3>
        </div>
        <div className="flex flex-wrap items-end gap-2 mb-4">
          <div>
            <label className="block text-slate-500 text-[11px] font-bold mb-1 uppercase tracking-wide">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="block text-slate-500 text-[11px] font-bold mb-1 uppercase tracking-wide">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <button onClick={() => fetchLog()} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors border-none cursor-pointer">
            Filter
          </button>
          <a href={exportUrl("csv")} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors bg-white cursor-pointer">
            <Download size={14} /> Excel
          </a>
          <a href={exportUrl("pdf")} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors bg-white cursor-pointer">
            <FileText size={14} /> PDF
          </a>
        </div>
        {logLoading ? (
          <p className="text-sm text-slate-400 text-center py-8">Loading...</p>
        ) : log.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No check-ins in this range.</p>
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {log.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-slate-50 text-sm">
                <span className="font-medium text-slate-900">
                  {typeof c.memberId === "object" ? c.memberId.name : "Member"}
                </span>
                <div className="flex items-center gap-2">
                  <FeeBadge status={c.feeStatus} />
                  <span className="text-slate-400 text-xs">
                    {new Date(c.checkInTime).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface StaffMember {
  id: string;
  name: string;
  phone: string;
  role: string | null;
  status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | null;
}

const STATUS_OPTIONS: { value: "PRESENT" | "ABSENT" | "LATE" | "LEAVE"; label: string; color: string }[] = [
  { value: "PRESENT", label: "Present", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "LATE", label: "Late", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "LEAVE", label: "Leave", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "ABSENT", label: "Absent", color: "bg-red-100 text-red-700 border-red-200" },
];

function StaffAttendance() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", phone: "" });
  const [adding, setAdding] = useState(false);

  const fetchStaff = () => {
    setLoading(true);
    fetch(`/api/gym/staff-attendance?date=${date}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data.staff) setStaff(data.staff); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStaff(); }, [date]);

  const mark = async (staffId: string, status: string) => {
    setMarking(staffId);
    try {
      const res = await fetch("/api/gym/staff-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ staffId, date, status }),
      });
      if (res.ok) {
        setStaff((prev) => prev.map((s) => (s.id === staffId ? { ...s, status: status as StaffMember["status"] } : s)));
      }
    } finally {
      setMarking(null);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch("/api/gym/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(addForm),
      });
      if (res.ok) {
        setAddOpen(false);
        setAddForm({ name: "", phone: "" });
        fetchStaff();
      }
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors text-sm border-none cursor-pointer">
          <Plus size={16} /> Add Staff
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <p className="text-sm text-slate-400 text-center py-12">Loading...</p>
        ) : staff.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-12">No staff yet. Add your first staff member.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {staff.map((s) => (
              <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{s.name}</p>
                  <p className="text-xs text-slate-400">{s.role || "Staff"} · {s.phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      disabled={marking === s.id}
                      onClick={() => mark(s.id, opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all disabled:opacity-50 ${
                        s.status === opt.value ? opt.color : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setAddOpen(false)}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Add Staff</h3>
              <button onClick={() => setAddOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 border-none bg-transparent cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddStaff} className="p-6 space-y-4">
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Name</label>
                <input type="text" required value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} placeholder="Staff name"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Phone</label>
                <input type="text" required value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} placeholder="Phone number"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setAddOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors bg-white cursor-pointer">Cancel</button>
                <button type="submit" disabled={adding} className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 border-none cursor-pointer">
                  {adding ? "Adding..." : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
