import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, CheckCircle, ArrowRight, Users, FileText, CreditCard, BarChart3, Calendar, Smartphone } from "lucide-react";

export const metadata: Metadata = {
  title: "School Management System",
  description: "Complete ERP for schools — student records, attendance, fee management, examinations, and parent portal.",
};

const modules = [
  {
    icon: Users, title: "Student Records",
    desc: "Centralized student profiles with academic history, personal info, documents, and emergency contacts.",
    features: ["Digital student profiles", "Academic history", "Document management", "Emergency contacts", "Admission management"],
    color: "text-purple-400", bg: "bg-purple-500/15",
  },
  {
    icon: Calendar, title: "Attendance System",
    desc: "Daily attendance marking by teachers with automated parent notifications and monthly reports.",
    features: ["Class-wise attendance", "Automated parent SMS", "Monthly summaries", "Late arrival tracking", "Leave management"],
    color: "text-blue-400", bg: "bg-blue-500/15",
  },
  {
    icon: CreditCard, title: "Fee Management",
    desc: "Automate fee collection, generate challans, track overdue payments, and send reminders.",
    features: ["Fee challan generation", "Online payment support", "Overdue alerts", "Concession management", "Fee reports"],
    color: "text-orange-400", bg: "bg-orange-500/15",
  },
  {
    icon: FileText, title: "Examinations & Results",
    desc: "Create exam schedules, enter marks, calculate grades, and generate result cards automatically.",
    features: ["Exam scheduling", "Marks entry system", "Grade calculation", "Result card generation", "Position calculation"],
    color: "text-emerald-400", bg: "bg-emerald-500/15",
  },
  {
    icon: GraduationCap, title: "Teacher Management",
    desc: "Manage teacher profiles, timetables, subject assignments, attendance, and payroll.",
    features: ["Teacher profiles", "Timetable management", "Subject assignment", "Teacher attendance", "Payroll integration"],
    color: "text-cyan-400", bg: "bg-cyan-500/15",
  },
  {
    icon: Smartphone, title: "Parent Portal",
    desc: "Give parents real-time access to their child&apos;s attendance, results, fee status, and school notices.",
    features: ["Web & mobile access", "Live attendance updates", "Result & fee viewing", "School announcements", "Direct messaging"],
    color: "text-pink-400", bg: "bg-pink-500/15",
  },
];

const benefits = [
  { stat: "80%", label: "Less Admin Work" },
  { stat: "100%", label: "Digital Records" },
  { stat: "95%", label: "Fee Collection Rate" },
  { stat: "20h", label: "Saved Weekly" },
];

const faqs = [
  { q: "How many students can it handle?", a: "From 50 students to 10,000+, the system scales without any performance issues. It&apos;s used by single-branch schools and large networks alike." },
  { q: "Can parents access it on mobile?", a: "Yes. The parent portal is fully mobile-responsive and works on any smartphone browser. Native mobile apps are available as an add-on." },
  { q: "Does it support multiple classes and sections?", a: "Absolutely. Manage unlimited classes, sections, subjects, and teachers with complex timetable scheduling." },
  { q: "Can we manage fee concessions?", a: "Yes. Define merit-based, need-based, or sibling concessions that apply automatically to the relevant students." },
  { q: "Is there a homework/assignment portal?", a: "Yes. Teachers can assign homework digitally, students can submit, and parents can track — all from the same platform." },
];

export default function SchoolPage() {
  return (
    <>
      <section className="relative pt-24 sm:pt-28 pb-14 sm:pb-20 bg-[#0f172a] overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <div className="badge badge-purple mb-5">
                <GraduationCap size={12} /> Education Solution
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-[1.1] mb-5">
                School{" "}
                <span className="text-white">Management</span>{" "}
                System
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed mb-8 max-w-lg">
                A comprehensive school ERP that digitizes your entire institution — admissions, attendance,
                exams, fees, and communication with parents, all in one place.
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                <Link href="/demo" className="btn-primary">Request Demo <ArrowRight size={16} /></Link>
                <Link href="/pricing" className="btn-secondary">View Pricing</Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {benefits.map((b) => (
                  <div key={b.label} className="text-center glass rounded-xl p-3">
                    <div className="text-2xl font-black text-purple-400 mb-0.5">{b.stat}</div>
                    <div className="text-slate-400 text-xs">{b.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 max-w-md">
              <div className="dashboard-mockup shadow-2xl">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/3">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                  </div>
                  <span className="text-slate-500 text-[11px] ml-2">School Dashboard</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { l: "Total Students", v: "1,240", c: "text-purple-400" },
                      { l: "Present Today", v: "1,187", c: "text-green-400" },
                      { l: "Fee Collected", v: "₨2.1M", c: "text-blue-400" },
                    ].map((s) => (
                      <div key={s.l} className="bg-white/5 rounded-lg p-2.5">
                        <p className="text-[10px] text-slate-500 mb-1">{s.l}</p>
                        <p className={`text-sm font-bold ${s.c}`}>{s.v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-[11px] text-slate-300 font-semibold mb-2">Class Attendance Today</p>
                    {[
                      { c: "Class 10-A", pres: 38, total: 40 },
                      { c: "Class 9-B", pres: 34, total: 37 },
                      { c: "Class 8-A", pres: 42, total: 42 },
                    ].map((cl) => (
                      <div key={cl.c} className="mb-1.5">
                        <div className="flex justify-between mb-0.5">
                          <span className="text-[10px] text-slate-300">{cl.c}</span>
                          <span className="text-[10px] text-purple-400">{cl.pres}/{cl.total}</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full">
                          <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-400 rounded-full" style={{ width: `${(cl.pres/cl.total)*100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2.5">
                    <p className="text-[10px] text-yellow-400 font-semibold">⚠ 42 students have fee due — reminders sent</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20 lg:py-24 bg-[#0f172a] relative">
        <div className="absolute inset-0 grid-pattern opacity-25" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="badge badge-purple mx-auto mb-4">Core Modules</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Complete School <span className="text-blue-500">ERP System</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((mod) => (
              <div key={mod.title} className="glass-card rounded-2xl p-6 group">
                <div className={`w-11 h-11 rounded-xl ${mod.bg} flex items-center justify-center mb-4`}>
                  <mod.icon size={22} className={mod.color} />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{mod.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">{mod.desc}</p>
                <ul className="space-y-1.5">
                  {mod.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-slate-300 text-xs">
                      <CheckCircle size={11} className="text-green-400 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20 section-light">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-slate-900 font-semibold mb-2">{faq.q}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20 bg-[#030712] relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-blue-400 text-sm font-semibold tracking-wide uppercase mb-4">Get Started Today</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Transform Your School Management</h2>
          <p className="text-slate-400 text-lg mb-8">Used by 150+ schools across Pakistan. Get started with a free demo today.</p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 mb-8">
            <Link href="/demo" className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-bold px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl hover:bg-blue-700 transition-all text-sm sm:text-base shadow-lg shadow-blue-600/20">
              Request Free Demo <ArrowRight size={16} />
            </Link>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 border border-white/10 text-white font-semibold px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl hover:bg-white/5 transition-all text-sm sm:text-base">
              Talk to Sales
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-slate-500 text-sm">
            {["Free setup", "No contracts", "Cancel anytime", "24/7 support"].map(p => (
              <span key={p} className="flex items-center gap-1.5">
                <CheckCircle size={13} className="text-green-500" /> {p}
              </span>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
