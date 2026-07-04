import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin, Clock, Briefcase, Heart, Zap, Users, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "Careers at Orbitrix ERP",
  description: "Join Pakistan's fastest-growing business software company. Build products that transform thousands of businesses.",
};

const perks = [
  { icon: Heart, title: "Work You Believe In", desc: "Build software that actually changes lives — restaurant owners, doctors, teachers all use what you create." },
  { icon: TrendingUp, title: "Fast Career Growth", desc: "We're growing 40% year over year. There are no artificial ceilings — your impact determines your growth." },
  { icon: Zap, title: "Modern Tech Stack", desc: "Work with Next.js, TypeScript, Node.js, PostgreSQL, and AWS — not legacy systems." },
  { icon: Users, title: "Tight-Knit Team", desc: "Small, talented team where your voice is heard and your code ships directly to customers." },
];

const openings = [
  {
    title: "Full-Stack Software Engineer",
    type: "Full-time", location: "Islamabad (Hybrid)", dept: "Engineering",
    desc: "Build and maintain our core SaaS products using Next.js, Node.js, and PostgreSQL. 2+ years experience required.",
  },
  {
    title: "UI/UX Designer",
    type: "Full-time", location: "Remote", dept: "Design",
    desc: "Design beautiful, intuitive interfaces for our management software suite. Figma expertise required.",
  },
  {
    title: "Business Development Manager",
    type: "Full-time", location: "Lahore / Karachi", dept: "Sales",
    desc: "Drive new client acquisition across Pakistan. Experience in B2B SaaS or software sales preferred.",
  },
  {
    title: "Client Success Specialist",
    type: "Full-time", location: "Islamabad", dept: "Support",
    desc: "Onboard new clients, provide training, and ensure maximum value from Orbitrix ERP products.",
  },
  {
    title: "React Native Developer",
    type: "Contract", location: "Remote", dept: "Engineering",
    desc: "Build and maintain mobile apps for our business software suite. 1+ year React Native experience required.",
  },
];

export default function CareersPage() {
  return (
    <>
      <section className="relative pt-28 pb-16 bg-[#0f172a] overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-40" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="badge badge-blue mx-auto mb-5">We&apos;re Hiring</div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-[1.1]">
            Build the Future of{" "}
            <span className="gradient-text">Pakistani Business</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Join a team that&apos;s digitizing restaurants, clinics, schools, and shops across Pakistan.
            We&apos;re a small team with big ambitions — and we need talented people.
          </p>
        </div>
      </section>

      {/* Perks */}
      <section className="py-16 section-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Why Join Orbitrix ERP?</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
            {perks.map((p) => (
              <div key={p.title} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 card-hover">
                <div className="w-11 h-11 rounded-xl bg-blue-500/15 flex items-center justify-center mb-4">
                  <p.icon size={22} className="text-blue-400" />
                </div>
                <h3 className="text-slate-900 font-bold text-lg mb-2">{p.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>

          {/* Job listings */}
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Open Positions</h2>
            <div className="space-y-4">
              {openings.map((job) => (
                <div key={job.title} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 card-hover flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-slate-900 font-bold text-lg">{job.title}</h3>
                      <span className="badge badge-blue text-[10px]">{job.dept}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400 mb-3">
                      <span className="flex items-center gap-1"><Briefcase size={13} /> {job.type}</span>
                      <span className="flex items-center gap-1"><MapPin size={13} /> {job.location}</span>
                    </div>
                    <p className="text-slate-500 text-sm">{job.desc}</p>
                  </div>
                  <a
                    href="mailto:careers@orbitrixerp.com"
                    className="btn-primary text-sm py-2.5 px-5 whitespace-nowrap flex-shrink-0"
                  >
                    Apply Now <ArrowRight size={14} />
                  </a>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100">
              <p className="text-slate-600 text-sm">
                <span className="font-semibold text-blue-600">Don&apos;t see your role?</span>{" "}
                We&apos;re always interested in talented people. Send your CV to{" "}
                <a href="mailto:careers@orbitrixerp.com" className="text-blue-500 hover:underline">
                  careers@orbitrixerp.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
