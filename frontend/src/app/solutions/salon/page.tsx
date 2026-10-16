import type { Metadata } from "next";
import Link from "next/link";
import { Scissors, CheckCircle, ArrowRight, Calendar, Users, Contact, CreditCard, BarChart3 } from "lucide-react";

export const metadata: Metadata = {
  title: "Salon Management System",
  description: "Appointment booking, service catalog, staff scheduling and billing for salons, spas and beauty studios.",
};

const modules = [
  {
    icon: Calendar, title: "Appointment Booking",
    desc: "Fill every chair with an online and walk-in booking calendar that eliminates double-bookings and no-shows.",
    features: ["Online booking", "Walk-in scheduling", "Staff calendars", "SMS reminders", "Reschedule & cancel"],
    color: "text-pink-400", bg: "bg-pink-500/15",
  },
  {
    icon: Scissors, title: "Service Catalog",
    desc: "Define your full menu of services with prices, durations and staff specialities.",
    features: ["Service menu", "Pricing & duration", "Categories", "Packages & combos", "Staff specialities"],
    color: "text-rose-400", bg: "bg-rose-500/15",
  },
  {
    icon: Users, title: "Staff & Schedules",
    desc: "Manage stylists and therapists with shifts, working hours, leave and performance tracking.",
    features: ["Staff profiles", "Shift management", "Working hours", "Leave tracking", "Performance stats"],
    color: "text-purple-400", bg: "bg-purple-500/15",
  },
  {
    icon: Contact, title: "Client Profiles",
    desc: "Build a loyal client base with detailed profiles, service history and treatment preferences.",
    features: ["Client profiles", "Visit history", "Preferences & notes", "Membership tags", "Loyalty points"],
    color: "text-fuchsia-400", bg: "bg-fuchsia-500/15",
  },
  {
    icon: CreditCard, title: "Billing & Packages",
    desc: "Bill services and products quickly, sell prepaid packages, and accept split or partial payments.",
    features: ["Quick billing", "Prepaid packages", "Product sales", "Split payments", "Discounts & coupons"],
    color: "text-emerald-400", bg: "bg-emerald-500/15",
  },
  {
    icon: BarChart3, title: "Reports & Analytics",
    desc: "Understand revenue per stylist, top services and peak hours to grow your salon profitably.",
    features: ["Revenue per stylist", "Top services", "Peak-hour analysis", "Client retention", "Exportable reports"],
    color: "text-orange-400", bg: "bg-orange-500/15",
  },
];

const benefits = [
  { stat: "76%", label: "Repeat Client Rate" },
  { stat: "40%", label: "More Bookings" },
  { stat: "100%", label: "Digital Records" },
  { stat: "10h", label: "Saved Weekly" },
];

const faqs = [
  { q: "Can clients book appointments online?", a: "Yes. Give your clients a booking link where they pick a service, stylist and time slot based on real-time availability." },
  { q: "Does it manage multiple stylists?", a: "Absolutely. Manage unlimited stylists with individual schedules, specialities, leave and per-stylist performance reports." },
  { q: "Can I sell prepaid packages?", a: "Yes. Sell packages and memberships, track sessions used, and automatically apply remaining balance on future visits." },
  { q: "Does it send appointment reminders?", a: "Yes. Send automatic SMS or WhatsApp reminders to reduce no-shows and keep chairs full." },
  { q: "Can I track product inventory?", a: "Yes. Track retail and back-bar products with stock levels, usage per service, and alerts when items run low." },
];

export default function SalonPage() {
  return (
    <>
      <section className="relative pt-24 sm:pt-28 pb-14 sm:pb-20 bg-[#0d3b3f] overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <div className="badge badge-purple mb-5">
                <Scissors size={12} /> Beauty Solution
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-[1.1] mb-5">
                Salon{" "}
                <span className="text-white">Management</span>{" "}
                System
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed mb-8 max-w-lg">
                Fill your chairs and keep clients coming back — appointment booking, service catalog,
                staff scheduling and billing built for salons, spas and beauty studios.
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                <Link href="/demo" className="btn-primary">Request Demo <ArrowRight size={16} /></Link>
                <Link href="/pricing" className="btn-secondary">View Pricing</Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {benefits.map((b) => (
                  <div key={b.label} className="text-center glass rounded-xl p-3">
                    <div className="text-2xl font-black text-pink-400 mb-0.5">{b.stat}</div>
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
                  <span className="text-slate-500 text-[11px] ml-2">Salon Dashboard</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { l: "Bookings Today", v: "68", c: "text-pink-400" },
                      { l: "Occupancy", v: "82%", c: "text-green-400" },
                      { l: "Revenue", v: "₨6.2L", c: "text-blue-400" },
                    ].map((s) => (
                      <div key={s.l} className="bg-white/5 rounded-lg p-2.5">
                        <p className="text-[10px] text-slate-500 mb-1">{s.l}</p>
                        <p className={`text-sm font-bold ${s.c}`}>{s.v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-[11px] text-slate-300 font-semibold mb-2">Stylist Utilization</p>
                    {[
                      { c: "Ayesha", used: 14, total: 16 },
                      { c: "Hina", used: 12, total: 16 },
                      { c: "Sana", used: 9, total: 16 },
                    ].map((cl) => (
                      <div key={cl.c} className="mb-1.5">
                        <div className="flex justify-between mb-0.5">
                          <span className="text-[10px] text-slate-300">{cl.c}</span>
                          <span className="text-[10px] text-pink-400">{cl.used}/{cl.total}</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full">
                          <div className="h-1 bg-gradient-to-r from-pink-500 to-rose-400 rounded-full" style={{ width: `${(cl.used/cl.total)*100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2.5">
                    <p className="text-[10px] text-yellow-400 font-semibold">⚠ 5 appointments need confirmation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20 lg:py-24 bg-[#0d3b3f] relative">
        <div className="absolute inset-0 grid-pattern opacity-25" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="badge badge-purple mx-auto mb-4">Core Modules</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Complete Salon <span className="text-blue-500">System</span>
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

      <section className="py-14 sm:py-20 bg-[#0a2f32] relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-blue-400 text-sm font-semibold tracking-wide uppercase mb-4">Get Started Today</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Grow Your Salon Bookings</h2>
          <p className="text-slate-400 text-lg mb-8">Keep chairs full and clients loyal. Get started with a free demo today.</p>
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
