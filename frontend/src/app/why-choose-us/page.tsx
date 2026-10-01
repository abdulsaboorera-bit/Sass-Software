import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, ArrowRight, Code2, TrendingUp, DollarSign, HeadphonesIcon, Layers, Shield, Zap, Award } from "lucide-react";

export const metadata: Metadata = {
  title: "Why Choose Orbitrix ERP",
  description: "Discover why 500+ businesses chose Orbitrix ERP — custom development, scalability, affordable pricing, local support, and modern tech.",
};

const reasons = [
  {
    icon: Code2, title: "100% Custom Development",
    desc: "We don't sell off-the-shelf software. Every system is built specifically for your business workflows, branding, and requirements. You own the software.",
    points: ["Built for your exact workflow", "Your branding & domain", "No unnecessary features", "You own the source code"],
    color: "text-blue-400", bg: "bg-blue-500/15",
  },
  {
    icon: TrendingUp, title: "Scales With Your Growth",
    desc: "Whether you have 1 location or 50, our architecture handles growth seamlessly. Add users, branches, or features without rebuilding from scratch.",
    points: ["Multi-branch support", "Unlimited user licenses", "Feature expansion anytime", "Cloud infrastructure that scales"],
    color: "text-emerald-400", bg: "bg-emerald-500/15",
  },
  {
    icon: DollarSign, title: "Affordable Pricing",
    desc: "Enterprise-quality software at SMB prices. We believe every business deserves the best tools, not just the ones with large budgets.",
    points: ["Transparent pricing", "No hidden costs", "Flexible payment plans", "ROI in under 3 months"],
    color: "text-orange-400", bg: "bg-orange-500/15",
  },
  {
    icon: HeadphonesIcon, title: "Local 24/7 Support",
    desc: "Our support team is based in Pakistan, speaks your language, and understands your market. Get help via WhatsApp, phone, or email — any time.",
    points: ["Pakistan-based team", "WhatsApp support", "Average 15-min response", "Dedicated account manager"],
    color: "text-purple-400", bg: "bg-purple-500/15",
  },
  {
    icon: Layers, title: "Modern Technology Stack",
    desc: "We use the latest battle-tested technologies — React, Node.js, cloud databases — so your software is fast, secure, and future-proof.",
    points: ["React & Next.js frontend", "Node.js & PostgreSQL backend", "AWS cloud infrastructure", "Regular security updates"],
    color: "text-cyan-400", bg: "bg-cyan-500/15",
  },
  {
    icon: Shield, title: "Ongoing Maintenance",
    desc: "We don't disappear after delivery. Monthly updates, security patches, feature additions, and priority support are all included.",
    points: ["Monthly software updates", "Security patch management", "Bug fixes within 24 hours", "Feature requests included"],
    color: "text-pink-400", bg: "bg-pink-500/15",
  },
];

const comparison = [
  { feature: "Custom to your workflow", us: true, generic: false },
  { feature: "Own your source code", us: true, generic: false },
  { feature: "Local Pakistan support", us: true, generic: false },
  { feature: "Free training included", us: true, generic: false },
  { feature: "No per-user fees", us: true, generic: false },
  { feature: "Multi-branch management", us: true, generic: true },
  { feature: "Mobile responsive", us: true, generic: true },
  { feature: "Ongoing maintenance", us: true, generic: false },
];

export default function WhyChooseUsPage() {
  return (
    <>
      <section className="relative pt-28 pb-20 bg-[#0d3b3f] overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-40" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="badge badge-blue mx-auto mb-5">Why Orbitrix ERP</div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 max-w-4xl mx-auto leading-[1.1]">
            The Smart Choice for{" "}
            <span className="gradient-text">Pakistani Businesses</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Don&apos;t settle for generic software. Here&apos;s why 500+ businesses chose Orbitrix ERP
            over off-the-shelf alternatives.
          </p>
        </div>
      </section>

      {/* Reasons */}
      <section className="py-20 bg-[#0d3b3f] relative">
        <div className="absolute inset-0 grid-pattern opacity-25" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reasons.map((r) => (
              <div key={r.title} className="glass-card rounded-2xl p-7 group">
                <div className={`w-12 h-12 rounded-xl ${r.bg} flex items-center justify-center mb-5`}>
                  <r.icon size={24} className={r.color} />
                </div>
                <h3 className="text-white font-bold text-xl mb-3">{r.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-5">{r.desc}</p>
                <ul className="space-y-2">
                  {r.points.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-slate-300 text-sm">
                      <CheckCircle size={13} className="text-green-400 flex-shrink-0" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 section-light">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Orbitrix ERP vs. Generic Software</h2>
            <p className="text-slate-500">See exactly how we compare to off-the-shelf alternatives.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-100">
              <div className="p-4 text-slate-600 font-semibold text-sm">Feature</div>
              <div className="p-4 text-blue-600 font-bold text-sm text-center">Orbitrix ERP</div>
              <div className="p-4 text-slate-400 font-semibold text-sm text-center">Generic SaaS</div>
            </div>
            {comparison.map((row, i) => (
              <div key={row.feature} className={`grid grid-cols-3 border-b border-slate-50 ${i % 2 === 0 ? "" : "bg-slate-50/50"}`}>
                <div className="p-4 text-slate-700 text-sm">{row.feature}</div>
                <div className="p-4 text-center">
                  {row.us ? (
                    <CheckCircle size={18} className="text-green-500 mx-auto" />
                  ) : (
                    <span className="text-slate-300 text-lg">—</span>
                  )}
                </div>
                <div className="p-4 text-center">
                  {row.generic ? (
                    <CheckCircle size={18} className="text-green-400 mx-auto" />
                  ) : (
                    <span className="text-red-300 text-lg font-bold">✕</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-cyan-500">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Ready to Make the Right Choice?</h2>
          <p className="text-blue-100 mb-8">Get a free consultation and see exactly how Orbitrix ERP fits your business.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/demo" className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-all text-base">
              Request Free Demo <ArrowRight size={16} />
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-2 border-2 border-white/30 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 transition-all text-base">
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
