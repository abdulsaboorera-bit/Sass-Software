"use client";

import Link from "next/link";
import { Target, Eye, Heart, Users, Award, Zap, ArrowRight, CheckCircle, Globe, TrendingUp } from "lucide-react";
import ScrollReveal from "@/components/animations/ScrollReveal";
import AnimatedBarChart from "@/components/charts/AnimatedBarChart";
import AnimatedLineChart from "@/components/charts/AnimatedLineChart";
import AnimatedDonutProgress from "@/components/charts/AnimatedDonutProgress";
import AnimatedPieChart from "@/components/charts/AnimatedPieChart";

const values = [
  { icon: Target, title: "Mission-Driven", desc: "We exist to make enterprise-grade software accessible and affordable for every business in Pakistan, regardless of size.", color: "#15757b", bg: "#f0f9f9" },
  { icon: Eye, title: "Visionary", desc: "We envision a Pakistan where every restaurant, clinic, school, and shop runs on modern digital infrastructure.", color: "#8b5cf6", bg: "#faf5ff" },
  { icon: Heart, title: "Client-Centered", desc: "Your success is our success. We build long-term partnerships, not one-time transactions. Every client gets a dedicated account manager.", color: "#ec4899", bg: "#fdf2f8" },
  { icon: Zap, title: "Innovation First", desc: "We stay ahead of the curve — constantly updating our platforms with the latest technologies to keep your business competitive.", color: "#4a9ea2", bg: "#ecfeff" },
];

const milestones = [
  { year: "2019", title: "Orbitrix ERP Founded", desc: "Started with a vision to digitize Pakistani SMBs with affordable custom software.", value: 12 },
  { year: "2020", title: "First 50 Clients", desc: "Reached our first 50 clients within 12 months, predominantly restaurants and clinics.", value: 50 },
  { year: "2021", title: "Expanded to Education", desc: "Launched School Management System, entering the education sector.", value: 120 },
  { year: "2022", title: "Cloud Platform Launch", desc: "Moved to full cloud architecture, enabling real-time data access from anywhere.", value: 250 },
  { year: "2023", title: "500+ Businesses", desc: "Crossed 500 active businesses across 4 industries, 3 major cities.", value: 500 },
  { year: "2024", title: "ISO Certification", desc: "Achieved ISO 27001 information security certification, the first in our niche.", value: 520 },
];

const team = [
  { name: "Bilal Ahmed", role: "CEO & Founder", avatar: "BA", bio: "10+ years in enterprise software. Former engineering lead at a leading tech firm.", color: "#15757b" },
  { name: "Sana Mirza", role: "CTO", avatar: "SM", bio: "Full-stack architect with expertise in scalable cloud systems and AI integrations.", color: "#8b5cf6" },
  { name: "Usman Iqbal", role: "Head of Product", avatar: "UI", bio: "Product designer turned strategist. Obsessed with user experience and conversion.", color: "#10b981" },
  { name: "Hina Rashid", role: "Head of Client Success", avatar: "HR", bio: "Ensures every client gets maximum value. Manages our onboarding and support teams.", color: "#f97316" },
];

const growthData = [
  { name: "2019", value: 12 },
  { name: "2020", value: 50 },
  { name: "2021", value: 120 },
  { name: "2022", value: 250 },
  { name: "2023", value: 500 },
  { name: "2024", value: 520 },
];

const industryData = [
  { name: "Restaurants", value: 35, color: "#f97316" },
  { name: "Clinics", value: 25, color: "#10b981" },
  { name: "Schools", value: 20, color: "#8b5cf6" },
  { name: "Book Shops", value: 12, color: "#15757b" },
  { name: "Gyms", value: 8, color: "#ef4444" },
];

const satisfactionData = [
  { name: "Q1", value: 88 },
  { name: "Q2", value: 91 },
  { name: "Q3", value: 94 },
  { name: "Q4", value: 96 },
  { name: "Q1'", value: 97 },
  { name: "Q2'", value: 98 },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-28 pb-20 bg-[#0d3b3f] overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-40" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <ScrollReveal direction="up">
            <div className="badge badge-blue mx-auto mb-5">About Orbitrix ERP</div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 max-w-4xl mx-auto leading-[1.1]">
              Empowering Pakistani Businesses with{" "}
              <span className="gradient-text">Digital Transformation</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
              Orbitrix ERP was born from a simple belief: every business — no matter how small —
              deserves world-class management software. Since 2019, we&apos;ve been building custom
              systems that turn operational complexity into competitive advantage.
            </p>
          </ScrollReveal>

          {/* Stats with donut charts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { value: "500+", label: "Clients", num: 500, color: "#15757b" },
              { value: "5+", label: "Years", num: 83, color: "#10b981" },
              { value: "4", label: "Industries", num: 80, color: "#8b5cf6" },
              { value: "98%", label: "Satisfaction", num: 98, color: "#f97316" },
            ].map((s, i) => (
              <ScrollReveal key={s.label} delay={i * 100} direction="up">
                <div className="glass rounded-xl p-5 text-center">
                  <div className="flex justify-center mb-3">
                    <AnimatedDonutProgress
                      value={s.num}
                      color={s.color}
                      size={70}
                      strokeWidth={6}
                      label={s.value}
                      sublabel={s.label}
                      animationDuration={1200}
                    />
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 section-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <ScrollReveal direction="left">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl p-8 text-white">
                <Target size={32} className="mb-4 opacity-80" />
                <h2 className="text-2xl font-bold mb-3">Our Mission</h2>
                <p className="text-blue-100 leading-relaxed">
                  To empower every Pakistani restaurant, clinic, school, and shop with powerful,
                  affordable management software that automates operations, reduces costs, and
                  drives sustainable growth — making digital transformation accessible to all.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="right">
              <div className="bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl p-8 text-white">
                <Eye size={32} className="mb-4 opacity-80" />
                <h2 className="text-2xl font-bold mb-3">Our Vision</h2>
                <p className="text-purple-100 leading-relaxed">
                  To become Pakistan&apos;s most trusted business software partner, enabling a future
                  where every SMB operates with the efficiency of a large enterprise — powered
                  by intelligent, intuitive, and locally-supported technology.
                </p>
              </div>
            </ScrollReveal>
          </div>

          {/* Values */}
          <ScrollReveal direction="up">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold text-slate-900 mb-3">What Drives Us</h2>
            </div>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map((v, i) => (
              <ScrollReveal key={v.title} delay={i * 80} direction="up">
                <div className="pro-card-v2 card-shine" style={{ "--card-accent": v.color, padding: "1.5rem" } as React.CSSProperties}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: v.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                    <v.icon size={22} style={{ color: v.color }} />
                  </div>
                  <h3 className="text-slate-900 font-bold text-lg mb-2">{v.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{v.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Growth Chart Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <ScrollReveal direction="up">
            <div className="section-intro">
              <p className="section-label">Our Growth</p>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-3">
                Consistent Growth, Proven Results
              </h2>
              <p className="text-slate-500">Year-over-year client growth and industry expansion.</p>
            </div>
          </ScrollReveal>

          <div className="grid lg:grid-cols-2 gap-8">
            <ScrollReveal direction="left">
              <div className="chart-card" style={{ "--chart-color": "#15757b" } as React.CSSProperties}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", marginBottom: "0.25rem" }}>Client Growth</h3>
                <p style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "1rem" }}>Active businesses per year</p>
                <AnimatedBarChart
                  data={growthData}
                  height={260}
                  barSize={40}
                  animationDuration={1400}
                />
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right">
              <div className="chart-card" style={{ "--chart-color": "#10b981" } as React.CSSProperties}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", marginBottom: "0.25rem" }}>Industry Distribution</h3>
                <p style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.5rem" }}>Clients by sector</p>
                <AnimatedPieChart data={industryData} height={220} innerRadius={55} outerRadius={85} animationDuration={1200} />
                <div className="chart-legend" style={{ justifyContent: "center" }}>
                  {industryData.map(d => (
                    <div key={d.name} className="chart-legend-item">
                      <div className="chart-legend-dot" style={{ background: d.color }} />
                      <span>{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-[#0d3b3f] relative">
        <div className="absolute inset-0 dot-pattern opacity-30" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
          <ScrollReveal direction="up">
            <div className="text-center mb-12">
              <div className="badge badge-blue mx-auto mb-4">Our Journey</div>
              <h2 className="text-3xl font-extrabold text-white mb-3">
                5 Years of <span className="gradient-text">Building & Growing</span>
              </h2>
            </div>
          </ScrollReveal>

          {/* Growth line chart for timeline */}
          <ScrollReveal direction="up">
            <div className="chart-card-dark mb-12" style={{ "--chart-color": "#15757b" } as React.CSSProperties}>
              <AnimatedLineChart
                data={milestones.map(m => ({ name: m.year, value: m.value }))}
                height={180}
                color="#15757b"
                animationDuration={1500}
              />
            </div>
          </ScrollReveal>

          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500 to-transparent" />
            <div className="space-y-8">
              {milestones.map((m, i) => (
                <ScrollReveal key={m.year} delay={i * 100} direction="up">
                  <div className="flex gap-8 pl-20 relative">
                    <div className="absolute left-5 top-1 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center -translate-x-1/2">
                      <span className="w-2 h-2 rounded-full bg-white" />
                    </div>
                    <div className="glass-card rounded-xl p-5 flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-blue-400 font-black text-lg">{m.year}</span>
                        <h3 className="text-white font-bold">{m.title}</h3>
                      </div>
                      <p className="text-slate-400 text-sm">{m.desc}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 section-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <ScrollReveal direction="up">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Meet the Leadership Team</h2>
              <p className="text-slate-500">The people behind Pakistan&apos;s most trusted business software.</p>
            </div>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, i) => (
              <ScrollReveal key={member.name} delay={i * 80} direction="up">
                <div className="pro-card-v2 card-shine text-center" style={{ "--card-accent": member.color, padding: "2rem" } as React.CSSProperties}>
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: `linear-gradient(135deg, ${member.color}, ${member.color}80)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                    <span className="text-white font-black text-xl">{member.avatar}</span>
                  </div>
                  <h3 className="text-slate-900 font-bold text-lg mb-0.5">{member.name}</h3>
                  <p className="text-sm font-medium mb-3" style={{ color: member.color }}>{member.role}</p>
                  <p className="text-slate-500 text-xs leading-relaxed">{member.bio}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Satisfaction Chart */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <ScrollReveal direction="up">
            <div className="chart-card" style={{ "--chart-color": "#10b981" } as React.CSSProperties}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.5rem" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <TrendingUp size={20} style={{ color: "#10b981" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827" }}>Client Satisfaction Trend</h3>
                  <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>Quarterly NPS scores — consistently above 88</p>
                </div>
              </div>
              <AnimatedLineChart
                data={satisfactionData}
                height={200}
                color="#10b981"
                animationDuration={1400}
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#0d3b3f]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <ScrollReveal direction="up">
            <h2 className="text-3xl font-extrabold text-white mb-4">Ready to Work With Us?</h2>
            <p className="text-slate-400 mb-8">Let&apos;s build something great together. Reach out for a free consultation.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/demo" className="btn-primary">Request Demo <ArrowRight size={16} /></Link>
              <Link href="/contact" className="btn-secondary">Contact Us</Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
