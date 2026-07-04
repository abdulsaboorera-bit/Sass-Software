"use client";

import { useState } from "react";
import { CheckCircle, ArrowRight, Play, Star, Clock, Users } from "lucide-react";

export default function DemoPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", company: "", industry: "", size: "", message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const field = (label: string, key: keyof typeof form, type = "text", placeholder = "") => (
    <div>
      <label className="block text-slate-700 text-sm font-medium mb-1.5">{label} *</label>
      <input
        required
        type={type}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      />
    </div>
  );

  return (
    <>
      <section className="relative pt-28 pb-10 bg-[#0f172a] overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-40" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="badge badge-blue mx-auto mb-5">
            <Play size={12} fill="currentColor" /> Request a Demo
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-[1.1]">
            See Orbitrix ERP in <span className="gradient-text">Action</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Book a free 30-minute live demo tailored to your industry.
            Our team will show you exactly how the system works for your business.
          </p>
        </div>
      </section>

      <section className="py-16 section-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-5 gap-10">
            {/* What to expect */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-5">What to Expect</h2>
                <div className="space-y-4">
                  {[
                    { icon: Clock, title: "30-Minute Session", desc: "A focused, no-fluff demo of your specific solution." },
                    { icon: Users, title: "Industry Expert", desc: "A specialist in your industry walks you through the system." },
                    { icon: Play, title: "Live System Tour", desc: "See real data, real workflows — not a sales slideshow." },
                    { icon: CheckCircle, title: "Q&A Session", desc: "Ask everything you want. No pressure to commit." },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                        <item.icon size={18} className="text-blue-400" />
                      </div>
                      <div>
                        <p className="text-slate-900 font-semibold text-sm">{item.title}</p>
                        <p className="text-slate-500 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Testimonial */}
              <div className="bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl p-6 text-white">
                <div className="flex gap-0.5 mb-3">
                  {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="white" className="text-white" />)}
                </div>
                <p className="text-white/90 text-sm leading-relaxed italic mb-4">
                  &ldquo;The demo was incredible. In 30 minutes I understood exactly how the system would work for my restaurant. We signed up the same day.&rdquo;
                </p>
                <p className="text-white/70 text-xs font-semibold">— Asad Khan, Khan&apos;s Restaurant, Lahore</p>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <p className="text-slate-500 text-sm mb-3">Or reach us directly:</p>
                <a href="https://wa.me/923001234567" className="flex items-center gap-2 text-green-600 font-semibold text-sm hover:text-green-700">
                  <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">💬</span>
                  WhatsApp: +92 300 123 4567
                </a>
              </div>
            </div>

            {/* Demo form */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                {submitted ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                      <CheckCircle size={32} className="text-green-500" />
                    </div>
                    <h3 className="text-slate-900 font-bold text-2xl mb-2">Demo Request Received!</h3>
                    <p className="text-slate-500 max-w-sm mb-2">
                      Our team will call you within 2 hours to confirm your demo time.
                    </p>
                    <p className="text-slate-400 text-sm">Check your email for a calendar invite.</p>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Book Your Free Demo</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        {field("Your Full Name", "name", "text", "Ahmed Khan")}
                        {field("Work Email", "email", "email", "ahmed@business.com")}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {field("Phone Number", "phone", "tel", "+92 300 000 0000")}
                        {field("Business Name", "company", "text", "Your Business Name")}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-700 text-sm font-medium mb-1.5">Industry *</label>
                          <select
                            required
                            value={form.industry}
                            onChange={(e) => setForm({ ...form, industry: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all"
                          >
                            <option value="">Select Industry</option>
                            <option>Restaurant / Cafe / Food Chain</option>
                            <option>Clinic / Hospital / Lab</option>
                            <option>Book Shop / Stationery</option>
                            <option>School / Academy / College</option>
                            <option>Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-700 text-sm font-medium mb-1.5">Business Size *</label>
                          <select
                            required
                            value={form.size}
                            onChange={(e) => setForm({ ...form, size: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all"
                          >
                            <option value="">Select size</option>
                            <option>1–5 employees</option>
                            <option>6–20 employees</option>
                            <option>21–50 employees</option>
                            <option>50+ employees</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-slate-700 text-sm font-medium mb-1.5">What are your main challenges? (optional)</label>
                        <textarea
                          rows={3}
                          value={form.message}
                          onChange={(e) => setForm({ ...form, message: e.target.value })}
                          placeholder="e.g. We struggle with inventory tracking and daily reporting..."
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                        />
                      </div>
                      <button type="submit" className="btn-primary w-full justify-center text-base py-4">
                        Book My Free Demo <ArrowRight size={16} />
                      </button>
                      <p className="text-slate-400 text-xs text-center">
                        No commitment required. 100% free. We&apos;ll confirm via call or WhatsApp.
                      </p>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
