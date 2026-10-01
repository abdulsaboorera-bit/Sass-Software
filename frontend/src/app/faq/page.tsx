"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, MessageCircle, ArrowRight } from "lucide-react";

const categories = [
  {
    name: "General",
    faqs: [
      { q: "What is Orbitrix ERP?", a: "Orbitrix ERP is a Pakistani software company that builds custom management systems for restaurants, clinics, book shops, and schools. We create tailored solutions, not one-size-fits-all software." },
      { q: "How is Orbitrix ERP different from generic SaaS tools?", a: "Unlike generic tools, every Orbitrix ERP system is built specifically for your business. You get software that matches your exact workflows, with local support and ongoing maintenance included." },
      { q: "How long does it take to go live?", a: "Most clients are fully live within 48–72 hours. Complex enterprise setups may take 1–2 weeks. We handle setup, data migration, and training." },
      { q: "Do I need technical knowledge to use the system?", a: "Not at all. Our systems are designed for everyday business users. If you can use WhatsApp, you can use Orbitrix ERP. We also provide training sessions." },
    ],
  },
  {
    name: "Pricing & Plans",
    faqs: [
      { q: "How much does it cost?", a: "Pricing depends on your industry, number of users, and required features. We offer affordable packages starting from Starter plans. Contact us for a custom quote." },
      { q: "Are there any hidden fees?", a: "Never. Our quotes are always all-inclusive: development, setup, training, and first 3 months of support. What we quote is what you pay." },
      { q: "Can I cancel my subscription?", a: "Yes, at any time. We believe in earning your loyalty with great service, not locking you in. You can export all your data when you leave." },
      { q: "Is there a free trial?", a: "Yes. We offer a 14-day free trial for most products. No credit card required to start." },
    ],
  },
  {
    name: "Technical",
    faqs: [
      { q: "Is the software cloud-based?", a: "Yes. All Orbitrix ERP systems are fully cloud-based, accessible from any browser on any device. No installation required." },
      { q: "What happens if the internet goes down?", a: "Our POS systems have offline mode and sync automatically when connectivity is restored. No data is ever lost." },
      { q: "How secure is my data?", a: "We use AES-256 encryption, daily automated backups, and host on AWS with 99.9% uptime SLA. Role-based access ensures only authorized staff can access sensitive data." },
      { q: "Can I integrate with other systems?", a: "Yes. We offer API integrations with payment gateways, accounting software, SMS services, and more. Custom integrations are available on Professional and Enterprise plans." },
    ],
  },
  {
    name: "Support",
    faqs: [
      { q: "What kind of support do you offer?", a: "All plans include email and WhatsApp support. Professional plans get priority support with 4-hour response SLA. Enterprise clients have dedicated account managers." },
      { q: "Do you provide staff training?", a: "Yes. Every plan includes staff training sessions. We do live training either in-person in Islamabad/Lahore/Karachi or remotely via video call." },
      { q: "What are your support hours?", a: "Email and WhatsApp support: Mon–Sat, 9 AM – 8 PM. Emergency technical support is available 24/7 for Enterprise clients." },
      { q: "How do I report a bug or request a feature?", a: "Through our support portal at support.orbitrixerp.com, via WhatsApp, or email. Feature requests are reviewed monthly and prioritized based on client demand." },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-slate-50 transition-colors"
      >
        <span className="text-slate-900 font-semibold text-sm pr-4">{q}</span>
        <ChevronDown size={18} className={`text-slate-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 bg-white">
          <p className="text-slate-600 text-sm leading-relaxed border-t border-slate-50 pt-4">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState("General");

  return (
    <>
      <section className="relative pt-28 pb-16 bg-[#0d3b3f] overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-40" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="badge badge-blue mx-auto mb-5">FAQ</div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-[1.1]">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Everything you need to know about Orbitrix ERP. Can&apos;t find your answer? Chat with us on WhatsApp.
          </p>
        </div>
      </section>

      <section className="py-16 section-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-2 mb-10">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeCategory === cat.name
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-blue-300"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {categories.filter(c => c.name === activeCategory).map((cat) => (
            <div key={cat.name} className="space-y-3">
              {cat.faqs.map((faq) => <FAQItem key={faq.q} {...faq} />)}
            </div>
          ))}

          <div className="mt-12 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-8 text-center text-white">
            <MessageCircle size={32} className="mx-auto mb-3 opacity-80" />
            <h3 className="font-bold text-xl mb-2">Still have questions?</h3>
            <p className="text-blue-100 text-sm mb-5">Our team is available Mon–Sat, 9AM–8PM via WhatsApp and email.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <a href="https://wa.me/923001234567" className="bg-white text-blue-700 font-bold px-6 py-3 rounded-xl text-sm hover:bg-blue-50 transition-all">
                Chat on WhatsApp
              </a>
              <Link href="/contact" className="border-2 border-white/30 text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-white/10 transition-all">
                Send Email
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
