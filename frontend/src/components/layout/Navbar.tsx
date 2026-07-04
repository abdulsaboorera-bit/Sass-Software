"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, Utensils, Stethoscope, BookOpen, GraduationCap, Phone, ArrowRight, Zap, Dumbbell, MessageCircle } from "lucide-react";

const solutions = [
  { icon: Utensils,     name: "Restaurant Management", desc: "POS, kitchen display & inventory",  href: "/solutions/restaurant", iconBg: "#fff7ed", iconColor: "#f97316" },
  { icon: Stethoscope,  name: "Clinic Management",     desc: "EMR, appointments & prescriptions", href: "/solutions/clinic",     iconBg: "#f0fdf4", iconColor: "#10b981" },
  { icon: BookOpen,     name: "Book Shop Management",  desc: "Inventory, POS & barcode scanning",  href: "/solutions/bookshop",   iconBg: "#eff6ff", iconColor: "#3b82f6" },
  { icon: GraduationCap,name: "School Management",     desc: "Students, fees & parent portal",     href: "/solutions/school",     iconBg: "#faf5ff", iconColor: "#8b5cf6" },
  { icon: Dumbbell,     name: "Gym Management",        desc: "Members, trainers & billing",        href: "/solutions/gym",        iconBg: "#fef2f2", iconColor: "#ef4444" },
];

const nav = [
  { label: "Home",      href: "/" },
  { label: "Solutions", href: "#", mega: true },
  { label: "Pricing",   href: "/pricing" },
  { label: "About",     href: "/about" },
  { label: "Blog",      href: "/blog" },
  { label: "Contact",   href: "/contact" },
];

export default function Navbar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen,   setMegaOpen]   = useState(false);
  const [mobileExp,  setMobileExp]  = useState(false);
  const pathname = usePathname();
  const megaRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) setMegaOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => { setMobileOpen(false); setMegaOpen(false); }, [pathname]);

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {megaOpen && <div className="fixed inset-0 z-40" onClick={() => setMegaOpen(false)} />}

      <header
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          transition: "all 0.3s cubic-bezier(0.25,0.46,0.45,0.94)",
          background: scrolled ? "rgba(3,7,18,0.92)" : "rgba(3,7,18,0.6)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(255,255,255,0.03)",
          boxShadow: scrolled ? "0 1px 24px rgba(0,0,0,0.3)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="flex items-center justify-between" style={{ height: 64 }}>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group" style={{ textDecoration: "none" }}>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                style={{ background: "linear-gradient(135deg, #2563eb, #3b82f6)", boxShadow: "0 2px 10px rgba(37,99,235,0.4)" }}
              >
                <Zap size={15} className="text-white" fill="white" />
              </div>
              <span className="text-white font-bold text-[1.05rem] tracking-tight">
                Orbitrix<span className="text-blue-400"> ERP</span>
              </span>
            </Link>

            {/* Desktop nav — centered via flex-1 */}
            <nav className="hidden lg:flex items-center justify-center gap-0.5 flex-1">
              {nav.map(link =>
                link.mega ? (
                  <div key={link.label} ref={megaRef} className="relative">
                    <button
                      onClick={() => setMegaOpen(o => !o)}
                      className="flex items-center gap-1 px-3.5 py-2 rounded-full text-[0.8125rem] font-medium transition-all cursor-pointer border-none"
                      style={{
                        background: megaOpen ? "rgba(255,255,255,0.06)" : "transparent",
                        color: megaOpen ? "#ffffff" : "#a1a1aa",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = "#ffffff"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                      onMouseLeave={e => { if (!megaOpen) { e.currentTarget.style.color = "#a1a1aa"; e.currentTarget.style.background = "transparent"; } }}
                    >
                      {link.label}
                      <ChevronDown size={12} className="transition-transform duration-200" style={{ transform: megaOpen ? "rotate(180deg)" : "none" }} />
                    </button>

                    {megaOpen && (
                      <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-[340px] sm:w-[420px] lg:w-[540px] xl:w-[600px]" style={{
                        background: "rgba(13,17,23,0.97)", border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 16, padding: "1rem",
                        boxShadow: "0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)",
                        backdropFilter: "blur(24px)",
                        zIndex: 60,
                        animation: "scale-up 0.2s cubic-bezier(0.16,1,0.3,1)",
                      }}>
                        <div className="px-2 pb-3 mb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                          <p className="text-[0.65rem] font-bold tracking-[0.12em] uppercase text-zinc-500">Our Products</p>
                          <p className="text-[0.8125rem] font-semibold text-zinc-200 mt-0.5">Software built for your industry</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
                          {solutions.map(s => (
                            <Link
                              key={s.href} href={s.href}
                              className="flex items-start gap-3 p-2.5 rounded-xl border border-transparent transition-all duration-200 no-underline group/item"
                              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
                            >
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover/item:scale-105" style={{ background: s.iconBg }}>
                                <s.icon size={17} style={{ color: s.iconColor }} />
                              </div>
                              <div>
                                <p className="text-[0.8125rem] font-semibold text-zinc-100 leading-tight">{s.name}</p>
                                <p className="text-[0.7rem] text-zinc-500 mt-0.5">{s.desc}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                        <div className="mt-2 pt-2.5 px-2 flex items-center justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                          <span className="text-[0.7rem] text-zinc-500">Not sure which fits?</span>
                          <Link href="/demo" className="inline-flex items-center gap-1 text-[0.7rem] font-semibold text-blue-400 no-underline hover:text-blue-300 transition-colors">
                            Book a free demo <ArrowRight size={10} />
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={link.label} href={link.href}
                    className="relative px-3.5 py-2 rounded-full text-[0.8125rem] font-medium no-underline transition-all duration-200"
                    style={{
                      color: isActive(link.href) ? "#ffffff" : "#a1a1aa",
                      background: isActive(link.href) ? "rgba(255,255,255,0.06)" : "transparent",
                    }}
                    onMouseEnter={e => { if (!isActive(link.href)) { e.currentTarget.style.color = "#ffffff"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; } }}
                    onMouseLeave={e => { if (!isActive(link.href)) { e.currentTarget.style.color = "#a1a1aa"; e.currentTarget.style.background = "transparent"; } }}
                  >
                    {link.label}
                    {isActive(link.href) && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-blue-500 rounded-full" />
                    )}
                  </Link>
                )
              )}
            </nav>

            {/* Right actions - Desktop */}
            <div className="hidden lg:flex items-center gap-1">
              <Link
                href="/contact"
                className="hidden xl:inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-zinc-400 no-underline px-3.5 py-2 rounded-full transition-all duration-200 hover:text-white hover:bg-white/5"
              >
                <Phone size={13} /> Support
              </Link>
              <div className="w-px h-5 bg-white/8 mx-1.5 hidden xl:block" />
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-zinc-400 no-underline px-3.5 py-2 rounded-full transition-all duration-200 hover:text-white hover:bg-white/5"
              >
                Sign In
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 text-[0.8125rem] font-semibold px-5 py-2 rounded-full no-underline transition-all duration-250"
                style={{
                  background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                  color: "#ffffff",
                  boxShadow: "0 1px 8px rgba(37,99,235,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(37,99,235,0.5), inset 0 1px 0 rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 8px rgba(37,99,235,0.3), inset 0 1px 0 rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                Request Demo
              </Link>
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl border-none bg-white/5 text-slate-300 cursor-pointer"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-white/5" style={{ background: "rgba(13,17,23,0.98)", backdropFilter: "blur(20px)" }}>
            <div className="px-4 py-4 max-h-[calc(100vh-64px)] overflow-y-auto">
              {nav.map(link =>
                link.mega ? (
                  <div key={link.label}>
                    <button
                      onClick={() => setMobileExp(o => !o)}
                      className="w-full flex items-center justify-between py-3 px-3 rounded-xl border-none bg-transparent text-zinc-300 text-sm font-medium cursor-pointer"
                    >
                      {link.label}
                      <ChevronDown size={14} className="transition-transform duration-200" style={{ transform: mobileExp ? "rotate(180deg)" : "none" }} />
                    </button>
                    {mobileExp && (
                      <div className="ml-3 pl-3 border-l border-white/5">
                        {solutions.map(s => (
                          <Link key={s.href} href={s.href} className="flex items-center gap-2.5 py-2.5 px-3 rounded-lg no-underline">
                            <s.icon size={16} style={{ color: s.iconColor }} />
                            <span className="text-sm text-zinc-300 font-medium">{s.name}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link key={link.label} href={link.href} className="block py-3 px-3 rounded-xl no-underline text-sm font-medium" style={{ color: isActive(link.href) ? "#60a5fa" : "#d1d5db" }}>
                    {link.label}
                  </Link>
                )
              )}
              <div className="mt-4 pt-4 flex flex-col gap-2.5 border-t border-white/5">
                <Link href="/contact" className="btn-secondary text-center justify-center py-3">Contact Us</Link>
                <Link href="/demo" className="btn-primary text-center justify-center py-3">Request Demo</Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
