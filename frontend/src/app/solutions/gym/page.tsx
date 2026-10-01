import type { Metadata } from "next";
import Link from "next/link";
import {
  Dumbbell, CheckCircle, ArrowRight, Users, CreditCard,
  BarChart3, Calendar, Smartphone, Shield, Clock
} from "lucide-react";

export const metadata: Metadata = {
  title: "Gym Management System",
  description: "Complete gym and fitness center management — member tracking, trainer scheduling, membership plans, attendance, and automated billing.",
};

const modules = [
  {
    icon: Users, title: "Member Management",
    desc: "Complete member profiles with contact info, membership history, fitness goals, body measurements, and emergency contacts.",
    features: ["Digital member profiles", "Membership history", "Body measurement logs", "Emergency contacts", "Member photo ID"],
    color: "text-red-400", bg: "bg-red-500/15",
  },
  {
    icon: CreditCard, title: "Membership Plans & Billing",
    desc: "Create flexible membership plans (monthly, quarterly, annual), automate renewals, and track payments with overdue alerts.",
    features: ["Flexible plan creation", "Auto-renewal billing", "Payment tracking", "Overdue SMS alerts", "Invoice generation"],
    color: "text-orange-400", bg: "bg-orange-500/15",
  },
  {
    icon: Calendar, title: "Trainer Scheduling",
    desc: "Manage personal trainers, their schedules, assigned members, session tracking, and performance reports.",
    features: ["Trainer profiles", "Session scheduling", "Member-trainer assignment", "Session history", "Trainer payroll"],
    color: "text-blue-400", bg: "bg-blue-500/15",
  },
  {
    icon: Clock, title: "Attendance & Check-In",
    desc: "Track gym entry and exit with biometric or card-based check-in, real-time occupancy dashboard, and peak hour reports.",
    features: ["Biometric / card check-in", "Real-time occupancy", "Peak hour analytics", "Late arrival tracking", "Monthly attendance reports"],
    color: "text-emerald-400", bg: "bg-emerald-500/15",
  },
  {
    icon: Smartphone, title: "Member App Portal",
    desc: "Members can view their plan status, book classes, track attendance, and renew memberships from their phone.",
    features: ["Mobile-responsive portal", "Class booking", "Attendance history", "Online renewal", "Trainer messaging"],
    color: "text-purple-400", bg: "bg-purple-500/15",
  },
  {
    icon: BarChart3, title: "Revenue & Analytics",
    desc: "Track monthly revenue, membership trends, retention rates, class popularity, and profitability per service.",
    features: ["Revenue dashboards", "Membership growth trends", "Churn & retention rate", "Class analytics", "Profit per service"],
    color: "text-cyan-400", bg: "bg-cyan-500/15",
  },
];

const benefits = [
  { stat: "60%", label: "Less Admin Work" },
  { stat: "40%", label: "Higher Retention" },
  { stat: "95%", label: "Fee Collection Rate" },
  { stat: "3x", label: "Faster Check-in" },
];

const faqs = [
  { q: "Does it support multiple gym branches?", a: "Yes. Manage all branches from one dashboard with shared or branch-specific member records, consolidated revenue, and cross-branch access permissions." },
  { q: "Can members renew their plans online?", a: "Absolutely. Members can view plan expiry, renew online, and receive automated SMS/email reminders 7 days before their plan expires." },
  { q: "Does it support biometric check-in?", a: "Yes. We integrate with most fingerprint and facial recognition devices for seamless check-in. Card/QR code check-in is also supported." },
  { q: "Can trainers access the system?", a: "Yes. Trainers have their own login with access to their assigned members, session schedule, and progress logs — without accessing financial data." },
  { q: "How long does setup take?", a: "Most gyms are fully live within 48–72 hours including member data import, staff training, and hardware setup (biometric devices, if applicable)." },
];

export default function GymPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-24 sm:pt-28 pb-14 sm:pb-20 bg-[#0d3b3f] overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <div className="badge badge-blue mb-5" style={{color:"#f87171",background:"rgba(239,68,68,0.1)",borderColor:"rgba(239,68,68,0.2)"}}>
                <Dumbbell size={12} /> Fitness Solution
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-[1.1] mb-5">
                Gym{" "}
                <span className="text-white">
                  Management
                </span>{" "}
                System
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed mb-8 max-w-lg">
                The all-in-one platform for gyms, fitness centers, and wellness studios.
                Manage members, trainers, billing, and attendance — all from one powerful dashboard.
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                <Link href="/demo" className="btn-primary">Request Demo <ArrowRight size={16} /></Link>
                <Link href="/pricing" className="btn-secondary">View Pricing</Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {benefits.map((b) => (
                  <div key={b.label} className="text-center glass rounded-xl p-3">
                    <div className="text-2xl font-black text-red-400 mb-0.5">{b.stat}</div>
                    <div className="text-slate-400 text-xs">{b.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dashboard mockup */}
            <div className="flex-1 max-w-md">
              <div className="dashboard-mockup shadow-2xl">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/3">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                  </div>
                  <span className="text-slate-500 text-[11px] ml-2">Gym Dashboard</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { l: "Active Members", v: "486", c: "text-red-400" },
                      { l: "Today Check-ins", v: "142", c: "text-blue-400" },
                      { l: "Monthly Revenue", v: "₨580K", c: "text-green-400" },
                    ].map((s) => (
                      <div key={s.l} className="bg-white/5 rounded-lg p-2.5">
                        <p className="text-[10px] text-slate-500 mb-1">{s.l}</p>
                        <p className={`text-sm font-bold ${s.c}`}>{s.v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-[11px] text-slate-300 font-semibold mb-2">Expiring This Week</p>
                    {[
                      { n: "Ahmed Raza", plan: "Monthly", exp: "Tomorrow", c: "text-red-400" },
                      { n: "Sara Malik", plan: "Quarterly", exp: "In 3 days", c: "text-yellow-400" },
                      { n: "Ali Hassan", plan: "Monthly", exp: "In 5 days", c: "text-yellow-400" },
                    ].map((m) => (
                      <div key={m.n} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                        <div>
                          <p className="text-[10px] text-white font-semibold">{m.n}</p>
                          <p className="text-[9px] text-slate-500">{m.plan} plan</p>
                        </div>
                        <span className={`text-[9px] font-bold ${m.c}`}>{m.exp}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-[11px] text-slate-300 font-semibold mb-2">Membership Distribution</p>
                    {[
                      { plan: "Monthly", count: 210, pct: 43 },
                      { plan: "Quarterly", count: 165, pct: 34 },
                      { plan: "Annual", count: 111, pct: 23 },
                    ].map((p) => (
                      <div key={p.plan} className="mb-1.5">
                        <div className="flex justify-between mb-0.5">
                          <span className="text-[10px] text-slate-300">{p.plan}</span>
                          <span className="text-[10px] text-red-400">{p.count} members</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full">
                          <div
                            className="h-1 rounded-full"
                            style={{ width: `${p.pct}%`, background: "linear-gradient(90deg,#ef4444,#f97316)" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
                    <p className="text-[10px] text-red-400 font-semibold">⚠ 18 members expire this week — renewal reminders sent</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="py-14 sm:py-20 lg:py-24 bg-[#0d3b3f] relative">
        <div className="absolute inset-0 grid-pattern opacity-25" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="badge badge-blue mx-auto mb-4" style={{color:"#f87171",background:"rgba(239,68,68,0.1)",borderColor:"rgba(239,68,68,0.2)"}}>
              Core Modules
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Everything to Run a{" "}
              <span className="text-white">
                Modern Gym
              </span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              From member onboarding to revenue reporting — all in one connected platform.
            </p>
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

      {/* FAQ */}
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

      {/* CTA */}
      <section className="py-14 sm:py-20 bg-[#0a2f32] relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-blue-400 text-sm font-semibold tracking-wide uppercase mb-4">Get Started Today</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Ready to Modernize Your Gym?</h2>
          <p className="text-slate-400 text-lg mb-8">Join 80+ gyms already using Orbitrix ERP. Get a free demo and have your system live in 48 hours.</p>
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
