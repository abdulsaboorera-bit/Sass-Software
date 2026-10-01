"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState, useEffect, useRef } from "react";
import ScrollReveal from "@/components/animations/ScrollReveal";
const HeroScene3D = dynamic(() => import("@/components/animations/HeroScene3D"), { ssr: false, loading: () => null });
const AnimatedPieChart = dynamic(() => import("@/components/charts/AnimatedPieChart"), { ssr: false, loading: () => <div className="h-48" /> });
const AnimatedBarChart = dynamic(() => import("@/components/charts/AnimatedBarChart"), { ssr: false, loading: () => <div className="h-48" /> });
const AnimatedLineChart = dynamic(() => import("@/components/charts/AnimatedLineChart"), { ssr: false, loading: () => <div className="h-48" /> });
import AnimatedDonutProgress from "@/components/charts/AnimatedDonutProgress";
import AnimatedProgressBars from "@/components/ui/AnimatedProgressBars";
import {
  ArrowRight, CheckCircle, Star, Utensils, Stethoscope,
  BookOpen, GraduationCap, Cloud, Shield, Users, BarChart3,
  Smartphone, Lock, RefreshCw, Puzzle, TrendingUp,
  Zap, Award, HeadphonesIcon, MessageSquare, LayoutDashboard,
  Globe, ChevronDown, Phone, Dumbbell, Play,
  ChevronRight, Clock, Package, Sparkles, Activity,
  PieChart as PieChartIcon, LineChart as LineChartIcon,
  Target, Rocket, Database, Cpu
} from "lucide-react";

/* ─────────────────────────────────────────────────────────
   Animated Counter
───────────────────────────────────────────────────────── */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const duration = 1400;
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          setVal(Math.round(ease * to));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [to]);

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ─────────────────────────────────────────────────────────
   Dashboard Mockup — Enhanced with Charts
───────────────────────────────────────────────────────── */
function DashboardMockup() {
  return (
    <div className="relative select-none">
      <div className="absolute inset-0 rounded-2xl animate-glow-pulse" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(21,117,123,0.2) 0%, transparent 70%)", filter: "blur(32px)", transform: "scale(1.15)" }} />

      <div className="relative dashboard-mockup" style={{ boxShadow: "0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)" }}>
        <div className="mockup-title-bar">
          <span className="mockup-dot-r" />
          <span className="mockup-dot-y" />
          <span className="mockup-dot-g" />
          <div className="mockup-url">app.orbitrixerp.com/dashboard</div>
        </div>

        <div className="p-4 space-y-3">
          {/* KPI cards */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: "Revenue",   value: "₨2.4M",  delta: "+12.5%", deltaColor: "#4ade80" },
              { label: "Orders",    value: "1,247",   delta: "+8.3%",  deltaColor: "#4a9ea2" },
              { label: "Customers", value: "892",     delta: "+5.1%",  deltaColor: "#a78bfa" },
            ].map(k => (
              <div key={k.label} className="mockup-kpi">
                <p style={{ fontSize: 10, color: "#6e7681", marginBottom: 3 }}>{k.label}</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#f0f6fc", letterSpacing: "-0.02em" }}>{k.value}</p>
                <p style={{ fontSize: 10, fontWeight: 600, color: k.deltaColor, marginTop: 2 }}>{k.delta}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="mockup-kpi">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#c9d1d9" }}>Revenue Trend</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#4a9ea2" }}>+18.2% vs last week</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 56 }}>
              {[28, 55, 38, 72, 50, 88, 65].map((h, i) => (
                <div
                  key={i}
                  className="mockup-chart-bar flex-1"
                  style={{
                    height: `${h}%`,
                    background: i === 5 ? "linear-gradient(180deg,#15757b,#0f4c50)" : "rgba(255,255,255,0.07)",
                    borderRadius: "3px 3px 0 0",
                  }}
                />
              ))}
            </div>
            <div style={{ display: "flex", marginTop: 4 }}>
              {["M","T","W","T","F","S","S"].map((d, i) => (
                <span key={i} style={{ flex: 1, textAlign: "center", fontSize: 9, color: "#484f58" }}>{d}</span>
              ))}
            </div>
          </div>

          {/* Activity feed */}
          <div className="mockup-kpi" style={{ padding: "10px 12px" }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#c9d1d9", marginBottom: 8 }}>Live Activity</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {[
                { icon: "🍕", msg: "Order #1089 — completed",           time: "2m ago",  dot: "#4ade80" },
                { icon: "👤", msg: "New member registered",              time: "5m ago",  dot: "#4a9ea2" },
                { icon: "⚠️", msg: "Low stock: Chicken breast (3 left)", time: "11m ago", dot: "#fbbf24" },
              ].map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: a.dot, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: "#8b949e", flex: 1 }}>{a.msg}</span>
                  <span style={{ fontSize: 9, color: "#484f58", flexShrink: 0 }}>{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating pill — System Status */}
      <div
        className="absolute -top-4 -right-3 animate-float"
        style={{ animationDelay: "0.8s", background: "rgba(13,17,23,0.95)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "10px 16px", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="live-dot" />
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#f0f6fc" }}>All Systems Operational</p>
            <p style={{ fontSize: 9, color: "#4ade80" }}>99.9% uptime this month</p>
          </div>
        </div>
      </div>

      {/* Floating pill — Revenue */}
      <div
        className="absolute -bottom-4 -left-3 animate-float"
        style={{ animationDelay: "1.8s", background: "rgba(13,17,23,0.95)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "10px 16px", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 10, background: "rgba(21,117,123,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TrendingUp size={14} style={{ color: "#4a9ea2" }} />
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#f0f6fc" }}>Revenue up 32%</p>
            <p style={{ fontSize: 9, color: "#4a9ea2" }}>Compared to last month</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Data
───────────────────────────────────────────────────────── */
const solutions = [
  {
    icon: Utensils, title: "Restaurant Management",
    tag: "F&B", tagStyle: "badge-orange-light",
    accent: "#f97316", accentEnd: "#ef4444", accentLight: "#fff7ed", iconBg: "#fff7ed",
    desc: "Complete digital operations for restaurants, cafes, and food chains — from tableside ordering to kitchen coordination and nightly reporting.",
    features: ["POS & Split Billing", "Kitchen Display System", "Inventory & Wastage", "Staff Scheduling", "Revenue Analytics"],
    chartData: [
      { name: "Mon", value: 4200 },
      { name: "Tue", value: 5800 },
      { name: "Wed", value: 4900 },
      { name: "Thu", value: 7200 },
      { name: "Fri", value: 8500 },
      { name: "Sat", value: 9800 },
      { name: "Sun", value: 7600 },
    ],
    metrics: [
      { label: "Avg. Revenue/Day", value: "₨6.3K" },
      { label: "Orders Today", value: "284" },
      { label: "Table Turnover", value: "3.2x" },
    ],
    href: "/solutions/restaurant",
  },
  {
    icon: Stethoscope, title: "Clinic Management",
    tag: "Healthcare", tagStyle: "badge-green-light",
    accent: "#10b981", accentEnd: "#4a9ea2", accentLight: "#f0fdf4", iconBg: "#f0fdf4",
    desc: "Digitise your entire clinic — from patient registration to discharge. EMR, appointments, prescriptions and billing in one connected platform.",
    features: ["Electronic Medical Records", "Online Appointment Booking", "Digital Prescriptions", "Doctor Scheduling", "Automated Billing"],
    chartData: [
      { name: "Mon", value: 45 },
      { name: "Tue", value: 62 },
      { name: "Wed", value: 58 },
      { name: "Thu", value: 71 },
      { name: "Fri", value: 68 },
      { name: "Sat", value: 54 },
      { name: "Sun", value: 32 },
    ],
    metrics: [
      { label: "Patients Today", value: "127" },
      { label: "Appointments", value: "48" },
      { label: "Revenue", value: "₨4.2L" },
    ],
    href: "/solutions/clinic",
  },
  {
    icon: BookOpen, title: "Book Shop Management",
    tag: "Retail", tagStyle: "badge-blue-light",
    accent: "#15757b", accentEnd: "#8b5cf6", accentLight: "#f0f9f9", iconBg: "#f0f9f9",
    desc: "End-to-end retail management for book stores and stationery shops with barcode scanning, supplier management and loyalty programs.",
    features: ["Barcode POS Checkout", "ISBN Inventory Tracking", "Supplier & Purchase Orders", "Sales Analytics", "Customer Loyalty"],
    chartData: [
      { name: "Mon", value: 320 },
      { name: "Tue", value: 480 },
      { name: "Wed", value: 410 },
      { name: "Thu", value: 560 },
      { name: "Fri", value: 620 },
      { name: "Sat", value: 780 },
      { name: "Sun", value: 540 },
    ],
    metrics: [
      { label: "Books Sold", value: "3,710" },
      { label: "Revenue", value: "₨8.9L" },
      { label: "Top Category", value: "Academic" },
    ],
    href: "/solutions/bookshop",
  },
  {
    icon: GraduationCap, title: "School Management",
    tag: "Education", tagStyle: "badge-purple-light",
    accent: "#8b5cf6", accentEnd: "#ec4899", accentLight: "#faf5ff", iconBg: "#faf5ff",
    desc: "Comprehensive school ERP covering student records, daily attendance, fee collection, examinations and a dedicated parent communication portal.",
    features: ["Student & Staff Records", "Attendance Tracking", "Fee Collection & Challans", "Exam Results", "Parent Portal"],
    chartData: [
      { name: "Mon", value: 95 },
      { name: "Tue", value: 92 },
      { name: "Wed", value: 97 },
      { name: "Thu", value: 94 },
      { name: "Fri", value: 96 },
      { name: "Sat", value: 89 },
      { name: "Sun", value: 0 },
    ],
    metrics: [
      { label: "Students", value: "1,200" },
      { label: "Attendance", value: "94%" },
      { label: "Fee Collection", value: "97%" },
    ],
    href: "/solutions/school",
  },
  {
    icon: Dumbbell, title: "Gym Management",
    tag: "Fitness", tagStyle: "badge-red-light",
    accent: "#ef4444", accentEnd: "#f97316", accentLight: "#fef2f2", iconBg: "#fef2f2",
    desc: "Full-featured fitness centre management — member profiles, membership billing, trainer scheduling, biometric check-in and revenue dashboards.",
    features: ["Member Profiles & Plans", "Auto Renewal Billing", "Trainer Scheduling", "Biometric Check-in", "Revenue Reports"],
    chartData: [
      { name: "Mon", value: 180 },
      { name: "Tue", value: 220 },
      { name: "Wed", value: 195 },
      { name: "Thu", value: 240 },
      { name: "Fri", value: 280 },
      { name: "Sat", value: 310 },
      { name: "Sun", value: 160 },
    ],
    metrics: [
      { label: "Active Members", value: "1,450" },
      { label: "Check-ins Today", value: "284" },
      { label: "Revenue", value: "₨12.4L" },
    ],
    href: "/solutions/gym",
  },
];

const features = [
  { icon: Cloud,      title: "Cloud Access",        desc: "Work from any browser, anywhere. No installation, no server costs.", color: "#15757b", stat: "99.9%" },
  { icon: Shield,     title: "Bank-Grade Security",  desc: "AES-256 encryption at rest, TLS in transit, and automated hourly backups.", color: "#10b981", stat: "256-bit" },
  { icon: Users,      title: "Unlimited Users",      desc: "Add your entire team with granular, role-based permissions per department.", color: "#8b5cf6", stat: "∞" },
  { icon: BarChart3,  title: "Real-Time Analytics",  desc: "Live dashboards and one-click reports exportable to Excel or PDF.", color: "#f97316", stat: "Real-time" },
  { icon: Smartphone, title: "Mobile-Optimised",     desc: "The same great experience on phones and tablets — always responsive.", color: "#4a9ea2", stat: "100%" },
  { icon: Lock,       title: "Access Controls",      desc: "Define precisely what each role can view, create, edit or delete.", color: "#ec4899", stat: "RBAC" },
  { icon: RefreshCw,  title: "Auto Backups",         desc: "Your data is captured hourly and stored across multiple secure locations.", color: "#f59e0b", stat: "Hourly" },
  { icon: Puzzle,     title: "API & Integrations",   desc: "Connect to payment gateways, SMS services, and custom third-party APIs.", color: "#64748b", stat: "REST+" },
];

const steps = [
  { n: "01", icon: MessageSquare, title: "Discovery Call",     desc: "We map your workflows, pain points and goals in a free 30-minute call with a domain specialist.", color: "#15757b" },
  { n: "02", icon: LayoutDashboard,title: "Custom Build",     desc: "Our engineers develop your system around your exact processes — nothing generic, nothing wasted.", color: "#8b5cf6" },
  { n: "03", icon: Puzzle,        title: "Test & Refine",      desc: "Rigorous QA testing, then your team reviews and we refine until every detail is right.", color: "#10b981" },
  { n: "04", icon: Globe,         title: "Deploy to Cloud",    desc: "Your system goes live on enterprise-grade infrastructure with zero downtime during migration.", color: "#f97316" },
  { n: "05", icon: GraduationCap, title: "Team Training",      desc: "Live training sessions — on-site in Lahore or remote — so every staff member is confident.", color: "#4a9ea2" },
  { n: "06", icon: HeadphonesIcon,title: "Ongoing Support",    desc: "Monthly updates, a dedicated account manager, and 24/7 expert support included in every plan.", color: "#ef4444" },
];

const testimonials = [
  {
    name: "Asad Khan", role: "Owner", company: "Khan's Family Restaurant", city: "Lahore",
    initials: "AK", accentBg: "#fff7ed", accentText: "#f97316",
    text: "We handle 3× more orders with the same staff. The kitchen display system eliminated communication errors entirely. Revenue grew 47% in six months — the ROI was obvious within the first week.",
    metrics: [{ v: "+47%", l: "Revenue" }, { v: "3×", l: "Order Capacity" }],
    chartData: [
      { name: "Jan", value: 180 }, { name: "Feb", value: 210 }, { name: "Mar", value: 245 },
      { name: "Apr", value: 290 }, { name: "May", value: 340 }, { name: "Jun", value: 380 },
    ],
  },
  {
    name: "Dr. Fatima Malik", role: "Director", company: "Shifa Clinic", city: "Islamabad",
    initials: "FM", accentBg: "#f0fdf4", accentText: "#10b981",
    text: "Completely paperless in 3 days. Patient check-in dropped from 8 minutes to under 60 seconds. Appointment no-shows fell 70% with SMS reminders, and billing errors went to zero.",
    metrics: [{ v: "–70%", l: "No-shows" }, { v: "60s", l: "Check-in Time" }],
    chartData: [
      { name: "Jan", value: 85 }, { name: "Feb", value: 72 }, { name: "Mar", value: 58 },
      { name: "Apr", value: 42 }, { name: "May", value: 30 }, { name: "Jun", value: 25 },
    ],
  },
  {
    name: "Tariq Mahmood", role: "Principal", company: "Horizon Academy", city: "Karachi",
    initials: "TM", accentBg: "#faf5ff", accentText: "#8b5cf6",
    text: "Fee collection went from 72% to 97% in the first month. Our admin team saves 20 hours weekly. Parents stopped calling the office — they have everything in the portal.",
    metrics: [{ v: "97%", l: "Fee Collection" }, { v: "20h", l: "Saved Weekly" }],
    chartData: [
      { name: "Jan", value: 72 }, { name: "Feb", value: 81 }, { name: "Mar", value: 88 },
      { name: "Apr", value: 93 }, { name: "May", value: 96 }, { name: "Jun", value: 97 },
    ],
  },
];

const stats = [
  { value: 500, suffix: "+", label: "Businesses Served",    sub: "Across Pakistan",   icon: Users,        color: "#15757b" },
  { value: 98,  suffix: "%", label: "Client Satisfaction",  sub: "Based on surveys",   icon: Award,        color: "#10b981" },
  { value: 5,   suffix: "",  label: "Industry Solutions",   sub: "Purpose-built each", icon: Package,      color: "#8b5cf6" },
  { value: 24,  suffix: "/7",label: "Expert Support",       sub: "Zero hold times",    icon: HeadphonesIcon,color: "#f97316" },
];

const industryPieData = [
  { name: "Restaurants", value: 35, color: "#f97316" },
  { name: "Clinics", value: 25, color: "#10b981" },
  { name: "Schools", value: 20, color: "#8b5cf6" },
  { name: "Book Shops", value: 12, color: "#15757b" },
  { name: "Gyms", value: 8, color: "#ef4444" },
];

const revenueBarData = [
  { name: "Jul", value: 42 },
  { name: "Aug", value: 58 },
  { name: "Sep", value: 51 },
  { name: "Oct", value: 67 },
  { name: "Nov", value: 73 },
  { name: "Dec", value: 89 },
  { name: "Jan", value: 95 },
  { name: "Feb", value: 102 },
  { name: "Mar", value: 118 },
  { name: "Apr", value: 127 },
  { name: "May", value: 134 },
  { name: "Jun", value: 148 },
];

const growthLineData = [
  { name: "Q1", value: 120, value2: 85 },
  { name: "Q2", value: 210, value2: 140 },
  { name: "Q3", value: 340, value2: 220 },
  { name: "Q4", value: 480, value2: 310 },
  { name: "Q1'", value: 620, value2: 420 },
  { name: "Q2'", value: 780, value2: 540 },
];

/* ─────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <>
      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <section className="hero-section flex flex-col items-center justify-center pt-24 sm:pt-28 pb-8 sm:pb-12" style={{ minHeight: "100svh" }}>
        <div className="hero-grid" />
        <div className="hero-glow animate-glow-pulse hidden sm:block" style={{ width: 650, height: 650, left: "50%", top: "20%", transform: "translateX(-50%)", background: "radial-gradient(circle, rgba(21,117,123,0.14) 0%, transparent 70%)" }} />
        <div className="hero-glow animate-glow-pulse hidden md:block" style={{ width: 500, height: 500, right: "15%", bottom: "20%", background: "radial-gradient(circle, rgba(74,158,162,0.08) 0%, transparent 70%)", animationDelay: "1.5s" }} />
        <HeroScene3D />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 animate-fade-up delay-0 mx-auto"
            style={{ background: "rgba(21,117,123,0.08)", border: "1px solid rgba(21,117,123,0.15)", backdropFilter: "blur(8px)" }}>
            <span className="live-dot" />
            <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#4a9ea2" }}>
              Pakistan&apos;s #1 Business Software
            </span>
          </div>

          {/* Heading */}
          <h1 className="animate-fade-up delay-75 mx-auto px-2"
            style={{ fontSize: "clamp(2rem, 5vw, 4rem)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.035em", color: "#f9fafb", marginBottom: "1.25rem", maxWidth: 800 }}>
            Management Software<br />
            <span className="gradient-text">Built for You</span>
          </h1>

          {/* Subheading */}
          <p className="animate-fade-up delay-150 mx-auto px-2"
            style={{ fontSize: "clamp(0.9rem, 2vw, 1.125rem)", lineHeight: 1.75, color: "#94a3b8", maxWidth: 560, marginBottom: "2rem" }}>
            Custom-built systems for restaurants, clinics, book shops, schools, and gyms.
            We automate your daily operations so you can focus on growing your business.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-10 animate-fade-up delay-225 justify-center items-center px-2">
            <Link href="/demo" className="btn-primary w-full sm:w-auto text-center justify-center" style={{ fontSize: "0.9375rem", padding: "14px 32px" }}>
              Get a Free Demo <ArrowRight size={15} />
            </Link>
            <Link href="/solutions" className="btn-secondary w-full sm:w-auto text-center justify-center" style={{ fontSize: "0.9375rem", padding: "13px 32px" }}>
              Explore Solutions
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-8 animate-fade-up delay-300 justify-center mb-8 sm:mb-12 px-2">
            {[
              { icon: CheckCircle, text: "Free setup & onboarding" },
              { icon: Shield,      text: "Enterprise-grade security" },
              { icon: Clock,       text: "Live in 48 hours" },
            ].map(i => (
              <span key={i.text} className="flex items-center justify-center gap-2" style={{ color: "#64748b", fontSize: "0.8125rem" }}>
                <i.icon size={14} style={{ color: "#22c55e" }} /> {i.text}
              </span>
            ))}
          </div>

          {/* Dashboard Mockup — hidden on very small screens */}
          <div className="animate-fade-up delay-375 max-w-4xl mx-auto mb-8 sm:mb-12 hidden sm:block">
            <DashboardMockup />
          </div>

          {/* Trusted by — Marquee */}
          <div className="animate-fade-up delay-450 mx-auto" style={{ maxWidth: 700, paddingTop: "1.75rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#475569", marginBottom: "0.85rem" }}>
              Trusted by 500+ businesses
            </p>
            <div style={{ overflow: "hidden", maskImage: "linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)" }}>
              <div className="animate-marquee" style={{ display: "flex", gap: "0.5rem", width: "max-content" }}>
                {[...["Khan's Restaurant","Shifa Clinic","Horizon Academy","BookWorld","City Hospital","Iron Fitness"], ...["Khan's Restaurant","Shifa Clinic","Horizon Academy","BookWorld","City Hospital","Iron Fitness"]].map((c, idx) => (
                  <span key={`${c}-${idx}`} style={{ fontSize: "0.78rem", color: "#4b5563", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "6px 14px", fontWeight: 500, whiteSpace: "nowrap" }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Scroll cue */}
          <div className="flex flex-col items-center gap-1.5 mt-10 animate-bounce" style={{ color: "#374151" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Scroll</span>
            <ChevronDown size={14} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          STATS — Dark glass cards with mini charts
      ══════════════════════════════════════════════════ */}
      <section style={{ background: "#0a2f32", position: "relative", overflow: "hidden" }}>
        <div className="hero-grid" style={{ opacity: 0.5 }} />
        <div className="hero-glow" style={{ width: 800, height: 400, left: "50%", top: "50%", transform: "translate(-50%, -50%)", background: "radial-gradient(ellipse, rgba(21,117,123,0.08) 0%, transparent 70%)" }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <ScrollReveal key={s.label} delay={i * 100} direction="up">
                <div className="metric-card-dark text-center" style={{ "--metric-color": s.color } as React.CSSProperties}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: "1rem" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <s.icon size={20} style={{ color: s.color }} />
                    </div>
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold" style={{ letterSpacing: "-0.04em", color: "#f9fafb", lineHeight: 1, marginBottom: "0.4rem" }}>
                    <Counter to={s.value} suffix={s.suffix} />
                  </div>
                  <p className="text-sm font-semibold" style={{ color: "#e2e8f0", marginBottom: "0.2rem" }}>{s.label}</p>
                  <p className="text-xs" style={{ color: "#64748b" }}>{s.sub}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          ANALYTICS DASHBOARD — Full-width chart section
      ══════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-20 lg:py-[7rem]" style={{ background: "#0f172a", position: "relative", overflow: "hidden" }}>
        <div className="absolute inset-0 dot-pattern" style={{ opacity: 0.3 }} />
        <div className="hero-glow" style={{ width: 600, height: 600, right: "10%", top: "20%", background: "radial-gradient(circle, rgba(21,117,123,0.1) 0%, transparent 70%)" }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <ScrollReveal direction="up">
            <div className="section-intro">
              <p className="section-label-dark">Platform Analytics</p>
              <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "#f9fafb", marginBottom: "1rem" }}>
                Real-Time Insights Across Every Industry
              </h2>
              <p style={{ fontSize: "1rem", color: "#94a3b8", lineHeight: 1.7 }}>
                Live dashboards with actionable analytics — see exactly how your business performs at a glance.
              </p>
            </div>
          </ScrollReveal>

          {/* Main analytics grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Revenue Growth — Large Area Chart */}
            <ScrollReveal delay={0} direction="up" className="lg:col-span-2">
              <div className="chart-card-dark" style={{ "--chart-color": "#15757b" } as React.CSSProperties}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: "1.5rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#f9fafb", marginBottom: "0.25rem", textAlign: "center" }}>Platform Revenue Growth</h3>
                    <p style={{ fontSize: "0.8rem", color: "#64748b", textAlign: "center" }}>Monthly recurring revenue across all clients</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(34,197,94,0.1)", padding: "6px 12px", borderRadius: 8 }}>
                    <TrendingUp size={14} style={{ color: "#4ade80" }} />
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#4ade80" }}>+18.2%</span>
                  </div>
                </div>
                <AnimatedLineChart
                  data={revenueBarData}
                  height={280}
                  color="#15757b"
                  color2="#8b5cf6"
                  name2="Last Year"
                  animationDuration={1500}
                />
                <div className="chart-legend">
                  <div className="chart-legend-item">
                    <div className="chart-legend-dot" style={{ background: "#15757b" }} />
                    <span>This Year</span>
                  </div>
                  <div className="chart-legend-item">
                    <div className="chart-legend-dot" style={{ background: "#8b5cf6" }} />
                    <span>Last Year</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Industry Distribution — Pie Chart */}
            <ScrollReveal delay={100} direction="up">
              <div className="chart-card-dark text-center" style={{ "--chart-color": "#8b5cf6" } as React.CSSProperties}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#f9fafb", marginBottom: "0.25rem" }}>Industry Distribution</h3>
                <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "1rem" }}>Client breakdown by sector</p>
                <AnimatedPieChart data={industryPieData} height={200} innerRadius={55} outerRadius={85} animationDuration={1200} />
                <div className="chart-legend" style={{ justifyContent: "center" }}>
                  {industryPieData.map(d => (
                    <div key={d.name} className="chart-legend-item">
                      <div className="chart-legend-dot" style={{ background: d.color }} />
                      <span>{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Second row — Progress rings and bar chart */}
          <div className="grid md:grid-cols-3 gap-6 mt-6">
            {/* KPI Donut Rings */}
            <ScrollReveal delay={0} direction="up">
              <div className="chart-card-dark text-center" style={{ "--chart-color": "#10b981" } as React.CSSProperties}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#f9fafb", marginBottom: "1.5rem" }}>Performance Metrics</h3>
                <div style={{ display: "flex", justifyContent: "space-around" }}>
                  <div style={{ textAlign: "center" }}>
                    <AnimatedDonutProgress value={98} color="#15757b" size={90} strokeWidth={8} label="98%" sublabel="Uptime" />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <AnimatedDonutProgress value={92} color="#10b981" size={90} strokeWidth={8} label="92%" sublabel="Satisfaction" />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <AnimatedDonutProgress value={87} color="#8b5cf6" size={90} strokeWidth={8} label="87%" sublabel="Retention" />
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Client Satisfaction — Bar Chart */}
            <ScrollReveal delay={100} direction="up">
              <div className="chart-card-dark text-center" style={{ "--chart-color": "#f97316" } as React.CSSProperties}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#f9fafb", marginBottom: "0.25rem" }}>Client Satisfaction</h3>
                <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.5rem" }}>Monthly NPS scores</p>
                <AnimatedBarChart
                  data={[
                    { name: "Jan", value: 78 },
                    { name: "Feb", value: 82 },
                    { name: "Mar", value: 85 },
                    { name: "Apr", value: 88 },
                    { name: "May", value: 91 },
                    { name: "Jun", value: 94 },
                  ]}
                  height={180}
                  barSize={24}
                  animationDuration={1200}
                />
              </div>
            </ScrollReveal>

            {/* User Activity — Donut */}
            <ScrollReveal delay={200} direction="up">
              <div className="chart-card-dark text-center" style={{ "--chart-color": "#ec4899" } as React.CSSProperties}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#f9fafb", marginBottom: "0.25rem" }}>User Activity</h3>
                <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.5rem" }}>Active users by plan</p>
                <AnimatedPieChart
                  data={[
                    { name: "Professional", value: 45, color: "#15757b" },
                    { name: "Enterprise", value: 30, color: "#8b5cf6" },
                    { name: "Starter", value: 25, color: "#64748b" },
                  ]}
                  height={180}
                  innerRadius={45}
                  outerRadius={70}
                  animationDuration={1000}
                />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SOLUTIONS — Premium cards with mini charts
      ══════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-20 lg:py-[7rem]" style={{ background: "#ffffff" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <ScrollReveal direction="up">
            <div className="section-intro">
              <p className="section-label">Our Solutions</p>
              <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.625rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "#111827", marginBottom: "1rem" }}>
                Purpose-Built for Five Industries
              </h2>
              <p style={{ fontSize: "1.0625rem", color: "#6b7280", lineHeight: 1.7 }}>
                Not generic software adapted to fit — each product is engineered around how your industry actually operates.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {solutions.map((sol, i) => (
              <ScrollReveal key={sol.title} delay={i * 80} direction="up">
                <div
                  className="solution-card-v2 h-full flex flex-col"
                  style={{ "--sol-color": sol.accent, "--sol-color-end": sol.accentEnd } as React.CSSProperties}
                >
                  {/* Header with gradient top bar */}
                  <div className="solution-header text-center">
                    <div className="flex items-center justify-center mb-4">
                      <div className="icon-box-lg" style={{ background: sol.iconBg }}>
                        <sol.icon size={26} style={{ color: sol.accent }} />
                      </div>
                    </div>
                    <span className={`badge ${sol.tagStyle}`} style={{ marginBottom: "0.75rem" }}>{sol.tag}</span>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#111827", marginBottom: "0.5rem", letterSpacing: "-0.01em" }}>
                      {sol.title}
                    </h3>
                    <p style={{ fontSize: "0.85rem", color: "#6b7280", lineHeight: 1.7 }}>
                      {sol.desc}
                    </p>
                  </div>

                  {/* Mini Chart */}
                  <div className="solution-chart">
                    <AnimatedBarChart
                      data={sol.chartData}
                      height={100}
                      barSize={16}
                      showGrid={false}
                      showAxis={false}
                      animationDuration={1000}
                      gradient={false}
                      colors={[sol.accent, sol.accentEnd || sol.accent]}
                    />
                  </div>

                  {/* Metrics */}
                  <div className="solution-body flex-1 flex flex-col items-center text-center">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: "1rem", width: "100%" }}>
                      {sol.metrics.map(m => (
                        <div key={m.label} style={{ background: sol.accentLight, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                          <p style={{ fontSize: "1rem", fontWeight: 800, color: sol.accent, letterSpacing: "-0.03em" }}>{m.value}</p>
                          <p style={{ fontSize: "0.65rem", color: "#6b7280", fontWeight: 500, marginTop: 2 }}>{m.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Features */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "1.5rem", flex: 1, justifyContent: "center" }}>
                      {sol.features.map(f => (
                        <span key={f} className="feature-chip">
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: sol.accent, flexShrink: 0, opacity: 0.7 }} />
                          <span style={{ fontSize: "0.76rem", color: "#4b5563" }}>{f}</span>
                        </span>
                      ))}
                    </div>

                    {/* Footer CTA */}
                    <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "1.25rem", width: "100%", textAlign: "center" }}>
                      <Link href={sol.href} className="arrow-link justify-center" style={{ fontSize: "0.875rem", color: sol.accent }}>
                        Explore full solution <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}

            {/* CTA tile */}
            <ScrollReveal delay={5 * 80} direction="up">
              <div className="h-full" style={{
                background: "linear-gradient(135deg, #0a2f32 0%, #0f172a 50%, #0a2f32 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 20,
                padding: "2rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: 300,
                position: "relative",
                overflow: "hidden",
              }}>
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 80%, rgba(21,117,123,0.15) 0%, transparent 60%)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 20%, rgba(74,158,162,0.1) 0%, transparent 50%)", pointerEvents: "none" }} />

                <div style={{ position: "relative" }}>
                  <div className="icon-box-lg" style={{ background: "rgba(21,117,123,0.15)", marginBottom: "1.5rem" }}>
                    <Sparkles size={24} style={{ color: "#4a9ea2" }} />
                  </div>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#f9fafb", marginBottom: "0.65rem" }}>
                    Need a Custom Solution?
                  </h3>
                  <p style={{ fontSize: "0.875rem", color: "#94a3b8", lineHeight: 1.7 }}>
                    We build bespoke software for any industry. Tell us your requirements and we&apos;ll design it from scratch.
                  </p>
                </div>
                <Link href="/contact" className="arrow-link" style={{ fontSize: "0.875rem", color: "#4a9ea2", marginTop: "1.75rem", position: "relative" }}>
                  Discuss your project <ArrowRight size={14} />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          GROWTH SECTION — Line charts with scroll animation
      ══════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-20 lg:py-[7rem]" style={{ background: "#f8fafc", borderTop: "1px solid #e5e7eb" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <ScrollReveal direction="up">
            <div className="section-intro">
              <p className="section-label">Client Growth</p>
              <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "#111827", marginBottom: "1rem" }}>
                Businesses Scale Faster With Orbitrix ERP
              </h2>
              <p style={{ fontSize: "1rem", color: "#6b7280", lineHeight: 1.7 }}>
                Average client growth trajectory after adopting our platform.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Revenue Growth */}
            <ScrollReveal direction="up">
              <div className="chart-card text-center" style={{ "--chart-color": "#15757b" } as React.CSSProperties}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: "1.5rem" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f0f9f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <TrendingUp size={20} style={{ color: "#15757b" }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827" }}>Average Revenue Growth</h3>
                    <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>Quarterly revenue per client (in ₨ thousands)</p>
                  </div>
                </div>
                <AnimatedLineChart
                  data={growthLineData}
                  height={220}
                  color="#15757b"
                  color2="#10b981"
                  name2="Net Profit"
                  animationDuration={1400}
                />
                <div className="chart-legend" style={{ justifyContent: "center" }}>
                  <div className="chart-legend-item">
                    <div className="chart-legend-dot" style={{ background: "#15757b" }} />
                    <span>Revenue</span>
                  </div>
                  <div className="chart-legend-item">
                    <div className="chart-legend-dot" style={{ background: "#10b981" }} />
                    <span>Net Profit</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Client Satisfaction Progress */}
            <ScrollReveal direction="up">
              <div className="chart-card text-center" style={{ "--chart-color": "#10b981" } as React.CSSProperties}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: "1.5rem" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Target size={20} style={{ color: "#10b981" }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827" }}>Platform Performance</h3>
                    <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>Key performance indicators</p>
                  </div>
                </div>

                {/* Progress bars */}
                <AnimatedProgressBars />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          HOW IT WORKS — Timeline style
      ══════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-20 lg:py-[7rem]" style={{ background: "#ffffff", borderTop: "1px solid #e5e7eb" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <ScrollReveal direction="up">
            <div className="section-intro">
              <p className="section-label">How It Works</p>
              <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "#111827", marginBottom: "1rem" }}>
                From Consultation to Go-Live in 2 Weeks
              </h2>
              <p style={{ fontSize: "1rem", color: "#6b7280", lineHeight: 1.7 }}>
                A proven delivery process that gets you live fast, trained well, and supported always.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ alignItems: "stretch" }}>
            {steps.map((s, i) => (
              <ScrollReveal key={s.n} delay={i * 70} direction="up" className="h-full">
                <div
                  className="pro-card-v2 card-shine text-center h-full"
                  style={{ "--card-accent": s.color, padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center" } as React.CSSProperties}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: "1.25rem" }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 12,
                      background: `linear-gradient(135deg, ${s.color}, ${s.color}cc)`,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      boxShadow: `0 4px 12px ${s.color}30`,
                    }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#fff" }}>{s.n}</span>
                    </div>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <s.icon size={18} style={{ color: "#6b7280" }} />
                    </div>
                  </div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827", marginBottom: "0.55rem" }}>
                    {s.title}
                  </h3>
                  <p style={{ fontSize: "0.875rem", color: "#6b7280", lineHeight: 1.7 }}>{s.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ╀═════════════════════════════════════════════════
          FEATURES — With top accent lines and stats
      ══════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-20 lg:py-[7rem]" style={{ background: "#f8fafc", borderTop: "1px solid #e5e7eb", position: "relative" }}>
        <div className="dot-pattern" style={{ position: "absolute", inset: 0, opacity: 0.3, pointerEvents: "none" }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <ScrollReveal direction="up">
            <div className="section-intro">
              <p className="section-label">Platform Features</p>
              <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "#111827", marginBottom: "1rem" }}>
                Enterprise Infrastructure.<br />Zero Complexity.
              </h2>
              <p style={{ fontSize: "1rem", color: "#6b7280", lineHeight: 1.7 }}>
                Every plan includes the full platform — not a feature-gated tier system.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 60} direction="up">
                <div className="pro-card-v2 card-shine group text-center" style={{ "--card-accent": f.color, "--card-glow": `${f.color}15`, padding: "1.75rem", position: "relative", overflow: "hidden" } as React.CSSProperties}>
                  <div className="icon-box mb-5 mx-auto" style={{ background: "#f8fafc" }}>
                    <f.icon size={21} style={{ color: f.color, transition: "transform 0.3s ease" }} />
                  </div>
                  <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#111827", marginBottom: "0.5rem" }}>{f.title}</h3>
                  <p style={{ fontSize: "0.85rem", color: "#6b7280", lineHeight: 1.65, marginBottom: "1rem" }}>{f.desc}</p>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${f.color}08`, border: `1px solid ${f.color}15`, borderRadius: 8, padding: "5px 10px" }}>
                    <Activity size={12} style={{ color: f.color }} />
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: f.color }}>{f.stat}</span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          TESTIMONIALS — Premium with mini charts
      ══════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-20 lg:py-[7rem]" style={{ background: "#ffffff", borderTop: "1px solid #e5e7eb" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <ScrollReveal direction="up">
            <div className="section-intro">
              <p className="section-label">Client Results</p>
              <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "#111827", marginBottom: "1rem" }}>
                Businesses That Grew With Us
              </h2>
              <p style={{ fontSize: "1rem", color: "#6b7280", lineHeight: 1.7 }}>
                Concrete outcomes from real clients, not marketing copy.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <ScrollReveal key={t.name} delay={i * 100} direction="up" className="h-full">
                <div className="pro-card-v2 card-shine testimonial-card flex flex-col text-center h-full" style={{ padding: "2rem" }}>
                  <span className="quote-decoration" style={{ position: "relative", top: "auto", right: "auto", display: "block", marginBottom: "0.5rem" }}>&ldquo;</span>

                  <div style={{ display: "flex", gap: 3, marginBottom: "1.25rem", justifyContent: "center", position: "relative", zIndex: 1 }}>
                    {[1,2,3,4,5].map(j => <Star key={j} size={15} style={{ color: "#fbbf24", fill: "#fbbf24" }} />)}
                  </div>

                  <p style={{ fontSize: "0.9rem", color: "#374151", lineHeight: 1.8, marginBottom: "1.25rem", flex: 1, fontStyle: "italic", position: "relative", zIndex: 1 }}>
                    &ldquo;{t.text}&rdquo;
                  </p>

                  {/* Mini chart */}
                  <div style={{ marginBottom: "1.25rem" }}>
                    <AnimatedLineChart
                      data={t.chartData}
                      height={80}
                      color={t.accentText}
                      showGrid={false}
                      showAxis={false}
                      animationDuration={1200}
                      strokeWidth={2}
                    />
                  </div>

                  {/* Metrics strip */}
                  <div className="flex flex-wrap gap-2.5" style={{ marginBottom: "1.5rem" }}>
                    {t.metrics.map(m => (
                      <div key={m.l} className="flex-1 min-w-[80px]" style={{
                        background: t.accentBg,
                        border: `1px solid ${t.accentText}20`,
                        borderRadius: 10,
                        padding: "10px 12px",
                        textAlign: "center",
                      }}>
                        <p style={{ fontSize: "1.2rem", fontWeight: 800, color: t.accentText, letterSpacing: "-0.03em" }}>{m.v}</p>
                        <p style={{ fontSize: "0.7rem", color: "#6b7280", fontWeight: 600, marginTop: 2 }}>{m.l}</p>
                      </div>
                    ))}
                  </div>

                  {/* Author */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, paddingTop: "1.25rem", borderTop: "1px solid #f1f5f9" }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: "50%",
                      background: `linear-gradient(135deg, ${t.accentText}, ${t.accentText}80)`,
                      padding: 2, flexShrink: 0,
                    }}>
                      <div style={{
                        width: "100%", height: "100%", borderRadius: "50%",
                        background: t.accentBg,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <span style={{ fontSize: "0.82rem", fontWeight: 800, color: t.accentText }}>{t.initials}</span>
                      </div>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#111827" }}>{t.name}</p>
                      <p style={{ fontSize: "0.78rem", color: "#9ca3af" }}>{t.role}, {t.company} · {t.city}</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          INDUSTRIES STRIP — Animated pills
      ══════════════════════════════════════════════════ */}
      <section style={{ background: "#f8fafc", padding: "3rem 0", borderTop: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
        <ScrollReveal direction="up">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-center gap-3">
            <span style={{ fontSize: "0.8rem", color: "#9ca3af", fontWeight: 600, marginRight: 8, letterSpacing: "0.05em", textTransform: "uppercase" }}>Industries covered:</span>
            {[
              { icon: Utensils,      label: "Restaurants & Cafes", c: "#f97316" },
              { icon: Stethoscope,   label: "Clinics & Hospitals",  c: "#10b981" },
              { icon: BookOpen,      label: "Book Shops",            c: "#15757b" },
              { icon: GraduationCap, label: "Schools & Academies",   c: "#8b5cf6" },
              { icon: Dumbbell,      label: "Gyms & Fitness",        c: "#ef4444" },
            ].map(ind => (
              <div key={ind.label} className="industry-pill">
                <ind.icon size={15} className="industry-pill-icon" style={{ color: ind.c }} />
                {ind.label}
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ══════════════════════════════════════════════════
          CTA — Animated mesh gradient
      ══════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-20 lg:py-[7rem]" style={{ background: "#0a2f32", position: "relative", overflow: "hidden" }}>
        <div className="hero-grid" style={{ opacity: 0.5 }} />
        <div className="cta-mesh" />

        <div className="animate-float" style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: "rgba(21,117,123,0.08)", filter: "blur(60px)", top: "10%", left: "10%", animationDelay: "0s" }} />
        <div className="animate-float" style={{ position: "absolute", width: 160, height: 160, borderRadius: "50%", background: "rgba(74,158,162,0.06)", filter: "blur(50px)", bottom: "15%", right: "15%", animationDelay: "2s" }} />

        <ScrollReveal direction="up">
          <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <p className="section-label-dark flex items-center justify-center gap-2">
              <Zap size={12} /> Get Started Today
            </p>
            <h2 style={{ fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, letterSpacing: "-0.035em", color: "#f9fafb", marginBottom: "1.25rem", lineHeight: 1.1 }}>
              Ready to Modernise<br />Your Business?
            </h2>
            <p style={{ fontSize: "1.0625rem", color: "#94a3b8", marginBottom: "2.5rem", lineHeight: 1.75 }}>
              Book a free live demo tailored to your industry. See your exact workflows running in our system before committing.
            </p>

            <div className="flex flex-wrap justify-center gap-3.5 mb-8">
              <Link href="/demo" className="btn-primary" style={{ fontSize: "0.9375rem", padding: "14px 32px" }}>
                <Play size={14} fill="white" /> Request Free Demo
              </Link>
              <Link href="/contact" className="btn-secondary" style={{ fontSize: "0.9375rem", padding: "13px 32px" }}>
                <Phone size={14} /> Talk to an Expert
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-6" style={{ color: "#64748b", fontSize: "0.85rem" }}>
              {["Free setup","No contracts","Cancel anytime","24/7 support"].map(p => (
                <span key={p} className="flex items-center gap-1.5">
                  <CheckCircle size={13} style={{ color: "#22c55e" }} /> {p}
                </span>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </section>
    </>
  );
}
