"use client";

import Link from "next/link";
import { CheckCircle, X, ArrowRight, Zap, Star, MessageSquare } from "lucide-react";
import ScrollReveal from "@/components/animations/ScrollReveal";
import AnimatedBarChart from "@/components/charts/AnimatedBarChart";
import AnimatedDonutProgress from "@/components/charts/AnimatedDonutProgress";
import AnimatedPieChart from "@/components/charts/AnimatedPieChart";

const plans = [
  {
    name: "Starter",
    tagline: "Perfect for small businesses",
    price: "Contact Us",
    desc: "Ideal for single-location businesses just starting their digital journey.",
    badge: null,
    badgeColor: "",
    gradient: "from-slate-700 to-slate-600",
    color: "#64748b",
    features: [
      { text: "1 business location", included: true },
      { text: "Up to 3 user accounts", included: true },
      { text: "Core module (choose 1)", included: true },
      { text: "Basic dashboard & reports", included: true },
      { text: "Email support (48h SLA)", included: true },
      { text: "Cloud hosting included", included: true },
      { text: "Mobile-responsive interface", included: true },
      { text: "Multi-location support", included: false },
      { text: "Advanced analytics", included: false },
      { text: "Custom integrations", included: false },
      { text: "Priority support", included: false },
      { text: "Dedicated account manager", included: false },
    ],
    valueScore: 65,
    cta: "Get Started",
    ctaHref: "/demo",
    ctaStyle: "border-2 border-slate-400 text-white hover:bg-white/10",
  },
  {
    name: "Professional",
    tagline: "Most popular choice",
    price: "Contact Us",
    desc: "For growing businesses needing full features and priority support.",
    badge: "Most Popular",
    badgeColor: "bg-blue-500",
    gradient: "from-blue-600 to-cyan-500",
    color: "#15757b",
    features: [
      { text: "Up to 3 business locations", included: true },
      { text: "Up to 10 user accounts", included: true },
      { text: "All core modules included", included: true },
      { text: "Advanced reports & analytics", included: true },
      { text: "Priority support (4h SLA)", included: true },
      { text: "Cloud hosting included", included: true },
      { text: "Mobile-responsive interface", included: true },
      { text: "Multi-location support", included: true },
      { text: "Staff & inventory management", included: true },
      { text: "Custom integrations (1 API)", included: true },
      { text: "Dedicated account manager", included: false },
      { text: "White-label branding", included: false },
    ],
    valueScore: 85,
    cta: "Request Demo",
    ctaHref: "/demo",
    ctaStyle: "bg-white text-blue-700 hover:bg-blue-50 font-bold shadow-lg shadow-white/20",
  },
  {
    name: "Enterprise",
    tagline: "For large organizations",
    price: "Custom Quote",
    desc: "Fully customized solution for multi-branch enterprises with advanced needs.",
    badge: "Best Value",
    badgeColor: "bg-purple-500",
    gradient: "from-purple-600 to-pink-500",
    color: "#8b5cf6",
    features: [
      { text: "Unlimited locations", included: true },
      { text: "Unlimited user accounts", included: true },
      { text: "All modules + custom modules", included: true },
      { text: "Custom dashboards & KPIs", included: true },
      { text: "24/7 dedicated support", included: true },
      { text: "Enterprise cloud hosting", included: true },
      { text: "Native mobile apps", included: true },
      { text: "Multi-location management", included: true },
      { text: "Full analytics suite", included: true },
      { text: "Unlimited custom integrations", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "White-label branding", included: true },
    ],
    valueScore: 98,
    cta: "Get Custom Quote",
    ctaHref: "/contact",
    ctaStyle: "bg-white text-purple-700 hover:bg-purple-50 font-bold shadow-lg shadow-white/20",
  },
];

const faqs = [
  { q: "What's included in the price?", a: "All plans include setup, data migration, staff training, and the first 3 months of support. No surprise fees." },
  { q: "Is there a monthly or annual payment?", a: "We offer both monthly and annual payment options. Annual plans come with a 20% discount and priority support upgrades." },
  { q: "Can I upgrade my plan later?", a: "Absolutely. You can upgrade at any time and only pay the difference. Our team handles the transition with zero downtime." },
  { q: "What if I need a feature that's not listed?", a: "We build custom features! Contact us with your requirements and we'll provide a tailored quote." },
  { q: "Is there a free trial?", a: "We offer a fully functional 14-day free trial for the Professional plan. No credit card required." },
];

const comparisonData = [
  { name: "Locations", starter: 1, professional: 3, enterprise: 10 },
  { name: "Users", starter: 3, professional: 10, enterprise: 50 },
  { name: "Modules", starter: 1, professional: 5, enterprise: 10 },
  { name: "API Calls", starter: 0, professional: 1, enterprise: 10 },
];

const featurePieData = [
  { name: "Core Features", value: 40, color: "#15757b" },
  { name: "Analytics", value: 25, color: "#8b5cf6" },
  { name: "Integrations", value: 20, color: "#10b981" },
  { name: "Support", value: 15, color: "#f97316" },
];

export default function PricingPage() {
  return (
    <>
      <section className="relative pt-28 pb-16 bg-[#0d3b3f] overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-40" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <ScrollReveal direction="up">
            <div className="badge badge-blue mx-auto mb-5">Pricing</div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-5 leading-[1.1]">
              Simple, Transparent <span className="gradient-text">Pricing</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              All plans include custom development, training, and ongoing support.
              No hidden fees, no per-user traps — just software that works.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Feature Value Pie Chart */}
      <section className="py-12 bg-[#0d3b3f]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <ScrollReveal direction="up">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-extrabold text-white mb-3">What You Get in Every Plan</h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Every Orbitrix ERP plan includes the full platform — not a feature-gated tier system.
                  Here&apos;s how we distribute value across our features.
                </p>
                <div className="space-y-3">
                  {featurePieData.map(f => (
                    <div key={f.name} className="flex items-center gap-3">
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: f.color, flexShrink: 0 }} />
                      <span className="text-slate-300 text-sm flex-1">{f.name}</span>
                      <span className="text-white text-sm font-bold">{f.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-center">
                <AnimatedPieChart data={featurePieData} height={240} innerRadius={60} outerRadius={100} animationDuration={1200} />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="py-16 bg-[#0d3b3f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {plans.map((plan, i) => (
              <ScrollReveal key={plan.name} delay={i * 100} direction="up">
                <div
                  className={`rounded-2xl overflow-hidden ${plan.name === "Professional" ? "ring-2 ring-blue-500 shadow-2xl shadow-blue-500/20 scale-105" : ""}`}
                >
                  <div className={`bg-gradient-to-br ${plan.gradient} p-7`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-white/70 text-sm font-medium mb-0.5">{plan.tagline}</p>
                        <h3 className="text-white text-2xl font-extrabold">{plan.name}</h3>
                      </div>
                      {plan.badge && (
                        <span className={`${plan.badgeColor} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                          {plan.badge}
                        </span>
                      )}
                    </div>
                    <div className="mb-4">
                      <span className="text-white text-3xl font-black">{plan.price}</span>
                    </div>
                    <p className="text-white/70 text-sm leading-relaxed mb-4">{plan.desc}</p>

                    {/* Value Score */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>Value Score</span>
                        <span style={{ fontSize: "0.75rem", color: "#fff", fontWeight: 700 }}>{plan.valueScore}/100</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.2)", overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          borderRadius: 3,
                          background: "rgba(255,255,255,0.9)",
                          width: `${plan.valueScore}%`,
                          transition: "width 1.2s cubic-bezier(0.16,1,0.3,1)",
                        }} />
                      </div>
                    </div>

                    <Link
                      href={plan.ctaHref}
                      className={`mt-2 flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-xl text-sm transition-all ${plan.ctaStyle}`}
                    >
                      {plan.cta} <ArrowRight size={14} />
                    </Link>
                  </div>
                  <div className="bg-[#1e293b] p-6">
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-4">What&apos;s Included</p>
                    <ul className="space-y-2.5">
                      {plan.features.map((f) => (
                        <li key={f.text} className="flex items-center gap-2.5">
                          {f.included ? (
                            <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                          ) : (
                            <X size={14} className="text-slate-600 flex-shrink-0" />
                          )}
                          <span className={`text-sm ${f.included ? "text-slate-300" : "text-slate-600"}`}>
                            {f.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <div className="mt-10 glass rounded-2xl p-6 text-center">
            <p className="text-slate-300 text-sm mb-3">
              <span className="text-blue-400 font-semibold">Not sure which plan fits you?</span>{" "}
              Our team will analyze your business and recommend the right solution — free of charge.
            </p>
            <Link href="/contact" className="inline-flex items-center gap-2 text-blue-400 text-sm font-semibold hover:text-blue-300">
              Book a free consultation <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Comparison Chart */}
      <section className="py-16 bg-[#0d3b3f] border-t border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <ScrollReveal direction="up">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold text-white mb-3">Plan Comparison</h2>
              <p className="text-slate-400 text-sm">Visual comparison of what each plan offers.</p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            <ScrollReveal delay={0} direction="up">
              <div className="chart-card-dark" style={{ "--chart-color": "#64748b" } as React.CSSProperties}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#f9fafb", marginBottom: "0.25rem" }}>Starter</h3>
                <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "1rem" }}>Feature allocation</p>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <AnimatedDonutProgress value={65} color="#64748b" size={100} strokeWidth={8} label="65%" sublabel="Value" animationDuration={1200} />
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={100} direction="up">
              <div className="chart-card-dark" style={{ "--chart-color": "#15757b" } as React.CSSProperties}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#f9fafb", marginBottom: "0.25rem" }}>Professional</h3>
                <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "1rem" }}>Feature allocation</p>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <AnimatedDonutProgress value={85} color="#15757b" size={100} strokeWidth={8} label="85%" sublabel="Value" animationDuration={1200} />
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={200} direction="up">
              <div className="chart-card-dark" style={{ "--chart-color": "#8b5cf6" } as React.CSSProperties}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#f9fafb", marginBottom: "0.25rem" }}>Enterprise</h3>
                <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "1rem" }}>Feature allocation</p>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <AnimatedDonutProgress value={98} color="#8b5cf6" size={100} strokeWidth={8} label="98%" sublabel="Value" animationDuration={1200} />
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 section-light">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <ScrollReveal direction="up">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Pricing FAQs</h2>
            </div>
          </ScrollReveal>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <ScrollReveal key={faq.q} delay={i * 60} direction="up">
                <div className="pro-card-v2" style={{ padding: "1.5rem" }}>
                  <h3 className="text-slate-900 font-semibold mb-2">{faq.q}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{faq.a}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-14 bg-[#0d3b3f]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <ScrollReveal direction="up">
            <MessageSquare size={32} className="text-blue-400 mx-auto mb-4" />
            <h2 className="text-2xl font-extrabold text-white mb-3">Have a custom requirement?</h2>
            <p className="text-slate-400 mb-6">We build fully bespoke solutions. Tell us what you need and we&apos;ll craft a proposal within 24 hours.</p>
            <Link href="/contact" className="btn-primary mx-auto inline-flex">
              Send Us Your Requirements <ArrowRight size={16} />
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
