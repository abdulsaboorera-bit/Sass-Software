import type { Metadata } from "next";
import Link from "next/link";
import { Car, CheckCircle, ArrowRight, Calendar, Users, FileText, CreditCard, BarChart3 } from "lucide-react";

export const metadata: Metadata = {
  title: "Car Rental Management System",
  description: "Manage your rental fleet end-to-end — vehicle records, bookings, rental agreements, customers, and payment tracking.",
};

const modules = [
  {
    icon: Car, title: "Fleet Management",
    desc: "Keep every vehicle's profile, availability, maintenance schedule, insurance and registration in one place.",
    features: ["Vehicle profiles", "Availability status", "Maintenance schedule", "Insurance & registration", "Category management"],
    color: "text-sky-400", bg: "bg-sky-500/15",
  },
  {
    icon: Calendar, title: "Bookings & Reservations",
    desc: "Take reservations with a live availability calendar and manage the full booking lifecycle without double-booking.",
    features: ["Real-time availability", "Reservation calendar", "Booking lifecycle", "Extensions & returns", "Advance bookings"],
    color: "text-blue-400", bg: "bg-blue-500/15",
  },
  {
    icon: Users, title: "Customer Management",
    desc: "Store customer profiles, driver licenses, documents and complete rental history with ease.",
    features: ["Customer profiles", "License & ID records", "Rental history", "Blacklist management", "Corporate accounts"],
    color: "text-cyan-400", bg: "bg-cyan-500/15",
  },
  {
    icon: FileText, title: "Rental Agreements",
    desc: "Generate rental agreements instantly, capture check-in/check-out condition reports, and track damages.",
    features: ["Agreement generation", "Digital signatures", "Check-in / check-out", "Damage reports", "Fuel & mileage logs"],
    color: "text-indigo-400", bg: "bg-indigo-500/15",
  },
  {
    icon: CreditCard, title: "Payments & Invoicing",
    desc: "Create invoices, manage security deposits, accept partial payments and track overdue balances.",
    features: ["Invoices & receipts", "Security deposits", "Partial payments", "Overdue tracking", "Refunds"],
    color: "text-emerald-400", bg: "bg-emerald-500/15",
  },
  {
    icon: BarChart3, title: "Reports & Analytics",
    desc: "Understand fleet utilization, revenue per vehicle, idle time and top-performing categories at a glance.",
    features: ["Fleet utilization", "Revenue per vehicle", "Idle-time analysis", "Booking trends", "Exportable reports"],
    color: "text-orange-400", bg: "bg-orange-500/15",
  },
];

const benefits = [
  { stat: "90%", label: "Less Manual Booking" },
  { stat: "100%", label: "Fleet Visibility" },
  { stat: "82%", label: "Avg. Utilization" },
  { stat: "15h", label: "Saved Weekly" },
];

const faqs = [
  { q: "How many vehicles can it handle?", a: "From a small 5-car operation to fleets of 500+ vehicles across multiple branches, the system scales without performance issues." },
  { q: "Can customers book online?", a: "Yes. You can expose an online booking front-end so customers reserve vehicles themselves, subject to real-time availability." },
  { q: "Does it track maintenance and insurance?", a: "Absolutely. Each vehicle has a maintenance schedule, insurance and registration expiry tracking with reminders before they lapse." },
  { q: "Can I manage security deposits?", a: "Yes. Record deposits at booking, deduct damages at check-in, and refund the balance — all tracked against the rental agreement." },
  { q: "Does it support multiple branches?", a: "Yes. Manage vehicles, staff and bookings per branch with consolidated reporting across your whole business." },
];

export default function CarRentalPage() {
  return (
    <>
      <section className="relative pt-24 sm:pt-28 pb-14 sm:pb-20 bg-[#0d3b3f] overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <div className="badge badge-blue mb-5">
                <Car size={12} /> Automotive Solution
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-[1.1] mb-5">
                Car Rental{" "}
                <span className="text-white">Management</span>{" "}
                System
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed mb-8 max-w-lg">
                Run your rental fleet end-to-end — vehicle availability, bookings, rental agreements,
                customer records and payment collection, all from one dashboard.
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                <Link href="/demo" className="btn-primary">Request Demo <ArrowRight size={16} /></Link>
                <Link href="/pricing" className="btn-secondary">View Pricing</Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {benefits.map((b) => (
                  <div key={b.label} className="text-center glass rounded-xl p-3">
                    <div className="text-2xl font-black text-sky-400 mb-0.5">{b.stat}</div>
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
                  <span className="text-slate-500 text-[11px] ml-2">Car Rental Dashboard</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { l: "Total Vehicles", v: "128", c: "text-sky-400" },
                      { l: "On Rent", v: "46", c: "text-green-400" },
                      { l: "Available", v: "82", c: "text-blue-400" },
                    ].map((s) => (
                      <div key={s.l} className="bg-white/5 rounded-lg p-2.5">
                        <p className="text-[10px] text-slate-500 mb-1">{s.l}</p>
                        <p className={`text-sm font-bold ${s.c}`}>{s.v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-[11px] text-slate-300 font-semibold mb-2">Fleet Utilization</p>
                    {[
                      { c: "SUVs", used: 34, total: 40 },
                      { c: "Sedans", used: 28, total: 38 },
                      { c: "Hatchbacks", used: 20, total: 30 },
                    ].map((cl) => (
                      <div key={cl.c} className="mb-1.5">
                        <div className="flex justify-between mb-0.5">
                          <span className="text-[10px] text-slate-300">{cl.c}</span>
                          <span className="text-[10px] text-sky-400">{cl.used}/{cl.total}</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full">
                          <div className="h-1 bg-gradient-to-r from-sky-500 to-blue-400 rounded-full" style={{ width: `${(cl.used/cl.total)*100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2.5">
                    <p className="text-[10px] text-yellow-400 font-semibold">⚠ 3 vehicles due for service this week</p>
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
            <div className="badge badge-blue mx-auto mb-4">Core Modules</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Complete Car Rental <span className="text-blue-500">System</span>
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
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Take Control of Your Rental Fleet</h2>
          <p className="text-slate-400 text-lg mb-8">Stop juggling spreadsheets. Get started with a free demo today.</p>
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
