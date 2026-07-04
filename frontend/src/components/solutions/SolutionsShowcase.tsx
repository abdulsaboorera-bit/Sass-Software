"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle, LucideIcon } from "lucide-react";
import ScrollReveal from "@/components/animations/ScrollReveal";

interface Solution {
  icon: LucideIcon;
  title: string;
  desc: string;
  features: string[];
  href: string;
  gradient: string;
  bg: string;
  color: string;
  stat: string;
  statLabel: string;
}

export default function SolutionsShowcase({ solutions }: { solutions: Solution[] }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {solutions.map((sol, i) => (
        <ScrollReveal key={sol.title} delay={i * 80} direction="up">
          <div className="glass-card rounded-2xl overflow-hidden group h-full flex flex-col">
            <div className={`h-1.5 bg-gradient-to-r ${sol.gradient}`} />
            <div className="p-7 flex flex-col flex-1">
              <div className="flex items-start justify-between mb-5">
                <div className={`w-12 h-12 rounded-xl ${sol.bg} flex items-center justify-center`}>
                  <sol.icon size={24} className={sol.color} />
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-black ${sol.color}`}>{sol.stat}</div>
                  <div className="text-slate-500 text-[10px] uppercase tracking-wide">{sol.statLabel}</div>
                </div>
              </div>
              <h2 className="text-white font-extrabold text-xl mb-3">{sol.title}</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-5 flex-1">{sol.desc}</p>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {sol.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-slate-300 text-xs">
                    <CheckCircle size={12} className="text-green-400 flex-shrink-0" /> {f}
                  </div>
                ))}
              </div>
              <Link
                href={sol.href}
                className={`inline-flex items-center gap-2 font-semibold text-sm transition-all ${sol.color} hover:gap-3 group-hover:translate-x-1`}
              >
                Explore Full Solution <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </ScrollReveal>
      ))}
    </div>
  );
}
