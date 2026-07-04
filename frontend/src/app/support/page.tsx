import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, Mail, Phone, BookOpen, Video, FileText, Clock, CheckCircle, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Support Center",
  description: "Get help with Orbitrix ERP software. Access guides, video tutorials, and connect with our Pakistan-based support team.",
};

const channels = [
  {
    icon: MessageCircle, title: "WhatsApp Support",
    desc: "Fastest response. Chat with our support team directly.",
    action: "Chat Now", href: "https://wa.me/923001234567",
    color: "bg-green-500", textColor: "text-white", hoverColor: "hover:bg-green-600",
    badge: "Fastest",
  },
  {
    icon: Phone, title: "Call Support",
    desc: "Mon–Sat, 9AM–8PM. Speak directly with a specialist.",
    action: "+92 300 123 4567", href: "tel:+923001234567",
    color: "bg-blue-500", textColor: "text-white", hoverColor: "hover:bg-blue-600",
    badge: "Real-time",
  },
  {
    icon: Mail, title: "Email Support",
    desc: "Detailed issues and attachments. Response within 2 hours.",
    action: "support@orbitrixerp.com", href: "mailto:support@orbitrixerp.com",
    color: "bg-purple-500", textColor: "text-white", hoverColor: "hover:bg-purple-600",
    badge: "Detailed",
  },
];

const articles = [
  { icon: Video, title: "Getting Started with Orbitrix ERP", desc: "Watch our 10-minute walkthrough to set up your account and configure your first module.", category: "Video Tutorial" },
  { icon: FileText, title: "How to Add Users & Manage Roles", desc: "Step-by-step guide to inviting your team and setting the right permissions for each member.", category: "Guide" },
  { icon: FileText, title: "Setting Up Your Product/Service Catalog", desc: "Learn how to add your menu, services, or inventory to the system in minutes.", category: "Guide" },
  { icon: Video, title: "Running Your First Daily Report", desc: "See how to generate, interpret, and export your daily business summary reports.", category: "Video Tutorial" },
  { icon: FileText, title: "Configuring SMS Notifications", desc: "Set up automated SMS alerts for appointments, orders, and low-stock warnings.", category: "Guide" },
  { icon: FileText, title: "Exporting Data to Excel/PDF", desc: "How to export any report, customer list, or inventory data from Orbitrix ERP.", category: "Guide" },
];

export default function SupportPage() {
  return (
    <>
      <section className="relative pt-28 pb-16 bg-[#0f172a] overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-40" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="badge badge-blue mx-auto mb-5">Support Center</div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-[1.1]">
            We&apos;re Here to <span className="gradient-text">Help You</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Pakistan-based support team available 6 days a week. Get help via
            WhatsApp, phone, or email — however you prefer.
          </p>
        </div>
      </section>

      {/* Support channels */}
      <section className="py-16 section-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-3 gap-5 mb-16">
            {channels.map((ch) => (
              <div key={ch.title} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center card-hover">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className={`w-12 h-12 rounded-xl ${ch.color} flex items-center justify-center`}>
                    <ch.icon size={24} className="text-white" />
                  </div>
                  <span className="badge badge-blue text-[10px]">{ch.badge}</span>
                </div>
                <h3 className="text-slate-900 font-bold text-lg mb-2">{ch.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-5">{ch.desc}</p>
                <a
                  href={ch.href}
                  className={`inline-flex items-center gap-2 ${ch.color} ${ch.textColor} ${ch.hoverColor} font-semibold px-5 py-2.5 rounded-xl text-sm transition-all`}
                >
                  {ch.action}
                </a>
              </div>
            ))}
          </div>

          {/* Support hours */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-12 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
              <Clock size={24} className="text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-slate-900 font-bold text-lg mb-1">Support Hours</h3>
              <div className="grid sm:grid-cols-3 gap-4 text-sm">
                {[
                  { label: "WhatsApp & Phone", hours: "Mon–Sat, 9 AM – 8 PM" },
                  { label: "Email Support", hours: "Mon–Sat, 9 AM – 6 PM" },
                  { label: "Emergency (Enterprise)", hours: "24/7, 365 days" },
                ].map((h) => (
                  <div key={h.label}>
                    <p className="text-slate-500 text-xs mb-0.5">{h.label}</p>
                    <p className="text-slate-900 font-semibold">{h.hours}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Help articles */}
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Popular Help Articles</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {articles.map((a) => (
                <div key={a.title} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 card-hover">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                      <a.icon size={16} className="text-blue-400" />
                    </div>
                    <span className="text-xs text-slate-400 font-medium">{a.category}</span>
                  </div>
                  <h3 className="text-slate-900 font-semibold text-sm mb-2 leading-snug">{a.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{a.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link href="/faq" className="inline-flex items-center gap-2 text-blue-500 font-semibold hover:text-blue-600">
              View All FAQ <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
