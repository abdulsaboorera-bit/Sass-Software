"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, BookOpen, Calendar, DollarSign,
  Settings, ChevronLeft, ChevronRight, Zap, Bell, LogOut,
  GraduationCap, Menu, X, BarChart3, Package, ClipboardList, CreditCard, Trophy, Contact
} from "lucide-react";
import ChatWidget from "@/components/ChatWidget";

interface UserData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  tenant: {
    id: string;
    slug: string;
    name: string;
    industry: string;
    plan: string;
  } | null;
  permissions: string[];
}

type NavLink = { label: string; href: string; icon: typeof LayoutDashboard; permission?: string };

const industryNav: Record<string, NavLink[]> = {
  SCHOOL: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Students", href: "/dashboard/students", icon: Users },
    { label: "Classes", href: "/dashboard/classes", icon: BookOpen },
    { label: "Attendance", href: "/dashboard/attendance", icon: Calendar },
    { label: "Fees", href: "/dashboard/fees", icon: DollarSign },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ],
  CLINIC: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Patients", href: "/dashboard/patients", icon: Users },
    { label: "Appointments", href: "/dashboard/appointments", icon: Calendar },
    { label: "Doctors", href: "/dashboard/doctors", icon: GraduationCap },
    { label: "Billing", href: "/dashboard/billing", icon: DollarSign },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ],
  RESTAURANT: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Orders", href: "/dashboard/orders", icon: BookOpen },
    { label: "Menu", href: "/dashboard/menu", icon: BookOpen },
    { label: "Tables", href: "/dashboard/tables", icon: Calendar },
    { label: "Staff", href: "/dashboard/staff", icon: Users },
    { label: "Inventory", href: "/dashboard/inventory", icon: DollarSign },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ],
  GYM: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Members", href: "/dashboard/members", icon: Users, permission: "members.view" },
    { label: "Plans", href: "/dashboard/plans", icon: CreditCard, permission: "members.view" },
    { label: "Classes", href: "/dashboard/gym-classes", icon: Calendar, permission: "sessions.view" },
    { label: "Trainers", href: "/dashboard/trainers", icon: Users, permission: "trainers.view" },
    { label: "Leaderboard", href: "/dashboard/leaderboard", icon: Trophy, permission: "members.view" },
    { label: "Attendance", href: "/dashboard/sessions", icon: Calendar, permission: "attendance.view" },
    { label: "Directory", href: "/dashboard/directory", icon: Contact, permission: "members.view" },
    { label: "Billing", href: "/dashboard/billing", icon: CreditCard, permission: "billing.view" },
    { label: "Inventory", href: "/dashboard/inventory", icon: Package, permission: "inventory.view" },
    { label: "Expenses", href: "/dashboard/expenses", icon: DollarSign, permission: "billing.view" },
    { label: "Reports", href: "/dashboard/reports", icon: BarChart3, permission: "analytics.view" },
    { label: "Settings", href: "/dashboard/settings", icon: Settings, permission: "settings.view" },
  ],
  BOOKSHOP: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Books", href: "/dashboard/books", icon: BookOpen },
    { label: "Sales", href: "/dashboard/sales", icon: DollarSign },
    { label: "Customers", href: "/dashboard/customers", icon: Users },
    { label: "Inventory", href: "/dashboard/inventory", icon: Calendar },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          // Platform super admin (no tenant) should be in admin panel
          if (data.user.user.role === "SUPER_ADMIN" && !data.user.tenant) {
            router.push("/admin");
            return;
          }
           setUserData({ ...data.user, permissions: data.user.permissions || [] });
        } else {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const rawNav = userData?.tenant
    ? industryNav[userData.tenant.industry] || industryNav.SCHOOL
    : [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }];
  const nav = rawNav.filter((link) => {
    if (!link.permission) return true;
    const [resource] = link.permission.split(".");
    const permissions = userData?.permissions || [];
    return permissions.includes("*") || permissions.includes(link.permission) || permissions.includes(`${resource}.*`) || (link.permission === "members.view" && permissions.includes("members.view.assigned"));
  });

  useEffect(() => {
    if (!userData || loading || pathname === "/dashboard") return;
    if (!nav.some((link) => pathname === link.href || pathname.startsWith(`${link.href}/`))) {
      router.replace("/dashboard");
    }
  }, [loading, nav, pathname, router, userData]);

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-50 items-center justify-center">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    );
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <Zap size={15} fill="white" className="text-white" />
        </div>
        {(!collapsed || mobileOpen) && (
          <div className="min-w-0 flex-1">
            <span className="text-white font-bold text-sm tracking-tight block truncate">
              Orbitrix<span className="text-blue-400"> ERP</span>
            </span>
            <span className="text-slate-500 text-[10px] block truncate">
              {userData?.tenant?.name || "Dashboard"}
            </span>
          </div>
        )}
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden ml-auto p-1 rounded text-slate-400 hover:text-white bg-transparent border-none cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-4 space-y-0.5 overflow-y-auto">
        {nav.map((link) => {
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
          onClick={handleLogout}
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
          <aside className="relative flex flex-col bg-slate-900 text-white w-64 h-full animate-slide-in-left z-10">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-6 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer border-none bg-transparent"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="text-slate-900 font-bold text-base sm:text-lg truncate">
                {nav.find((l) => l.href === pathname)?.label || "Dashboard"}
              </h1>
              <p className="text-slate-500 text-[10px] sm:text-xs truncate hidden sm:block">
                {userData?.tenant?.name} — {userData?.tenant?.plan} plan
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button className="relative p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer border-none bg-transparent">
              <Bell size={18} />
            </button>
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {userData?.user?.name?.charAt(0) || "U"}
              </div>
              <div className="hidden md:block">
                <p className="text-slate-900 text-xs font-semibold">{userData?.user?.name}</p>
                <p className="text-slate-500 text-[10px]">{userData?.user?.role?.replace("_", " ")}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>

      {userData?.tenant && <ChatWidget />}
    </div>
  );
}
