import type { Metadata } from "next";
import Link from "next/link";
import { Stethoscope, CheckCircle, ArrowRight, Users, FileText, Calendar, CreditCard, BarChart3, Pill } from "lucide-react";

export const metadata: Metadata = {
  title: "Clinic Management System",
  description: "Digital patient records, appointment scheduling, prescriptions, billing, and reporting for clinics and hospitals.",
};

const modules = [
  {
    icon: Users, title: "Patient Records (EMR)",
    desc: "Complete electronic medical records with patient history, diagnoses, lab results, and attachments — all searchable in seconds.",
    features: ["Digital patient profiles", "Medical history & diagnoses", "Lab result uploads", "Document management", "Quick patient search"],
    color: "text-emerald-400", bg: "bg-emerald-500/15",
  },
  {
    icon: Calendar, title: "Appointment Management",
    desc: "Online and in-person booking system with automated SMS/email reminders, doctor-wise calendars, and rescheduling.",
    features: ["Online appointment booking", "Doctor-wise calendars", "SMS/email reminders", "Walk-in management", "No-show tracking"],
    color: "text-blue-400", bg: "bg-blue-500/15",
  },
  {
    icon: Pill, title: "Prescription Management",
    desc: "Digital prescription builder with medicine database, dosage guidance, and direct pharmacy integration.",
    features: ["Digital prescription builder", "Medicine database", "Dosage & frequency notes", "Print & share prescriptions", "Prescription history"],
    color: "text-purple-400", bg: "bg-purple-500/15",
  },
  {
    icon: CreditCard, title: "Billing & Invoicing",
    desc: "Automated billing for consultations, procedures, and lab tests with insurance claim support and payment tracking.",
    features: ["Auto-generate invoices", "Insurance claim support", "Multiple payment methods", "Outstanding balance tracking", "Payment receipts"],
    color: "text-orange-400", bg: "bg-orange-500/15",
  },
  {
    icon: FileText, title: "Doctor Schedules",
    desc: "Manage multiple doctors, departments, shift schedules, leave management, and clinic-wide availability.",
    features: ["Multi-doctor management", "Department scheduling", "Leave management", "Availability calendar", "Workload balancing"],
    color: "text-cyan-400", bg: "bg-cyan-500/15",
  },
  {
    icon: BarChart3, title: "Reports & Analytics",
    desc: "Revenue reports, patient visit trends, doctor performance, diagnosis frequency, and operational KPIs.",
    features: ["Revenue reports", "Patient visit trends", "Doctor performance", "Diagnosis analytics", "Export to Excel/PDF"],
    color: "text-pink-400", bg: "bg-pink-500/15",
  },
];

const benefits = [
  { stat: "70%", label: "Less Paperwork" },
  { stat: "50%", label: "Faster Check-in" },
  { stat: "90%", label: "Fewer Missed Appointments" },
  { stat: "35%", label: "Revenue Increase" },
];

const faqs = [
  { q: "Is patient data secure and private?", a: "Yes. All patient data is encrypted with AES-256 and stored on HIPAA-compliant servers. Role-based access ensures only authorized staff can view records." },
  { q: "Can it manage multiple branches?", a: "Absolutely. Manage all clinic branches from one central dashboard with consolidated reports and patient record sharing across branches." },
  { q: "Does it support telemedicine?", a: "Yes, the system includes a patient portal where patients can book online consultations and receive digital prescriptions." },
  { q: "Can we customize it for a hospital?", a: "Yes. We customize the system for hospitals with multi-department management, ward management, and inter-department referrals." },
  { q: "What about data backup?", a: "Data is automatically backed up every hour to secure cloud servers. You can also export your data at any time." },
];

export default function ClinicPage() {
  return (
    <>
      <section className="relative pt-24 sm:pt-28 pb-14 sm:pb-20 bg-[#0f172a] overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <div className="badge badge-green mb-5" style={{color:"#059669",background:"rgba(16,185,129,0.1)",borderColor:"rgba(16,185,129,0.2)"}}>
                <Stethoscope size={12} /> Healthcare Solution
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-[1.1] mb-5">
                Clinic{" "}
                <span className="text-white">
                  Management
                </span>{" "}
                System
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed mb-8 max-w-lg">
                Digitize your entire clinic operations — from patient registration to discharge.
                Paperless, efficient, and designed for Pakistan&apos;s healthcare providers.
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                <Link href="/demo" className="btn-primary">Request Demo <ArrowRight size={16} /></Link>
                <Link href="/pricing" className="btn-secondary">View Pricing</Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {benefits.map((b) => (
                  <div key={b.label} className="text-center glass rounded-xl p-3">
                    <div className="text-2xl font-black text-emerald-400 mb-0.5">{b.stat}</div>
                    <div className="text-slate-400 text-xs">{b.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 max-w-md">
              <div className="dashboard-mockup shadow-2xl">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/3">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                  </div>
                  <span className="text-slate-500 text-[11px] ml-2">Clinic Dashboard</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { l: "Today's Patients", v: "47", c: "text-emerald-400" },
                      { l: "Appointments", v: "32 Booked", c: "text-blue-400" },
                      { l: "Revenue", v: "₨124K", c: "text-green-400" },
                    ].map((s) => (
                      <div key={s.l} className="bg-white/5 rounded-lg p-2.5">
                        <p className="text-[10px] text-slate-500 mb-1">{s.l}</p>
                        <p className={`text-sm font-bold ${s.c}`}>{s.v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-[11px] text-slate-300 font-semibold mb-2">Today&apos;s Appointments</p>
                    {[
                      { n: "Ahmed Ali", d: "Dr. Fatima", t: "09:30 AM", s: "Waiting", c: "text-yellow-400" },
                      { n: "Sara Khan", d: "Dr. Usman", t: "10:00 AM", s: "In Room", c: "text-blue-400" },
                      { n: "M. Hassan", d: "Dr. Fatima", t: "10:30 AM", s: "Done", c: "text-green-400" },
                    ].map((a) => (
                      <div key={a.n} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                        <div>
                          <p className="text-[10px] text-white font-semibold">{a.n}</p>
                          <p className="text-[9px] text-slate-500">{a.d} • {a.t}</p>
                        </div>
                        <span className={`text-[9px] font-bold ${a.c}`}>{a.s}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5">
                    <p className="text-[10px] text-emerald-400 font-semibold">✓ 3 prescriptions digitally sent to pharmacy today</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20 lg:py-24 bg-[#0f172a] relative">
        <div className="absolute inset-0 grid-pattern opacity-25" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="badge badge-green mx-auto mb-4" style={{color:"#059669",background:"rgba(16,185,129,0.1)",borderColor:"rgba(16,185,129,0.2)"}}>Core Modules</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Complete Digital Healthcare <span className="text-white">Platform</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((mod) => (
              <div key={mod.title} className="glass-card rounded-2xl p-6 group">
                <div className={`w-11 h-11 rounded-xl ${mod.bg} flex items-center justify-center mb-4`}>
                  <mod.icon size={22} className={mod.color} />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{mod.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">{mod.desc}</p>
                <ul className="space-y-1.5">
                  {mod.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-slate-300 text-xs">
                      <CheckCircle size={11} className="text-green-400 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20 section-light">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-slate-900 font-semibold mb-2">{faq.q}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20 bg-[#030712] relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-blue-400 text-sm font-semibold tracking-wide uppercase mb-4">Get Started Today</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Go Paperless — Starting Today</h2>
          <p className="text-slate-400 text-lg mb-8">Join 100+ clinics that have transformed their operations with Orbitrix ERP.</p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 mb-8">
            <Link href="/demo" className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-bold px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl hover:bg-blue-700 transition-all text-sm sm:text-base shadow-lg shadow-blue-600/20">
              Request Free Demo <ArrowRight size={16} />
            </Link>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 border border-white/10 text-white font-semibold px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl hover:bg-white/5 transition-all text-sm sm:text-base">
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
