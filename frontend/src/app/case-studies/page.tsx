"use client";

import Link from "next/link";
import { ArrowRight, TrendingUp, Star, Utensils, Stethoscope, GraduationCap, BookOpen } from "lucide-react";
import ScrollReveal from "@/components/animations/ScrollReveal";
import AnimatedBarChart from "@/components/charts/AnimatedBarChart";
import AnimatedLineChart from "@/components/charts/AnimatedLineChart";
import AnimatedDonutProgress from "@/components/charts/AnimatedDonutProgress";

const caseStudies = [
  {
    icon: Utensils, industry: "Restaurant", color: "#f97316", bg: "#fff7ed",
    client: "Khan's Family Restaurant", location: "Lahore, Punjab", rating: 5,
    challenge: "Managing 8 tables manually, losing orders, no visibility on inventory, and 2-hour end-of-day reconciliation with Excel sheets.",
    solution: "Deployed Restaurant Management System with POS, Kitchen Display, Inventory tracking, and daily analytics dashboard.",
    results: [
      { metric: "Revenue Increase", value: "+47%", period: "in 6 months", num: 47 },
      { metric: "Order Errors", value: "-95%", period: "first week", num: 95 },
      { metric: "Inventory Waste", value: "-60%", period: "monthly", num: 60 },
      { metric: "Report Time", value: "2 hrs → 5 mins", period: "daily", num: 87 },
    ],
    quote: "Orbitrix ERP gave us visibility we never had before. The kitchen display system alone changed everything — our kitchen team is now synchronized, and customers wait less.",
    person: "Asad Khan, Owner",
    chartData: [
      { name: "Jan", value: 180 }, { name: "Feb", value: 210 }, { name: "Mar", value: 245 },
      { name: "Apr", value: 290 }, { name: "May", value: 340 }, { name: "Jun", value: 380 },
    ],
    barData: [
      { name: "Before", value: 180 }, { name: "Month 1", value: 220 }, { name: "Month 3", value: 280 },
      { name: "Month 6", value: 380 },
    ],
  },
  {
    icon: Stethoscope, industry: "Healthcare", color: "#10b981", bg: "#f0fdf4",
    client: "Shifa Family Clinic", location: "Islamabad, Capital Territory", rating: 5,
    challenge: "Paper-based patient records, double-booked appointments, manual billing errors, and no way to track patient history across visits.",
    solution: "Implemented Clinic Management System with EMR, online appointments, digital prescriptions, and integrated billing.",
    results: [
      { metric: "Patient Throughput", value: "+50%", period: "daily", num: 50 },
      { metric: "Appointment No-shows", value: "-70%", period: "after SMS reminders", num: 70 },
      { metric: "Billing Errors", value: "-100%", period: "fully eliminated", num: 100 },
      { metric: "Record Retrieval", value: "20 min → 10 sec", period: "per patient", num: 92 },
    ],
    quote: "We went from a clinic running on files and folders to a fully digital practice in just 3 days. Patient satisfaction scores went up immediately.",
    person: "Dr. Fatima Malik, Director",
    chartData: [
      { name: "Jan", value: 85 }, { name: "Feb", value: 72 }, { name: "Mar", value: 58 },
      { name: "Apr", value: 42 }, { name: "May", value: 30 }, { name: "Jun", value: 25 },
    ],
    barData: [
      { name: "Before", value: 85 }, { name: "Week 1", value: 65 }, { name: "Month 1", value: 42 },
      { name: "Month 3", value: 25 },
    ],
  },
  {
    icon: GraduationCap, industry: "Education", color: "#8b5cf6", bg: "#faf5ff",
    client: "Horizon Academy", location: "Karachi, Sindh", rating: 5,
    challenge: "Managing 1,200 students with manual attendance, paper fee challans, and Excel-based results that took 3 weeks to publish each term.",
    solution: "Deployed School Management System covering attendance, fee management, exam results, and parent portal.",
    results: [
      { metric: "Fee Collection Rate", value: "72% → 97%", period: "in first month", num: 97 },
      { metric: "Result Publication", value: "3 weeks → 1 day", period: "per exam", num: 95 },
      { metric: "Admin Staff Time", value: "-20 hrs/week", period: "saved on admin", num: 80 },
      { metric: "Parent Complaints", value: "-85%", period: "via self-service portal", num: 85 },
    ],
    quote: "The parent portal was the game-changer for us. Parents now check attendance and fee status themselves instead of calling the office. Our staff can finally focus on education.",
    person: "Tariq Mahmood, Principal",
    chartData: [
      { name: "Jan", value: 72 }, { name: "Feb", value: 81 }, { name: "Mar", value: 88 },
      { name: "Apr", value: 93 }, { name: "May", value: 96 }, { name: "Jun", value: 97 },
    ],
    barData: [
      { name: "Before", value: 72 }, { name: "Week 1", value: 81 }, { name: "Month 1", value: 93 },
      { name: "Month 3", value: 97 },
    ],
  },
  {
    icon: BookOpen, industry: "Retail", color: "#3b82f6", bg: "#eff6ff",
    client: "BookWorld Stationery", location: "Faisalabad, Punjab", rating: 5,
    challenge: "Tracking 15,000+ book titles manually, losing money on overordering slow-moving stock, and no customer loyalty program.",
    solution: "Integrated Book Shop Management System with barcode POS, inventory intelligence, supplier management, and loyalty program.",
    results: [
      { metric: "Stock Accuracy", value: "68% → 99%", period: "after integration", num: 99 },
      { metric: "Inventory Costs", value: "-35%", period: "via smart reordering", num: 35 },
      { metric: "Checkout Time", value: "-80%", period: "with barcode scanning", num: 80 },
      { metric: "Repeat Customers", value: "+40%", period: "with loyalty program", num: 40 },
    ],
    quote: "We used to lose lakhs each year to overstock and wastage. Orbitrix ERP's inventory intelligence told us exactly what to order and when. ROI in the first month.",
    person: "Imran Butt, Owner",
    chartData: [
      { name: "Jan", value: 320 }, { name: "Feb", value: 380 }, { name: "Mar", value: 410 },
      { name: "Apr", value: 460 }, { name: "May", value: 520 }, { name: "Jun", value: 580 },
    ],
    barData: [
      { name: "Before", value: 320 }, { name: "Month 1", value: 410 }, { name: "Month 3", value: 500 },
      { name: "Month 6", value: 580 },
    ],
  },
];

export default function CaseStudiesPage() {
  return (
    <>
      <section className="relative pt-28 pb-16 bg-[#0f172a] overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-40" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <ScrollReveal direction="up">
            <div className="badge badge-blue mx-auto mb-5">Success Stories</div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-5 max-w-4xl mx-auto leading-[1.1]">
              Real Businesses,{" "}
              <span className="gradient-text">Real Results</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Numbers don&apos;t lie. See how businesses across Pakistan transformed their operations
              with Orbitrix ERP management software.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Overview Stats */}
      <section className="py-12 bg-[#0f172a] border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Avg. Revenue Growth", value: "+42%", color: "#3b82f6" },
              { label: "Avg. Error Reduction", value: "-85%", color: "#10b981" },
              { label: "Avg. Time Saved", value: "18h/wk", color: "#8b5cf6" },
              { label: "Client Satisfaction", value: "98%", color: "#f97316" },
            ].map((stat, i) => (
              <ScrollReveal key={stat.label} delay={i * 80} direction="up">
                <div className="metric-card-dark" style={{ "--metric-color": stat.color, textAlign: "center" } as React.CSSProperties}>
                  <p style={{ fontSize: "2rem", fontWeight: 800, color: stat.color, letterSpacing: "-0.03em" }}>{stat.value}</p>
                  <p style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: 500 }}>{stat.label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 section-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          {caseStudies.map((cs, i) => (
            <ScrollReveal key={cs.client} delay={i * 100} direction="up">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Top bar with industry color */}
                <div style={{ height: 4, background: `linear-gradient(90deg, ${cs.color}, ${cs.color}80)` }} />

                <div className="grid lg:grid-cols-3">
                  {/* Left info */}
                  <div className="p-8 border-b lg:border-b-0 lg:border-r border-slate-100">
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: cs.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                      <cs.icon size={24} style={{ color: cs.color }} />
                    </div>
                    <span className="badge badge-blue text-[10px] mb-3">{cs.industry}</span>
                    <h2 className="text-slate-900 font-extrabold text-2xl mb-1">{cs.client}</h2>
                    <p className="text-slate-400 text-sm mb-5">{cs.location}</p>
                    <div className="flex gap-0.5 mb-6">
                      {Array.from({length: cs.rating}).map((_,j) => (
                        <Star key={j} size={14} className="text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Challenge</p>
                      <p className="text-slate-600 text-sm leading-relaxed">{cs.challenge}</p>
                    </div>
                    <div className="mt-4">
                      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Solution</p>
                      <p className="text-slate-600 text-sm leading-relaxed">{cs.solution}</p>
                    </div>
                  </div>

                  {/* Results with charts */}
                  <div className="p-8 border-b lg:border-b-0 lg:border-r border-slate-100">
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-5">Key Results</p>

                    {/* Line chart showing improvement over time */}
                    <div style={{ marginBottom: 20 }}>
                      <AnimatedLineChart
                        data={cs.chartData}
                        height={120}
                        color={cs.color}
                        showGrid={false}
                        animationDuration={1200}
                        strokeWidth={2.5}
                      />
                    </div>

                    {/* Bar chart comparing before/after */}
                    <div style={{ marginBottom: 20 }}>
                      <p style={{ fontSize: "0.7rem", color: "#9ca3af", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Before vs After</p>
                      <AnimatedBarChart
                        data={cs.barData}
                        height={100}
                        barSize={28}
                        showGrid={false}
                        animationDuration={1000}
                        gradient={false}
                        colors={[`${cs.color}60`, cs.color, cs.color, cs.color]}
                      />
                    </div>

                    {/* Result metrics with donut progress */}
                    <div className="grid grid-cols-2 gap-3">
                      {cs.results.map((r) => (
                        <div key={r.metric} style={{ background: cs.bg, borderRadius: 12, padding: "12px", textAlign: "center" }}>
                          <div className="flex justify-center mb-2">
                            <AnimatedDonutProgress
                              value={r.num}
                              color={cs.color}
                              size={50}
                              strokeWidth={5}
                              animationDuration={1000}
                            />
                          </div>
                          <div className="text-lg font-black mb-0.5" style={{ color: cs.color }}>{r.value}</div>
                          <div className="text-slate-600 text-[10px] font-semibold mb-0.5">{r.metric}</div>
                          <div className="text-slate-400 text-[10px]">{r.period}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Testimonial */}
                  <div className="p-8 flex flex-col justify-between">
                    <div>
                      <div className="text-4xl font-black mb-3" style={{ color: `${cs.color}30` }}>&ldquo;</div>
                      <p className="text-slate-700 text-base leading-relaxed italic mb-6">{cs.quote}</p>
                      <p className="text-slate-500 text-sm font-semibold">— {cs.person}</p>
                    </div>
                    <Link href="/demo" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold hover:opacity-80" style={{ color: cs.color }}>
                      Get Similar Results <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-blue-600 to-cyan-500">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <ScrollReveal direction="up">
            <h2 className="text-3xl font-extrabold text-white mb-4">Your Success Story Starts Here</h2>
            <p className="text-blue-100 mb-8">Join 500+ businesses that have transformed their operations. Get your free demo today.</p>
            <Link href="/demo" className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-all text-base">
              Request Free Demo <ArrowRight size={16} />
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
