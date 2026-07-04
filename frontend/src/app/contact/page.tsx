"use client";

import { useState } from "react";
import ScrollReveal from "@/components/animations/ScrollReveal";
import Link from "next/link";
import {
  Mail, Phone, MapPin, MessageCircle,
  Send, CheckCircle, ArrowRight, Clock,
  Shield, Zap, Headphones, Globe,
  Building2, Users, Calendar, Star,
  ChevronDown
} from "lucide-react";

const contactMethods = [
  {
    icon: Phone,
    title: "Call Us Directly",
    value: "+92 300 123 4567",
    sub: "Mon–Sat, 9 AM – 8 PM PKT",
    href: "tel:+923001234567",
    description: "Speak with our sales team instantly. No wait times, no automated menus — just real people ready to help.",
  },
  {
    icon: Mail,
    title: "Email Us",
    value: "info@orbitrixerp.com",
    sub: "We reply within 2 hours",
    href: "mailto:info@orbitrixerp.com",
    description: "Perfect for detailed inquiries, partnership proposals, or when you need a written record of our conversation.",
  },
  {
    icon: MapPin,
    title: "Visit Our Office",
    value: "14 Gulberg III, Lahore",
    sub: "Punjab, Pakistan 54660",
    href: "https://maps.google.com/?q=Gulberg+III+Lahore",
    description: "Walk in for a demo, meet our team face-to-face, or discuss your project over coffee at our Lahore headquarters.",
  },
];

const offices = [
  {
    city: "Lahore",
    address: "14-G, 2nd Floor, Main Boulevard, Gulberg III",
    phone: "+92 300 123 4567",
    email: "lahore@orbitrixerp.com",
    hours: "Mon–Sat: 9 AM – 8 PM",
    isHQ: true,
    coords: { lat: 31.5209, lng: 74.3422 },
  },
  {
    city: "Karachi",
    address: "Suite 401, Plot 12, Shahrah-e-Faisal, PECHS",
    phone: "+92 21 3456 7890",
    email: "karachi@orbitrixerp.com",
    hours: "Mon–Sat: 9 AM – 7 PM",
    isHQ: false,
    coords: { lat: 24.8607, lng: 67.0011 },
  },
];

const whyChooseUs = [
  {
    icon: Zap,
    title: "2-Hour Response",
    desc: "We guarantee a response within 2 business hours. Most inquiries get answered in under 30 minutes.",
  },
  {
    icon: Shield,
    title: "Your Data Stays Private",
    desc: "All communication is encrypted end-to-end. We never share your information with third parties.",
  },
  {
    icon: Headphones,
    title: "Free Consultation",
    desc: "Every inquiry includes a complimentary 30-minute consultation with an industry specialist.",
  },
  {
    icon: Users,
    title: "Expert Team",
    desc: "Our team includes engineers, designers, and industry consultants with 10+ years of experience each.",
  },
];

const faqs = [
  {
    q: "How quickly can we get started?",
    a: "Most projects begin within 48 hours of our first conversation. We'll schedule a discovery call, map your requirements, and start development immediately after approval.",
  },
  {
    q: "Do you offer free demos?",
    a: "Yes! Every potential client gets a free, personalized demo of their chosen solution. We'll set up a live walkthrough tailored to your specific industry and workflow.",
  },
  {
    q: "What if I'm not sure which solution I need?",
    a: "No problem. Our sales team will discuss your business needs and recommend the best solution. If you need something custom, we'll design it from scratch.",
  },
  {
    q: "Can you handle large-scale enterprise deployments?",
    a: "Absolutely. We serve businesses from 5-person startups to 500+ employee enterprises. Our infrastructure scales automatically to handle any volume.",
  },
  {
    q: "What support do you provide after purchase?",
    a: "All plans include 24/7 technical support, a dedicated account manager, monthly updates, and priority bug fixes. Enterprise clients get on-site support as well.",
  },
];

const trustStats = [
  { value: "600+", label: "Businesses Served" },
  { value: "< 2hr", label: "Average Response" },
  { value: "98%", label: "Client Satisfaction" },
  { value: "5", label: "Industry Solutions" },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", company: "", subject: "", message: "", budget: "",
  });
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <section className="relative pt-24 sm:pt-28 pb-14 sm:pb-20 bg-[#0f172a] overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <ScrollReveal direction="up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs font-semibold tracking-wide uppercase">Online Now — We Reply Fast</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white mb-5 leading-[1.1]">
              Let&apos;s Build Something<br className="hidden sm:block" /> Great Together
            </h1>
            <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto mb-8">
              Whether you need a demo, a custom solution, or just have questions — our team is ready.
              Expect a human response within 2 hours on business days.
            </p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-10">
              {whyChooseUs.map(p => (
                <span key={p.title} className="flex items-center gap-2 text-slate-400 text-sm">
                  <p.icon size={14} className="text-blue-400" /> {p.title}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {trustStats.map(s => (
                <div key={s.label} className="glass rounded-xl p-3 text-center">
                  <div className="text-xl sm:text-2xl font-black text-white">{s.value}</div>
                  <div className="text-slate-400 text-xs mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CONTACT METHODS — 3 cards
      ══════════════════════════════════════════════════ */}
      <section className="py-14 sm:py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern-light opacity-40" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <ScrollReveal direction="up">
            <div className="text-center mb-12">
              <p className="text-blue-600 text-sm font-semibold tracking-wide uppercase mb-3">Get in Touch</p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 mb-3">
                Choose How You&apos;d Like to Reach Us
              </h2>
              <p className="text-slate-500 max-w-xl mx-auto">
                Pick the channel that works best for you. Every option gets the same fast, expert response.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {contactMethods.map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 100} direction="up">
                <a
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="block bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 transition-all duration-300 hover:border-slate-300 hover:shadow-lg hover:-translate-y-1 group no-underline h-full"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-5 group-hover:bg-blue-100 transition-colors">
                    <item.icon size={22} className="text-blue-600" />
                  </div>
                  <h3 className="text-slate-900 font-bold text-lg mb-1">{item.title}</h3>
                  <p className="text-blue-600 font-semibold text-sm mb-1">{item.value}</p>
                  <p className="text-slate-400 text-xs mb-3">{item.sub}</p>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.description}</p>
                  <div className="inline-flex items-center gap-1.5 text-blue-600 text-sm font-semibold mt-4 group-hover:gap-2.5 transition-all">
                    {item.href.startsWith("http") ? "Open in Maps" : item.title === "Call Us Directly" ? "Call Now" : "Send Email"} <ArrowRight size={13} />
                  </div>
                </a>
              </ScrollReveal>
            ))}
          </div>

          {/* WhatsApp CTA */}
          <ScrollReveal direction="up" delay={300}>
            <div className="mt-8 text-center">
              <a
                href="https://wa.me/923001234567?text=Hi%20Orbitrix%20ERP%2C%20I%27d%20like%20to%20know%20more%20about%20your%20software."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3 bg-[#25D366] hover:bg-[#20bc5a] text-white font-bold rounded-xl transition-all text-sm hover:shadow-lg hover:-translate-y-0.5 no-underline"
              >
                <MessageCircle size={17} fill="white" />
                Chat on WhatsApp — Instant Replies
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FORM + OFFICES — Side by side
      ══════════════════════════════════════════════════ */}
      <section className="py-14 sm:py-20 bg-[#f8fafc] relative overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-20" style={{ backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">

            {/* ── Left: Contact Form ── */}
            <div className="lg:col-span-3">
              <ScrollReveal direction="left">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 lg:p-10 shadow-sm">
                  {submitted ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-5">
                        <CheckCircle size={32} className="text-green-500" />
                      </div>
                      <h3 className="text-slate-900 font-bold text-2xl mb-2">Message Sent Successfully!</h3>
                      <p className="text-slate-500 text-sm max-w-sm mb-2">
                        Our team will review your inquiry and get back to you within 2 business hours.
                      </p>
                      <p className="text-slate-400 text-xs mb-6">
                        Check your email for a confirmation with your ticket number.
                      </p>
                      <button
                        onClick={() => setSubmitted(false)}
                        className="text-blue-600 text-sm font-semibold hover:text-blue-700 transition-colors"
                      >
                        Send another message
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="mb-8">
                        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2">Send Us a Message</h2>
                        <p className="text-slate-500 text-sm">
                          Fill out the form below and we&apos;ll get back to you promptly. Fields marked with * are required.
                        </p>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Row 1 */}
                        <div className="grid sm:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-slate-700 text-xs font-bold mb-2 uppercase tracking-wide">Full Name *</label>
                            <input
                              required
                              type="text"
                              value={form.name}
                              onChange={e => setForm({ ...form, name: e.target.value })}
                              placeholder="Ahmed Khan"
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-700 text-xs font-bold mb-2 uppercase tracking-wide">Email Address *</label>
                            <input
                              required
                              type="email"
                              value={form.email}
                              onChange={e => setForm({ ...form, email: e.target.value })}
                              placeholder="ahmed@business.com"
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                          </div>
                        </div>

                        {/* Row 2 */}
                        <div className="grid sm:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-slate-700 text-xs font-bold mb-2 uppercase tracking-wide">Phone Number</label>
                            <input
                              type="tel"
                              value={form.phone}
                              onChange={e => setForm({ ...form, phone: e.target.value })}
                              placeholder="+92 300 000 0000"
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-700 text-xs font-bold mb-2 uppercase tracking-wide">Company Name</label>
                            <input
                              type="text"
                              value={form.company}
                              onChange={e => setForm({ ...form, company: e.target.value })}
                              placeholder="Your business name"
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                          </div>
                        </div>

                        {/* Row 3 */}
                        <div className="grid sm:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-slate-700 text-xs font-bold mb-2 uppercase tracking-wide">I&apos;m Interested In *</label>
                            <select
                              required
                              value={form.subject}
                              onChange={e => setForm({ ...form, subject: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-all"
                            >
                              <option value="">Select a product</option>
                              <option>Restaurant Management System</option>
                              <option>Clinic Management System</option>
                              <option>Book Shop Management System</option>
                              <option>School Management System</option>
                              <option>Gym Management System</option>
                              <option>Custom Software Development</option>
                              <option>General Inquiry</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-700 text-xs font-bold mb-2 uppercase tracking-wide">Estimated Budget</label>
                            <select
                              value={form.budget}
                              onChange={e => setForm({ ...form, budget: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-all"
                            >
                              <option value="">Select range</option>
                              <option>Under PKR 100,000</option>
                              <option>PKR 100,000 – 300,000</option>
                              <option>PKR 300,000 – 700,000</option>
                              <option>PKR 700,000 – 1,500,000</option>
                              <option>PKR 1,500,000+</option>
                            </select>
                          </div>
                        </div>

                        {/* Row 4 */}
                        <div>
                          <label className="block text-slate-700 text-xs font-bold mb-2 uppercase tracking-wide">Your Message *</label>
                          <textarea
                            required
                            rows={5}
                            value={form.message}
                            onChange={e => setForm({ ...form, message: e.target.value })}
                            placeholder="Tell us about your business, team size, current challenges, and what you're looking for..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                          />
                        </div>

                        <button type="submit" className="btn-primary w-full justify-center py-3.5 text-[0.9375rem]">
                          Send Message <Send size={15} />
                        </button>

                        <p className="text-slate-400 text-xs text-center">
                          By submitting, you agree to our <Link href="/privacy" className="text-blue-500 hover:text-blue-600">Privacy Policy</Link>. We&apos;ll respond within 2 hours.
                        </p>
                      </form>
                    </>
                  )}
                </div>
              </ScrollReveal>
            </div>

            {/* ── Right: Office Locations ── */}
            <div className="lg:col-span-2 space-y-6">
              <ScrollReveal direction="right">
                <h2 className="text-lg font-bold text-slate-900 mb-1">Our Offices</h2>
                <p className="text-slate-500 text-sm mb-6">Drop by for a demo or a coffee chat.</p>

                <div className="space-y-4">
                  {offices.map((office) => (
                    <div
                      key={office.city}
                      className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Building2 size={16} className="text-blue-600" />
                            <h3 className="text-slate-900 font-bold text-base">{office.city}</h3>
                          </div>
                          {office.isHQ && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                              Headquarters
                            </span>
                          )}
                        </div>
                        <a
                          href={`https://www.google.com/maps?q=${office.coords.lat},${office.coords.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <MapPin size={16} />
                        </a>
                      </div>
                      <p className="text-slate-600 text-sm mb-2">{office.address}</p>
                      <div className="space-y-1">
                        <p className="text-slate-500 text-xs flex items-center gap-1.5">
                          <Phone size={11} /> {office.phone}
                        </p>
                        <p className="text-slate-500 text-xs flex items-center gap-1.5">
                          <Mail size={11} /> {office.email}
                        </p>
                        <p className="text-slate-500 text-xs flex items-center gap-1.5">
                          <Clock size={11} /> {office.hours}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollReveal>

              {/* Quick Links */}
              <ScrollReveal direction="right" delay={100}>
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <h3 className="text-slate-900 font-bold text-sm mb-3">Quick Links</h3>
                  <div className="space-y-2">
                    {[
                      { label: "Book a Free Demo", href: "/demo", icon: Calendar },
                      { label: "View All Solutions", href: "/solutions", icon: Globe },
                      { label: "Read Our Blog", href: "/blog", icon: Star },
                    ].map(link => (
                      <Link
                        key={link.label}
                        href={link.href}
                        className="flex items-center gap-2.5 text-slate-600 hover:text-blue-600 text-sm font-medium transition-colors no-underline py-1"
                      >
                        <link.icon size={14} className="text-slate-400" />
                        {link.label}
                        <ArrowRight size={12} className="ml-auto text-slate-300" />
                      </Link>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              {/* Response Promise */}
              <ScrollReveal direction="right" delay={200}>
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-blue-200" />
                    <h3 className="font-bold text-sm">Our Response Promise</h3>
                  </div>
                  <p className="text-blue-100 text-sm leading-relaxed">
                    We guarantee a response within <strong className="text-white">2 business hours</strong>. If you don&apos;t hear from us, email{' '}
                    <a href="mailto:urgent@orbitrixerp.com" className="text-white underline">urgent@orbitrixerp.com</a> and we&apos;ll prioritize your inquiry immediately.
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FULL-WIDTH MAP — Lahore
      ══════════════════════════════════════════════════ */}
      <section className="relative">
        <div className="w-full h-[350px] sm:h-[420px] lg:h-[480px]">
          <iframe
            title="Orbitrix ERP Office — Lahore, Pakistan"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3401.2782988827413!2d74.34219977624374!3d31.520938948108817!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x391904e3a0000001%3A0x4e98a07cce62e40e!2sGulberg%20III%2C%20Lahore%2C%20Punjab%2C%20Pakistan!5e0!3m2!1sen!2s!4v1718780000000!5m2!1sen!2s"
            width="100%"
            height="100%"
            style={{ border: 0, display: "block" }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        {/* Map overlay info bar */}
        <div className="bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <MapPin size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-slate-900 font-bold text-sm">Orbitrix ERP Headquarters</p>
                  <p className="text-slate-500 text-xs">14-G, 2nd Floor, Main Boulevard, Gulberg III, Lahore 54660</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href="https://www.google.com/maps/dir/?api=1&destination=Gulberg+III+Lahore"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors no-underline"
                >
                  Get Directions <ArrowRight size={12} />
                </a>
                <a
                  href="tel:+923001234567"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors no-underline"
                >
                  <Phone size={12} /> Call Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FAQ SECTION
      ══════════════════════════════════════════════════ */}
      <section className="py-14 sm:py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern-light opacity-30" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6">
          <ScrollReveal direction="up">
            <div className="text-center mb-10">
              <p className="text-blue-600 text-sm font-semibold tracking-wide uppercase mb-3">FAQ</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
                Common Questions
              </h2>
              <p className="text-slate-500 text-sm">
                Can&apos;t find what you&apos;re looking for? <Link href="/contact" className="text-blue-600 font-semibold hover:text-blue-700">Contact us directly</Link>.
              </p>
            </div>
          </ScrollReveal>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <ScrollReveal key={i} delay={i * 80} direction="up">
                <div className="border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-colors">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <span className="text-slate-900 font-semibold text-sm">{faq.q}</span>
                    <ChevronDown
                      size={16}
                      className="text-slate-400 shrink-0 transition-transform duration-200"
                      style={{ transform: openFaq === i ? "rotate(180deg)" : "none" }}
                    />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4">
                      <p className="text-slate-500 text-sm leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CTA
      ══════════════════════════════════════════════════ */}
      <section className="py-14 sm:py-20 bg-[#030712] relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <ScrollReveal direction="up">
            <p className="text-blue-400 text-sm font-semibold tracking-wide uppercase mb-4">Ready to Start?</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-4">
              Let&apos;s Turn Your Idea Into Reality
            </h2>
            <p className="text-slate-400 text-base sm:text-lg mb-8 max-w-xl mx-auto">
              Book a free 30-minute consultation. No commitment, no sales pressure — just expert advice tailored to your business.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 mb-8">
              <Link href="/demo" className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-blue-700 transition-all text-base shadow-lg shadow-blue-600/20 no-underline">
                Book Free Consultation <ArrowRight size={16} />
              </Link>
              <a href="tel:+923001234567" className="inline-flex items-center gap-2 border border-white/10 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/5 transition-all text-base no-underline">
                <Phone size={16} /> Call Now
              </a>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-slate-500 text-sm">
              {["Free setup", "No contracts", "Cancel anytime", "24/7 support"].map(p => (
                <span key={p} className="flex items-center gap-1.5">
                  <CheckCircle size={13} className="text-green-500" /> {p}
                </span>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
