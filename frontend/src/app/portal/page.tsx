"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Flame, Trophy, CalendarCheck, Receipt, LogOut } from "lucide-react";

interface Me {
  member: {
    name: string; memberNo: string; status: string; currentStreak: number; longestStreak: number;
    endDate: string; plan?: { name: string } | null; trainer?: { name: string } | null;
  };
  gym?: { name: string; currency: string } | null;
}
interface Badge { code: string; label: string; icon: string }
interface ClassSession { id: string; name: string; dayOfWeek: number; startTime: string; endTime: string; capacity: number; trainerId?: { name: string } | null }
interface Booking { id: string; date: string; status: string; sessionId?: { name: string; startTime: string; endTime: string } | null }

export default function MemberPortal() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [badges, setBadges] = useState<{ earned: Badge[]; locked: Badge[] } | null>(null);
  const [attendance, setAttendance] = useState<{ monthly?: { daysAttended: number } } | null>(null);
  const [invoices, setInvoices] = useState<{ invoices: { id: string; invoiceRef: string; amount: number; status: string; dueDate: string }[] } | null>(null);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingBusy, setBookingBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const authFetch = useCallback((path: string) => {
    const token = localStorage.getItem("member_token");
    return fetch(`/api/gym/portal${path}`, { headers: { Authorization: `Bearer ${token}` } });
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("member_token")) { router.push("/portal/login"); return; }
    (async () => {
      try {
        const responses = await Promise.all([
          authFetch("/me"), authFetch("/badges"), authFetch("/attendance"), authFetch("/invoices"), authFetch("/classes"), authFetch("/bookings"),
        ]);
        if (responses[0].status === 401) { router.push("/portal/login"); return; }
        if (responses.some((response) => !response.ok)) throw new Error("Portal data is temporarily unavailable");
        const [meData, badgesData, attendanceData, invoicesData, classesData, bookingsData] = await Promise.all(responses.map((response) => response.json()));
        setMe(meData);
        setBadges(badgesData);
        setAttendance(attendanceData);
        setInvoices(invoicesData);
        setClasses(classesData.classes || []);
        setBookings(bookingsData.bookings || []);
      } catch {
        setErr("Failed to load your data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [authFetch, router]);

  const logout = () => { localStorage.removeItem("member_token"); router.push("/portal/login"); };

  const nextClassDate = (dayOfWeek: number) => {
    const date = new Date();
    const distance = (dayOfWeek - date.getDay() + 7) % 7 || 7;
    date.setDate(date.getDate() + distance);
    return date.toISOString().slice(0, 10);
  };

  const bookClass = async (sessionId: string, dayOfWeek: number) => {
    setBookingBusy(sessionId);
    try {
      const response = await fetch("/api/gym/portal/bookings", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("member_token")}` }, body: JSON.stringify({ sessionId, date: nextClassDate(dayOfWeek) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to book class");
      setBookings((current) => [data.booking, ...current]);
    } catch (error) { setErr(error instanceof Error ? error.message : "Unable to book class"); }
    finally { setBookingBusy(null); }
  };

  const cancelBooking = async (id: string) => {
    setBookingBusy(id);
    try {
      const response = await fetch(`/api/gym/portal/bookings/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("member_token")}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to cancel booking");
      setBookings((current) => current.map((booking) => booking.id === id ? { ...booking, status: "CANCELLED" } : booking));
    } catch (error) { setErr(error instanceof Error ? error.message : "Unable to cancel booking"); }
    finally { setBookingBusy(null); }
  };

  if (loading) return <div className="min-h-screen grid place-items-center text-slate-400">Loading…</div>;
  if (err || !me) return <div className="min-h-screen grid place-items-center text-red-500">{err || "Not found"}</div>;

  const cur = me.gym?.currency || "PKR";
  const statusColor = me.member.status === "ACTIVE" ? "text-emerald-600 bg-emerald-50 border-emerald-200"
    : me.member.status === "EXPIRED" ? "text-red-600 bg-red-50 border-red-200" : "text-amber-600 bg-amber-50 border-amber-200";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-blue-600 grid place-items-center text-white"><Dumbbell size={18} /></div>
            <div>
              <p className="font-extrabold text-slate-900 dark:text-white leading-tight">{me.gym?.name || "My Gym"}</p>
              <p className="text-xs text-slate-500">Member Portal</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 border-none bg-transparent cursor-pointer">
            <LogOut size={15} /> Logout
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Membership card */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/70 text-xs uppercase tracking-wide">Member</p>
              <p className="text-2xl font-extrabold">{me.member.name}</p>
              <p className="text-white/80 text-sm mt-0.5">{me.member.memberNo}</p>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusColor}`}>{me.member.status}</span>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div><p className="text-white/60 text-xs">Plan</p><p className="font-bold">{me.member.plan?.name || "—"}</p></div>
            <div><p className="text-white/60 text-xs">Valid until</p><p className="font-bold">{new Date(me.member.endDate).toLocaleDateString()}</p></div>
            <div><p className="text-white/60 text-xs">Trainer</p><p className="font-bold">{me.member.trainer?.name || "—"}</p></div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Stat icon={<Flame size={18} className="text-orange-500" />} label="Current streak" value={`${me.member.currentStreak}d`} />
          <Stat icon={<Trophy size={18} className="text-amber-500" />} label="Best streak" value={`${me.member.longestStreak}d`} />
          <Stat icon={<CalendarCheck size={18} className="text-blue-500" />} label="This month" value={`${attendance?.monthly?.daysAttended ?? 0}`} />
        </div>

        {/* Badges */}
        <Section title="Badges">
          <div className="flex flex-wrap gap-2">
            {badges?.earned.length ? badges.earned.map((b) => (
              <span key={b.code} className="inline-flex items-center gap-1.5 text-sm font-semibold bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-3 py-1">
                <span>{b.icon}</span> {b.label}
              </span>
            )) : <p className="text-slate-400 text-sm">No badges yet — check in to earn your first!</p>}
            {badges?.locked.slice(0, 4).map((b) => (
              <span key={b.code} className="inline-flex items-center gap-1.5 text-sm bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1">
                <span className="opacity-50">{b.icon}</span> {b.label}
              </span>
            ))}
          </div>
        </Section>

        <Section title="Classes & bookings">
          {classes.length === 0 ? <p className="text-slate-400 text-sm">No classes are available right now.</p> : <div className="space-y-2">{classes.map((session) => <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 py-2.5"><div><p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{session.name}</p><p className="text-xs text-slate-500">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][session.dayOfWeek]} · {session.startTime} - {session.endTime}</p></div><button disabled={bookingBusy === session.id} onClick={() => bookClass(session.id, session.dayOfWeek)} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold border-none cursor-pointer disabled:opacity-50">{bookingBusy === session.id ? "Booking..." : "Book next class"}</button></div>)}</div>}
          {bookings.filter((booking) => booking.status !== "CANCELLED").length > 0 && <div className="mt-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Your bookings</p>{bookings.filter((booking) => booking.status !== "CANCELLED").map((booking) => <div key={booking.id} className="flex items-center justify-between py-2 text-sm"><span className="text-slate-700 dark:text-slate-200">{booking.sessionId?.name || "Class"} · {new Date(booking.date).toLocaleDateString()}</span><button disabled={bookingBusy === booking.id} onClick={() => cancelBooking(booking.id)} className="text-xs text-red-600 bg-transparent border-none cursor-pointer">Cancel</button></div>)}</div>}
        </Section>

        {/* Invoices */}
        <Section title="Invoices & payments">
          {invoices?.invoices.length ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {invoices.invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2">
                    <Receipt size={15} className="text-slate-400" />
                    <span className="text-sm text-slate-700 dark:text-slate-200">{inv.invoiceRef}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{cur} {Number(inv.amount).toLocaleString()}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${inv.status === "PAID" ? "bg-emerald-100 text-emerald-700" : inv.status === "OVERDUE" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{inv.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-slate-400 text-sm">No invoices.</p>}
        </Section>
      </main>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
      <div className="mb-1">{icon}</div>
      <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
      <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">{title}</h2>
      {children}
    </div>
  );
}
