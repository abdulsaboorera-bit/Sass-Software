import Link from "next/link";
import {
  Zap, Mail, Phone, MapPin,
  ArrowRight, Shield, CheckCircle, Globe, Share2, Link2, MessageCircle
} from "lucide-react";

const solutions = [
  { name: "Restaurant Management", href: "/solutions/restaurant" },
  { name: "Clinic Management", href: "/solutions/clinic" },
  { name: "Book Shop Management", href: "/solutions/bookshop" },
  { name: "School Management", href: "/solutions/school" },
];

const company = [
  { name: "About Us", href: "/about" },
  { name: "Why Choose Us", href: "/why-choose-us" },
  { name: "Case Studies", href: "/case-studies" },
  { name: "Blog", href: "/blog" },
  { name: "Careers", href: "/careers" },
];

const support = [
  { name: "Support Center", href: "/support" },
  { name: "FAQ", href: "/faq" },
  { name: "Request Demo", href: "/demo" },
  { name: "Contact Us", href: "/contact" },
  { name: "Pricing", href: "/pricing" },
];

const legal = [
  { name: "Privacy Policy", href: "/privacy-policy" },
  { name: "Terms & Conditions", href: "/terms" },
];

const socials = [
  { icon: Globe, href: "#", label: "Website" },
  { icon: Share2, href: "#", label: "Facebook" },
  { icon: Link2, href: "#", label: "LinkedIn" },
  { icon: MessageCircle, href: "#", label: "WhatsApp" },
];

const certifications = [
  "ISO 27001 Certified",
  "GDPR Compliant",
  "SSL Secured",
];

export default function Footer() {
  return (
    <footer className="bg-[#020617] border-t border-white/5">
      {/* Newsletter Banner */}
      <div className="bg-gradient-to-r from-blue-600/20 via-cyan-500/10 to-purple-600/20 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-white font-bold text-xl mb-1">
                Stay ahead with our newsletter
              </h3>
              <p className="text-slate-400 text-sm">
                Monthly insights on business automation, software tips, and industry news.
              </p>
            </div>
            <form className="flex gap-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-64 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                Subscribe <ArrowRight size={14} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                <Zap size={18} className="text-white" />
              </div>
              <span className="text-white font-bold text-xl tracking-tight">
                Orbitrix<span className="text-blue-400"> ERP</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-sm">
              Empowering businesses with custom-built management software.
              We specialize in restaurants, clinics, book shops, and schools
              — turning complexity into simplicity.
            </p>
            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              <a
                href="mailto:info@orbitrixerp.com"
                className="flex items-center gap-2.5 text-slate-400 hover:text-blue-400 transition-colors text-sm"
              >
                <Mail size={15} className="text-blue-400 flex-shrink-0" />
                info@orbitrixerp.com
              </a>
              <a
                href="tel:+923001234567"
                className="flex items-center gap-2.5 text-slate-400 hover:text-blue-400 transition-colors text-sm"
              >
                <Phone size={15} className="text-blue-400 flex-shrink-0" />
                +92 300 123 4567
              </a>
              <div className="flex items-start gap-2.5 text-slate-400 text-sm">
                <MapPin size={15} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <span>Office 12, Tech Tower, Blue Area,<br />Islamabad, Pakistan</span>
              </div>
            </div>
            {/* Socials */}
            <div className="flex items-center gap-2.5">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-500/20 hover:border-blue-500/30 transition-all"
                >
                  <s.icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Solutions */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Solutions</h4>
            <ul className="space-y-2.5">
              {solutions.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-slate-400 hover:text-blue-400 text-sm transition-colors flex items-center gap-1.5 group"
                  >
                    <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-2.5">
              {company.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-slate-400 hover:text-blue-400 text-sm transition-colors flex items-center gap-1.5 group"
                  >
                    <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Support</h4>
            <ul className="space-y-2.5">
              {support.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-slate-400 hover:text-blue-400 text-sm transition-colors flex items-center gap-1.5 group"
                  >
                    <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Certifications */}
            <div className="mt-8">
              <h4 className="text-white font-semibold text-sm mb-3">Certifications</h4>
              <div className="space-y-2">
                {certifications.map((cert) => (
                  <div key={cert} className="flex items-center gap-2">
                    <Shield size={13} className="text-green-400" />
                    <span className="text-slate-400 text-xs">{cert}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-500 text-xs">
            © {new Date().getFullYear()} Orbitrix ERP. All rights reserved. Built with passion in Pakistan.
          </p>
          <div className="flex items-center gap-4">
            {legal.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-slate-500 hover:text-slate-300 text-xs transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
