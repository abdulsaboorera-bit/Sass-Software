import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Orbitrix ERP Terms and Conditions — service agreement, usage policy, and legal terms for using our management software.",
};

const sections = [
  {
    title: "1. Acceptance of Terms",
    content: "By accessing or using Orbitrix ERP services, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, you may not use our services. These terms apply to all clients, visitors, and users of Orbitrix ERP software and website.",
  },
  {
    title: "2. Services",
    content: "Orbitrix ERP provides custom business management software including Restaurant Management System, Clinic Management System, Book Shop Management System, and School Management System. Services are provided on a subscription basis and include software access, cloud hosting, updates, and technical support as defined in your service plan.",
  },
  {
    title: "3. Account Responsibilities",
    content: `You are responsible for:
    • Maintaining the confidentiality of your account credentials
    • All activities that occur under your account
    • Ensuring your team uses the software in accordance with these terms
    • Providing accurate and complete information during registration
    • Notifying us immediately of any unauthorized use of your account

    You must not share your login credentials or allow unauthorized parties to access your account.`,
  },
  {
    title: "4. Payment Terms",
    content: `Payment terms are defined in your service agreement. Generally:
    • Invoices are issued monthly or annually as per your plan
    • Payment is due within 15 days of invoice date
    • Late payments may result in service suspension after 30 days
    • Refunds are processed within 7–10 business days for eligible requests
    • Pricing may change with 30 days written notice

    We accept payment via bank transfer, JazzCash, EasyPaisa, and credit cards through our payment portal.`,
  },
  {
    title: "5. Acceptable Use Policy",
    content: `    You agree not to use Orbitrix ERP to:
    • Violate any applicable laws or regulations
    • Store or transmit illegal, harmful, or offensive content
    • Attempt to gain unauthorized access to other accounts or systems
    • Reverse engineer, decompile, or disassemble our software
    • Resell or sublicense access to Orbitrix ERP to third parties without written consent
    • Use automated tools to scrape, copy, or extract data from our systems

    Violation of this policy may result in immediate account termination.`,
  },
  {
    title: "6. Data Ownership",
    content: "You retain full ownership of all data you input into Orbitrix ERP. We do not claim any ownership over your business data. Upon account termination, you may export all your data in standard formats (Excel, CSV, PDF). We will retain your data for 90 days post-cancellation before permanent deletion.",
  },
  {
    title: "7. Service Level Agreement (SLA)",
    content: `We commit to:
    • 99.5% monthly uptime for all services
    • Advance notice of scheduled maintenance
    • Restoration of service within 4 hours of any unplanned outage
    • Data backup restoration within 24 hours if needed

    Enterprise clients receive a dedicated SLA with higher uptime guarantees and response time commitments.`,
  },
  {
    title: "8. Limitation of Liability",
    content: "Orbitrix ERP's liability is limited to the amount paid for services in the preceding 3 months. We are not liable for indirect, incidental, or consequential damages arising from use of our services. We are not responsible for third-party service interruptions (internet providers, payment gateways, etc.).",
  },
  {
    title: "9. Termination",
    content: "Either party may terminate the service agreement with 30 days written notice. We may terminate immediately for: non-payment, violation of acceptable use policy, or fraudulent activity. Upon termination, you will receive a 90-day window to export your data before deletion.",
  },
  {
    title: "10. Governing Law",
    content: "These terms are governed by the laws of the Islamic Republic of Pakistan. Any disputes will be resolved under the jurisdiction of the courts of Islamabad, Pakistan. We encourage resolving disputes amicably before legal proceedings.",
  },
  {
    title: "11. Changes to Terms",
    content: "We reserve the right to modify these terms at any time. We will notify clients via email at least 30 days before material changes take effect. Continued use of our services after the effective date constitutes acceptance of the updated terms.",
  },
  {
    title: "12. Contact",
    content: `For legal inquiries or questions about these terms:

    Email: legal@orbitrixerp.com
    Address: Office 12, Tech Tower, Blue Area, Islamabad, Pakistan
    Phone: +92 300 123 4567

    These Terms & Conditions were last updated on June 19, 2026.`,
  },
];

export default function TermsPage() {
  return (
    <>
      <section className="relative pt-28 pb-12 bg-[#0f172a] overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-40" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
          <div className="badge badge-blue mb-5">Legal</div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">Terms & Conditions</h1>
          <p className="text-slate-400">Last updated: June 19, 2026 • Effective: June 19, 2026</p>
        </div>
      </section>

      <section className="py-12 section-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-8">
            <p className="text-amber-700 text-sm leading-relaxed">
              <span className="font-semibold">Plain English Summary:</span> You own your data. Pay on time, don&apos;t misuse the software,
              and we&apos;ll provide the service as promised. Either party can cancel with 30 days notice.
              Questions? Email legal@orbitrixerp.com.
            </p>
          </div>

          <div className="space-y-6">
            {sections.map((section) => (
              <div key={section.title} className="bg-white rounded-2xl p-7 shadow-sm border border-slate-100">
                <h2 className="text-slate-900 font-bold text-xl mb-3">{section.title}</h2>
                <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{section.content}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
