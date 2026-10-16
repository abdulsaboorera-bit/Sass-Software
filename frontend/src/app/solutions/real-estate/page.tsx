import type { Metadata } from "next";
import Link from "next/link";
import { Building2, CheckCircle, ArrowRight, Home, Users, FileText, DollarSign, Wrench } from "lucide-react";

export const metadata: Metadata = {
  title: "Real Estate Management System",
  description: "Manage properties, units, tenants, leases and maintenance with automated rent tracking and owner reporting.",
};

const modules = [
  {
    icon: Building2, title: "Property Management",
    desc: "Maintain a complete portfolio of properties with details, images, ownership and valuation records.",
    features: ["Property profiles", "Owner records", "Valuation tracking", "Property documents", "Portfolio overview"],
    color: "text-cyan-400", bg: "bg-cyan-500/15",
  },
  {
    icon: Home, title: "Units & Occupancy",
    desc: "Track every unit across your buildings with live occupancy status and rent details.",
    features: ["Unit inventory", "Occupancy status", "Unit-wise rent", "Floor & block mapping", "Amenities"],
    color: "text-teal-400", bg: "bg-teal-500/15",
  },
  {
    icon: Users, title: "Tenant Management",
    desc: "Store tenant profiles, contacts, references and complete tenancy history in one place.",
    features: ["Tenant profiles", "Contact & references", "Tenancy history", "KYC documents", "Move-in / move-out"],
    color: "text-blue-400", bg: "bg-blue-500/15",
  },
  {
    icon: FileText, title: "Lease Agreements",
    desc: "Create and manage leases with automated renewals, expiry alerts and rent escalation terms.",
    features: ["Lease creation", "Renewal tracking", "Expiry alerts", "Rent escalation", "Digital agreements"],
    color: "text-indigo-400", bg: "bg-indigo-500/15",
  },
  {
    icon: DollarSign, title: "Rent & Payments",
    desc: "Collect rent on time with automated invoices, payment records and overdue tracking.",
    features: ["Rent invoices", "Payment records", "Overdue tracking", "Security deposits", "Owner payouts"],
    color: "text-emerald-400", bg: "bg-emerald-500/15",
  },
  {
    icon: Wrench, title: "Maintenance Requests",
    desc: "Log maintenance complaints, assign vendors, and track resolution with full history per unit.",
    features: ["Request logging", "Vendor assignment", "Status tracking", "Cost tracking", "Unit history"],
    color: "text-orange-400", bg: "bg-orange-500/15",
  },
];

const benefits = [
  { stat: "94%", label: "Avg. Occupancy" },
  { stat: "100%", label: "Digital Leases" },
  { stat: "30%", label: "Faster Rent Collection" },
  { stat: "12h", label: "Saved Weekly" },
];

const faqs = [
  { q: "Can it handle multiple properties and buildings?", a: "Yes. Manage an unlimited number of properties, buildings, floors and units with a single consolidated dashboard." },
  { q: "Does it track rent and dues?", a: "Absolutely. Generate rent invoices automatically, record payments, and see overdue balances per tenant and per property." },
  { q: "Can I manage lease renewals?", a: "Yes. Leases track start and end dates, send expiry reminders in advance, and support rent escalation terms on renewal." },
  { q: "Does it handle maintenance requests?", a: "Yes. Tenants or staff can log maintenance requests, assign vendors, track status, and record cost against each unit." },
  { q: "Can owners see their own reports?", a: "Yes. Generate per-owner statements covering rent collected, expenses and net payouts for complete transparency." },
];

export default function RealEstatePage() {
  return (
    <>
      <section className="relative pt-24 sm:pt-28 pb-14 sm:pb-20 bg-[#0d3b3f] overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <div className="badge badge-green mb-5">
                <Building2 size={12} /> Property Solution
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-[1.1] mb-5">
                Real Estate{" "}
                <span className="text-white">Management</span>{" "}
                System
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed mb-8 max-w-lg">
                Manage properties, units, tenants and leases with automated rent tracking, maintenance
                requests and clear owner reporting — all in one place.
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                <Link href="/demo" className="btn-primary">Request Demo <ArrowRight size={16} /></Link>
                <Link href="/pricing" className="btn-secondary">View Pricing</Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {benefits.map((b) => (
                  <div key={b.label} className="text-center glass rounded-xl p-3">
                    <div className="text-2xl font-black text-cyan-400 mb-0.5">{b.stat}</div>
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
                  <span className="text-slate-500 text-[11px] ml-2">Real Estate Dashboard</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { l: "Properties", v: "340", c: "text-cyan-400" },
                      { l: "Occupied Units", v: "512", c: "text-green-400" },
                      { l: "Rent Collected", v: "₨18.6L", c: "text-blue-400" },
                    ].map((s) => (
                      <div key={s.l} className="bg-white/5 rounded-lg p-2.5">
                        <p className="text-[10px] text-slate-500 mb-1">{s.l}</p>
                        <p className={`text-sm font-bold ${s.c}`}>{s.v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-[11px] text-slate-300 font-semibold mb-2">Occupancy by Property</p>
                    {[
                      { c: "Skyline Towers", used: 46, total: 48 },
                      { c: "Green Valley", used: 33, total: 36 },
                      { c: "Marina Heights", used: 28, total: 30 },
                    ].map((cl) => (
                      <div key={cl.c} className="mb-1.5">
                        <div className="flex justify-between mb-0.5">
                          <span className="text-[10px] text-slate-300">{cl.c}</span>
                          <span className="text-[10px] text-cyan-400">{cl.used}/{cl.total}</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full">
                          <div className="h-1 bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full" style={{ width: `${(cl.used/cl.total)*100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2.5">
                    <p className="text-[10px] text-yellow-400 font-semibold">⚠ 14 rent invoices overdue — reminders sent</p>
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
            <div className="badge badge-green mx-auto mb-4">Core Modules</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Complete Real Estate <span className="text-blue-500">System</span>
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
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Simplify Your Property Portfolio</h2>
          <p className="text-slate-400 text-lg mb-8">Manage every property, tenant and rupee from a single dashboard. Book a free demo today.</p>
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
