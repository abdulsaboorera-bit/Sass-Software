import type { Metadata } from "next";
import Link from "next/link";
import {
  Utensils, CheckCircle, ArrowRight, Star, BarChart3,
  Users, Package, CreditCard, Clock, Smartphone, ChevronRight,
  ShoppingCart, ChefHat, TrendingUp, Bell, Shield, Zap
} from "lucide-react";

export const metadata: Metadata = {
  title: "Restaurant Management System",
  description: "Complete POS, order management, kitchen display, inventory, and staff management system for restaurants, cafes, and food chains.",
};

const modules = [
  {
    icon: ShoppingCart, title: "POS & Billing",
    desc: "Fast, intuitive point-of-sale with split bills, discount management, receipt printing, and multiple payment methods.",
    features: ["Touch-screen POS interface", "Multiple payment modes", "Bill splitting & discounts", "Receipt customization", "Tax management"],
    color: "text-orange-400", bg: "bg-orange-500/15",
  },
  {
    icon: ChefHat, title: "Kitchen Display System",
    desc: "Real-time kitchen display that shows orders instantly to kitchen staff, reducing errors and wait times dramatically.",
    features: ["Live order display", "Priority queue management", "Order timing alerts", "Station-wise view", "Chef acknowledgment"],
    color: "text-red-400", bg: "bg-red-500/15",
  },
  {
    icon: Package, title: "Inventory Management",
    desc: "Track every ingredient with low-stock alerts, auto-purchase orders, wastage logs, and supplier management.",
    features: ["Real-time stock tracking", "Low-stock alerts", "Wastage management", "Supplier management", "Cost of goods reports"],
    color: "text-yellow-400", bg: "bg-yellow-500/15",
  },
  {
    icon: Users, title: "Staff Management",
    desc: "Manage shifts, attendance, payroll, and performance for your entire restaurant team from one dashboard.",
    features: ["Staff attendance tracking", "Shift scheduling", "Payroll management", "Performance reports", "Role-based access"],
    color: "text-blue-400", bg: "bg-blue-500/15",
  },
  {
    icon: BarChart3, title: "Analytics & Reports",
    desc: "Deep insights into sales, peak hours, best-selling items, revenue trends, and customer behavior.",
    features: ["Daily/weekly/monthly reports", "Best-seller analysis", "Revenue trends", "Peak hour reports", "Customer insights"],
    color: "text-purple-400", bg: "bg-purple-500/15",
  },
  {
    icon: Utensils, title: "Table & Order Management",
    desc: "Visual floor plan with real-time table status, online orders integration, and home delivery management.",
    features: ["Visual floor plan", "Table reservation", "Online order integration", "Delivery management", "Order modification"],
    color: "text-emerald-400", bg: "bg-emerald-500/15",
  },
];

const benefits = [
  { stat: "40%", label: "Faster Order Processing" },
  { stat: "3x", label: "More Tables Managed" },
  { stat: "60%", label: "Reduction in Errors" },
  { stat: "25%", label: "Increase in Revenue" },
];

const faqs = [
  { q: "Can it work offline?", a: "Yes, the POS works offline and syncs automatically when internet is restored. No data is ever lost." },
  { q: "Does it support multiple branches?", a: "Absolutely. Manage all your branches from a single central dashboard with consolidated reporting." },
  { q: "How long does setup take?", a: "Most restaurants are fully live within 48 hours. We handle all data migration and staff training." },
  { q: "Is it compatible with existing printers?", a: "Yes, we support all major thermal receipt printers and kitchen printers via USB, LAN, or Bluetooth." },
  { q: "Can I customize the menu?", a: "Fully. Add items, categories, modifiers, combo deals, and seasonal menus with photos and descriptions." },
];

export default function RestaurantPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-24 sm:pt-28 pb-14 sm:pb-20 bg-[#0d3b3f] overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <div className="badge badge-blue mb-5">
                <Utensils size={12} /> Restaurant Solution
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-[1.1] mb-5">
                Restaurant{" "}
                <span className="text-white">Management</span>{" "}
                System
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed mb-8 max-w-lg">
                The complete digital solution for modern restaurants, cafes, and food chains.
                From POS to kitchen display to analytics — everything in one powerful platform.
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                <Link href="/demo" className="btn-primary">Request Demo <ArrowRight size={16} /></Link>
                <Link href="/pricing" className="btn-secondary">View Pricing</Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {benefits.map((b) => (
                  <div key={b.label} className="text-center glass rounded-xl p-3">
                    <div className="text-2xl font-black text-orange-400 mb-0.5">{b.stat}</div>
                    <div className="text-slate-400 text-xs">{b.label}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Visual mockup */}
            <div className="flex-1 max-w-md">
              <div className="dashboard-mockup shadow-2xl">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/3">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                  </div>
                  <span className="text-slate-500 text-[11px] ml-2">Restaurant Dashboard</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { l: "Active Orders", v: "24", c: "text-orange-400" },
                      { l: "Tables Occupied", v: "18/25", c: "text-blue-400" },
                      { l: "Today Revenue", v: "₨87K", c: "text-green-400" },
                    ].map((s) => (
                      <div key={s.l} className="bg-white/5 rounded-lg p-2.5">
                        <p className="text-[10px] text-slate-500 mb-1">{s.l}</p>
                        <p className={`text-sm font-bold ${s.c}`}>{s.v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-[11px] text-slate-300 font-semibold mb-2">Active Orders</p>
                    {[
                      { t: "Table 7", i: "2x Biryani, 1x Naan", s: "Preparing", c: "text-yellow-400" },
                      { t: "Table 12", i: "1x Pizza, 2x Cola", s: "Ready", c: "text-green-400" },
                      { t: "Delivery #5", i: "3x Burger Meal", s: "En Route", c: "text-blue-400" },
                    ].map((o) => (
                      <div key={o.t} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                        <div>
                          <p className="text-[10px] text-white font-semibold">{o.t}</p>
                          <p className="text-[9px] text-slate-500">{o.i}</p>
                        </div>
                        <span className={`text-[9px] font-bold ${o.c}`}>{o.s}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-[11px] text-slate-300 font-semibold mb-2">Top Items Today</p>
                    {[
                      { n: "Chicken Biryani", v: 47, pct: 85 },
                      { n: "Zinger Burger", v: 32, pct: 60 },
                      { n: "Beef Karahi", v: 28, pct: 50 },
                    ].map((item) => (
                      <div key={item.n} className="mb-1.5">
                        <div className="flex justify-between mb-0.5">
                          <span className="text-[10px] text-slate-300">{item.n}</span>
                          <span className="text-[10px] text-orange-400">{item.v} sold</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full">
                          <div className="h-1 bg-gradient-to-r from-orange-500 to-red-400 rounded-full" style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    ))}
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
            <div className="badge badge-blue mx-auto mb-4">Core Modules</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Complete Feature Set for <span className="text-white">Every Restaurant</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Every module works seamlessly together — no more juggling multiple apps.
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
            <p className="text-slate-500">Everything you need to know about our Restaurant Management System.</p>
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
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Ready to Modernize Your Restaurant?</h2>
          <p className="text-slate-400 text-lg mb-8">Join 200+ restaurants already using Orbitrix ERP. Get a free demo and have your system live in 48 hours.</p>
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
