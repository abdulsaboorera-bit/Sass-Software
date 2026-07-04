"use client";

import { LucideIcon } from "lucide-react";
import ScrollReveal from "@/components/animations/ScrollReveal";

interface Props {
  icon: LucideIcon;
  title: string;
  desc: string;
  index: number;
}

export default function SolutionsStats({ icon: Icon, title, desc, index }: Props) {
  return (
    <ScrollReveal delay={index * 100} direction="up">
      <div className="glass-card rounded-xl p-6 text-center group hover:border-blue-500/20 transition-colors h-full flex flex-col items-center">
        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
          <Icon size={22} className="text-blue-400" />
        </div>
        <h3 className="text-white font-bold text-base mb-2">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
      </div>
    </ScrollReveal>
  );
}
