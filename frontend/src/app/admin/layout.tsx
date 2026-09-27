"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, Building2, DollarSign, MessageCircle,
  ChevronLeft, ChevronRight, LogOut, Zap, Menu, X
} from "lucide-react";

const sidebarLinks = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Tenants", href: "/admin/tenants", icon: Building2 },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Payments", href: "/admin/payments", icon: DollarSign },
  { label: "Messages", href: "/admin/messages", icon: MessageCircle },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [admin, setAdmin] = useState<{ name: string; email: string } | null>(null);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data.user?.user) setAdmin(data.user.user); })
      .catch(() => {});
  }, []);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <Zap size={15} fill="white" className="text-white" />
        </div>
        {(!collapsed || mobileOpen) && (
          <span className="text-white font-bold text-sm tracking-tight whitespace-nowrap flex-1">
            Orbitrix<span className="text-blue-400"> ERP</span>
            <span className="text-slate-500 font-normal ml-1.5 text-xs">Admin</span>
          </span>
        )}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden ml-auto p-1 rounded text-slate-400 hover:text-white bg-transparent border-none cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-4 space-y-0.5 overflow-y-auto">
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors no-underline ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
              title={collapsed && !mobileOpen ? link.label : undefined}
            >
              <link.icon size={18} className="shrink-0" />
              {(!collapsed || mobileOpen) && <span>{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse + Logout */}
      <div className="px-2.5 py-3 border-t border-white/5 space-y-0.5">
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
            window.location.href = "/login";
          }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer border-none bg-transparent"
          title={collapsed && !mobileOpen ? "Logout" : undefined}
        >
          <LogOut size={18} className="shrink-0" />
          {(!collapsed || mobileOpen) && <span>Logout</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center w-full py-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors cursor-pointer border-none bg-transparent"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col bg-slate-900 text-white transition-all duration-300 shrink-0"
        style={{ width: collapsed ? 72 : 260 }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex flex-col bg-slate-900 text-white w-64 h-full z-10">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-6 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer border-none bg-transparent"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="text-slate-900 font-bold text-base sm:text-lg">Admin Panel</h1>
              <p className="text-slate-500 text-[10px] sm:text-xs hidden sm:block">Manage your platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {admin ? admin.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "SA"}
              </div>
              <div className="hidden md:block">
                <p className="text-slate-900 text-xs font-semibold">{admin?.name || "Super Admin"}</p>
                <p className="text-slate-500 text-[10px]">{admin?.email || ""}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
