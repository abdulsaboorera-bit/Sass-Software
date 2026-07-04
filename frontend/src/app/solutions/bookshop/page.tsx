import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, CheckCircle, ArrowRight, Package, BarChart3, Users, Tag, Truck, CreditCard } from "lucide-react";

export const metadata: Metadata = {
  title: "Book Shop Management System",
  description: "Complete inventory, sales, barcode, supplier, and customer management for book shops and stationery stores.",
};

const modules = [
  {
    icon: Package, title: "Inventory Management",
    desc: "Track thousands of book titles with ISBN, author, publisher, category, and real-time stock levels.",
    features: ["ISBN-based cataloguing", "Category management", "Real-time stock levels", "Low-stock alerts", "Multi-location inventory"],
    color: "text-blue-400", bg: "bg-blue-500/15",
  },
  {
    icon: Tag, title: "Barcode & POS",
    desc: "Fast barcode scanning at checkout with instant price lookup, discount application, and receipt printing.",
    features: ["Barcode scanner support", "Instant price lookup", "Discount & offers", "Receipt printing", "Multiple payment modes"],
    color: "text-cyan-400", bg: "bg-cyan-500/15",
  },
  {
    icon: BarChart3, title: "Sales Analytics",
    desc: "Track best-sellers, daily sales, seasonal trends, and profit margins per book and category.",
    features: ["Best-seller tracking", "Daily/monthly sales", "Profit margin analysis", "Seasonal trends", "Category performance"],
    color: "text-purple-400", bg: "bg-purple-500/15",
  },
  {
    icon: Truck, title: "Supplier Management",
    desc: "Manage publisher and supplier relationships, purchase orders, delivery tracking, and payment history.",
    features: ["Supplier profiles", "Purchase order generation", "Delivery tracking", "Payment history", "Supplier comparison"],
    color: "text-orange-400", bg: "bg-orange-500/15",
  },
  {
    icon: Users, title: "Customer Management",
    desc: "Build a customer database with purchase history, loyalty points, and targeted marketing lists.",
    features: ["Customer profiles", "Purchase history", "Loyalty point system", "Customer segments", "Bulk SMS/notifications"],
    color: "text-emerald-400", bg: "bg-emerald-500/15",
  },
  {
    icon: CreditCard, title: "Billing & Returns",
    desc: "Fast billing with return management, credit notes, and full transaction history with audit trail.",
    features: ["Quick billing POS", "Return management", "Credit notes", "Transaction history", "Daily cash reports"],
    color: "text-pink-400", bg: "bg-pink-500/15",
  },
];

const benefits = [
  { stat: "5k+", label: "Book Titles Manageable" },
  { stat: "80%", label: "Faster Checkout" },
  { stat: "45%", label: "Less Stock Waste" },
  { stat: "30%", label: "Revenue Growth" },
];

const faqs = [
  { q: "How many books can I manage?", a: "Unlimited. The system handles libraries and stores with 100,000+ titles with no performance issues." },
  { q: "Does it support barcode scanners?", a: "Yes, compatible with all standard USB and wireless barcode scanners. Just plug and play — no configuration needed." },
  { q: "Can I track books by ISBN?", a: "Absolutely. Add books by scanning ISBN barcodes and the system auto-fills title, author, and publisher info." },
  { q: "Is there a customer loyalty program?", a: "Yes. Set up custom loyalty points, discount tiers, and special offers for repeat customers automatically." },
  { q: "Can I manage multiple shop branches?", a: "Yes. Manage all branches from one dashboard with inter-branch stock transfers and consolidated reporting." },
];

export default function BookshopPage() {
  return (
    <>
      <section className="relative pt-24 sm:pt-28 pb-14 sm:pb-20 bg-[#0f172a] overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <div className="badge badge-blue mb-5">
                <BookOpen size={12} /> Retail Solution
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-[1.1] mb-5">
                Book Shop{" "}
                <span className="text-white">Management</span>{" "}
                System
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed mb-8 max-w-lg">
                The smartest way to run your book store, stationery shop, or educational supply business.
                Track every title, sale, and supplier from one platform.
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                <Link href="/demo" className="btn-primary">Request Demo <ArrowRight size={16} /></Link>
                <Link href="/pricing" className="btn-secondary">View Pricing</Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {benefits.map((b) => (
                  <div key={b.label} className="text-center glass rounded-xl p-3">
                    <div className="text-2xl font-black text-blue-400 mb-0.5">{b.stat}</div>
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
                  <span className="text-slate-500 text-[11px] ml-2">Book Shop Dashboard</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { l: "Total Books", v: "12,480", c: "text-blue-400" },
                      { l: "Today Sales", v: "₨45K", c: "text-green-400" },
                      { l: "Low Stock", v: "23 Titles", c: "text-red-400" },
                    ].map((s) => (
                      <div key={s.l} className="bg-white/5 rounded-lg p-2.5">
                        <p className="text-[10px] text-slate-500 mb-1">{s.l}</p>
                        <p className={`text-sm font-bold ${s.c}`}>{s.v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-[11px] text-slate-300 font-semibold mb-2">Best Sellers Today</p>
                    {[
                      { t: "Mathematics Class 10", sales: 18, stock: 45 },
                      { t: "English Grammar Guide", sales: 12, stock: 30 },
                      { t: "Physics Numericals", sales: 9, stock: 22 },
                    ].map((b) => (
                      <div key={b.t} className="mb-1.5">
                        <div className="flex justify-between mb-0.5">
                          <span className="text-[10px] text-slate-300 truncate max-w-[120px]">{b.t}</span>
                          <span className="text-[10px] text-blue-400">{b.sales} sold</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full">
                          <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" style={{ width: `${(b.sales/18)*100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2">
                      <p className="text-[9px] text-orange-400 font-semibold">⚠ 23 titles need reorder</p>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2">
                      <p className="text-[9px] text-green-400 font-semibold">✓ 3 POs sent today</p>
                    </div>
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
            <div className="badge badge-blue mx-auto mb-4">Core Modules</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Built for <span className="text-white">Retail Excellence</span>
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
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Modernize Your Book Shop Today</h2>
          <p className="text-slate-400 text-lg mb-8">Get your complete system live in 48 hours with free training included.</p>
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
