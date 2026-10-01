"use client";

import Link from "next/link";
import { Utensils, Stethoscope, BookOpen, GraduationCap, ArrowRight, CheckCircle, Dumbbell, Shield, Zap, Headphones, Clock, TrendingUp, Users, BarChart3, Globe, Award, ChevronRight } from "lucide-react";
import SolutionsShowcase from "@/components/solutions/SolutionsShowcase";
import SolutionsWorkflow from "@/components/solutions/SolutionsWorkflow";
import SolutionsStats from "@/components/solutions/SolutionsStats";

const solutions = [
  {
    icon: Utensils, title: "Restaurant Management System",
    desc: "Complete POS, kitchen display, inventory, staff management, and analytics for restaurants, cafes, and food chains.",
    features: ["POS & Billing", "Kitchen Display", "Inventory Control", "Staff Scheduling", "Analytics"],
    href: "/solutions/restaurant",
    gradient: "from-orange-500 to-red-500",
    bg: "bg-orange-500/10", color: "text-orange-400",
    stat: "200+", statLabel: "Restaurants Live",
  },
  {
    icon: Stethoscope, title: "Clinic Management System",
    desc: "Digital EMR, appointment scheduling, prescriptions, billing, and doctor management for modern healthcare providers.",
    features: ["Patient Records (EMR)", "Appointments", "Prescriptions", "Billing", "Doctor Schedules"],
    href: "/solutions/clinic",
    gradient: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-500/10", color: "text-emerald-400",
    stat: "100+", statLabel: "Clinics Active",
  },
  {
    icon: BookOpen, title: "Book Shop Management System",
    desc: "Inventory management, barcode POS, sales analytics, supplier management, and customer loyalty for retail stores.",
    features: ["Inventory Tracking", "Barcode POS", "Sales Analytics", "Supplier Management", "Loyalty Program"],
    href: "/solutions/bookshop",
    gradient: "from-blue-500 to-indigo-500",
    bg: "bg-blue-500/10", color: "text-blue-400",
    stat: "75+", statLabel: "Shops Managing",
  },
  {
    icon: GraduationCap, title: "School Management System",
    desc: "Comprehensive ERP covering student records, attendance, fee management, exams, and a parent portal.",
    features: ["Student Records", "Attendance", "Fee Management", "Exams & Results", "Parent Portal"],
    href: "/solutions/school",
    gradient: "from-purple-500 to-pink-500",
    bg: "bg-purple-500/10", color: "text-purple-400",
    stat: "150+", statLabel: "Schools Trust Us",
  },
  {
    icon: Dumbbell, title: "Gym Management System",
    desc: "Complete fitness center management with member tracking, trainer scheduling, membership billing, and attendance.",
    features: ["Member Management", "Membership Plans", "Trainer Scheduling", "Attendance Tracking", "Revenue Reports"],
    href: "/solutions/gym",
    gradient: "from-red-500 to-orange-500",
    bg: "bg-red-500/10", color: "text-red-400",
    stat: "80+", statLabel: "Gyms Powered",
  },
];

const trustStats = [
  { value: "600+", label: "Businesses Live", icon: TrendingUp },
  { value: "98%", label: "Client Satisfaction", icon: Award },
  { value: "5", label: "Industry Solutions", icon: Globe },
  { value: "24/7", label: "Expert Support", icon: Headphones },
];

const whyUs = [
  { icon: Zap, title: "Live in 48 Hours", desc: "Most implementations go live within 2 days. No months of waiting." },
  { icon: Shield, title: "Bank-Grade Security", desc: "AES-256 encryption, role-based access, and automatic backups." },
  { icon: Clock, title: "24/7 Priority Support", desc: "Dedicated account manager and round-the-clock expert assistance." },
  { icon: Users, title: "500+ Happy Clients", desc: "Trusted by businesses across Pakistan from startups to enterprises." },
];

export default function SolutionsPage() {
  return (
    <>
      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <section className="relative pt-24 sm:pt-28 pb-14 sm:pb-20 bg-[#0d3b3f] overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="badge badge-blue mx-auto mb-5">Our Solutions</div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white mb-5 leading-[1.1]">
            Software Built for <span className="gradient-text">Your Industry</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
            Every Orbitrix ERP solution is purpose-built for its industry — not adapted from a generic template.
            Choose the software that matches how your business actually works.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {trustStats.map((s) => (
              <div key={s.label} className="glass rounded-xl p-4 text-center">
                <s.icon size={20} className="text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-black text-white mb-0.5">{s.value}</div>
                <div className="text-slate-400 text-xs">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SOLUTIONS CARDS — Kept on top for easy discovery
      ══════════════════════════════════════════════════ */}
      <section className="py-14 sm:py-20 bg-[#0d3b3f] relative">
        <div className="absolute inset-0 grid-pattern opacity-25" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <SolutionsShowcase solutions={solutions} />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          WHY NEXUSSOFT — Trust signals
      ══════════════════════════════════════════════════ */}
      <section className="py-20 bg-[#0a2f32] relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-15" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-blue-400 text-sm font-semibold tracking-wide uppercase mb-3">Why Orbitrix ERP</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Built Different. <span className="gradient-text">Delivered Faster.</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              We don&apos;t sell generic software. We build industry-specific systems and deliver them with white-glove service.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyUs.map((item, i) => (
              <SolutionsStats key={item.title} index={i} {...item} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          HOW IT WORKS — Visual workflow
      ══════════════════════════════════════════════════ */}
      <section className="py-20 bg-[#0d3b3f] relative overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-cyan-400 text-sm font-semibold tracking-wide uppercase mb-3">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              From Sign-Up to <span className="gradient-text">Go-Live</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              A streamlined process that gets your business running on Orbitrix ERP in days, not months.
            </p>
          </div>
          <SolutionsWorkflow />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FEATURE COMPARISON — What you get
      ══════════════════════════════════════════════════ */}
      <section className="py-20 bg-[#0a2f32] relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-15" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-purple-400 text-sm font-semibold tracking-wide uppercase mb-3">Every Solution Includes</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Enterprise Features. <span className="gradient-text">SMB Pricing.</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Globe, title: "Cloud-Based Access", desc: "Access from anywhere, any device. No installation required." },
              { icon: Shield, title: "Bank-Grade Security", desc: "AES-256 encryption, SOC 2 compliant, automatic daily backups." },
              { icon: BarChart3, title: "Real-Time Analytics", desc: "Live dashboards with actionable insights and custom reports." },
              { icon: Headphones, title: "24/7 Expert Support", desc: "Dedicated account manager plus round-the-clock technical help." },
              { icon: Zap, title: "API & Integrations", desc: "Connect with payment gateways, SMS providers, and accounting tools." },
              { icon: Clock, title: "Free Training & Setup", desc: "We handle data migration, setup, and train your entire team." },
            ].map((f, i) => (
              <div key={f.title} className="glass-card rounded-xl p-5 flex items-start gap-4 group hover:border-blue-500/20 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
                  <f.icon size={18} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm mb-1">{f.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CTA
      ══════════════════════════════════════════════════ */}
      <section className="py-16 bg-[#0a2f32] relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-blue-400 text-sm font-semibold tracking-wide uppercase mb-4">Need Guidance?</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Not Sure Which Solution Fits?</h2>
          <p className="text-slate-400 text-lg mb-8">Book a free consultation and our team will recommend the perfect solution for your business.</p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 mb-8">
            <Link href="/demo" className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-blue-700 transition-all text-base shadow-lg shadow-blue-600/20">
              Book Free Consultation <ArrowRight size={16} />
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-2 border border-white/10 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/5 transition-all text-base">
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
