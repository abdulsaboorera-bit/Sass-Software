"use client";

import ScrollReveal from "@/components/animations/ScrollReveal";
import { Phone, Code, TestTube, Cloud, GraduationCap, Headphones } from "lucide-react";

const steps = [
  { icon: Phone, n: "01", title: "Discovery Call", desc: "We map your workflows, pain points, and goals in a free 30-minute call with a domain specialist.", color: "#3b82f6" },
  { icon: Code, n: "02", title: "Custom Build", desc: "Our engineers develop your system around your exact processes — nothing generic, nothing wasted.", color: "#8b5cf6" },
  { icon: TestTube, n: "03", title: "Test & Refine", desc: "Rigorous QA testing, then your team reviews and we refine until every detail is right.", color: "#10b981" },
  { icon: Cloud, n: "04", title: "Deploy to Cloud", desc: "Your system goes live on enterprise-grade infrastructure with zero downtime during migration.", color: "#f97316" },
  { icon: GraduationCap, n: "05", title: "Team Training", desc: "Live training sessions — on-site or remote — so every staff member is confident from day one.", color: "#06b6d4" },
  { icon: Headphones, n: "06", title: "Ongoing Support", desc: "Monthly updates, a dedicated account manager, and 24/7 expert support included in every plan.", color: "#ef4444" },
];

export default function SolutionsWorkflow() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {steps.map((s, i) => (
        <ScrollReveal key={s.n} delay={i * 100} direction="up">
          <div className="glass-card rounded-2xl p-6 text-center group h-full flex flex-col items-center hover:border-blue-500/20 transition-colors">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                style={{
                  background: `linear-gradient(135deg, ${s.color}, ${s.color}cc)`,
                  boxShadow: `0 4px 14px ${s.color}30`,
                }}
              >
                {s.n}
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                <s.icon size={20} className="text-slate-400" />
              </div>
            </div>
            <h3 className="text-white font-bold text-lg mb-2">{s.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed flex-1">{s.desc}</p>
          </div>
        </ScrollReveal>
      ))}
    </div>
  );
}
