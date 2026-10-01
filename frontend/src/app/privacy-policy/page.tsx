import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Orbitrix ERP privacy policy — how we collect, use, and protect your personal and business data.",
};

const sections = [
  {
    title: "1. Information We Collect",
    content: `We collect information you provide directly to us, such as when you create an account, request a demo, or contact support. This includes:

    • Personal information: name, email address, phone number
    • Business information: company name, industry, business size
    • Usage data: how you interact with our software (anonymized for analytics)
    • Technical data: IP address, browser type, device information

    We do not sell, rent, or trade your personal information to third parties.`,
  },
  {
    title: "2. How We Use Your Information",
    content: `We use collected information to:

    • Provide, maintain, and improve our software services
    • Process transactions and send related information
    • Send technical notices, updates, and support messages
    • Respond to your comments, questions, and requests
    • Send marketing communications (with your consent)
    • Monitor and analyze usage patterns to improve user experience
    • Detect and prevent fraudulent transactions or other illegal activities`,
  },
  {
    title: "3. Data Security",
    content: `We implement robust security measures to protect your information:

    • AES-256 encryption for data at rest and in transit
    • SSL/TLS for all communications
    • Automated daily backups stored on geographically distributed servers
    • Role-based access control — employees only access data necessary for their role
    • Regular security audits and penetration testing
    • ISO 27001 compliant information security management

    While we strive to protect your information, no security system is impenetrable. We will notify you promptly in the unlikely event of a data breach.`,
  },
  {
    title: "4. Data Retention",
    content: `We retain your data for as long as your account is active or as needed to provide services. If you cancel your account:

    • We retain your data for 90 days after cancellation to enable account recovery
    • After 90 days, all personal data is securely deleted
    • You can request immediate deletion of your data by emailing privacy@orbitrixerp.com
    • Backups are purged within 30 days of account deletion`,
  },
  {
    title: "5. Cookies",
    content: `We use cookies and similar tracking technologies to:

    • Keep you logged in to your account
    • Remember your preferences
    • Analyze website traffic (via Google Analytics, anonymized)
    • Improve website functionality

    You can control cookies through your browser settings. Disabling cookies may affect some website functionality.`,
  },
  {
    title: "6. Third-Party Services",
    content: `We use trusted third-party services to operate our platform:

    • AWS (Amazon Web Services) — cloud hosting and storage
    • Stripe / JazzCash / EasyPaisa — payment processing
    • Twilio — SMS notifications
    • Google Analytics — anonymous website analytics

    These providers have their own privacy policies and are contractually obligated to protect your data.`,
  },
  {
    title: "7. Your Rights",
    content: `You have the right to:

    • Access the personal data we hold about you
    • Correct inaccurate or incomplete data
    • Request deletion of your personal data
    • Object to processing of your personal data
    • Export your data in a portable format
    • Withdraw consent at any time

    To exercise these rights, email privacy@orbitrixerp.com. We will respond within 30 days.`,
  },
  {
    title: "8. Contact Us",
    content: `For privacy-related inquiries or to exercise your rights:

    Email: privacy@orbitrixerp.com
    Address: Office 12, Tech Tower, Blue Area, Islamabad, Pakistan
    Phone: +92 300 123 4567

    This Privacy Policy was last updated on June 19, 2026.`,
  },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <section className="relative pt-28 pb-12 bg-[#0d3b3f] overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-40" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
          <div className="badge badge-blue mb-5">Legal</div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">Privacy Policy</h1>
          <p className="text-slate-400">Last updated: June 19, 2026</p>
        </div>
      </section>

      <section className="py-12 section-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-8">
            <p className="text-blue-700 text-sm leading-relaxed">
              <span className="font-semibold">Summary:</span> We collect only the information needed to run your software.
              We never sell your data. You can request deletion at any time.
              All data is encrypted and hosted securely on AWS.
            </p>
          </div>

          <div className="space-y-8">
            {sections.map((section) => (
              <div key={section.title} className="bg-white rounded-2xl p-7 shadow-sm border border-slate-100">
                <h2 className="text-slate-900 font-bold text-xl mb-4">{section.title}</h2>
                <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{section.content}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
