"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Users, BookOpen, Calendar, DollarSign, TrendingUp, Plus, ArrowRight,
  Stethoscope, Dumbbell, UtensilsCrossed, BookMarked, Clock, AlertCircle,
  CheckCircle, XCircle, ChevronRight, Activity, UserPlus, CreditCard,
  BarChart3, PieChart, RefreshCw, UserX, Snowflake, Package,
  Building2, Home, Wrench, FileText
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { getCurrentUser } from "@/lib/currentUser";

interface UserData {
  user: { id: string; name: string; role: string };
  tenant: { id: string; slug?: string; name: string; industry: string; plan: string } | null;
}

interface StatCard {
  label: string;
  value: string | number;
  icon: typeof Users;
  color: string;
  href?: string;
}

interface QuickAction {
  label: string;
  href: string;
  icon: typeof Users;
  color: string;
}

interface RevenuePoint { year: number; month: number; total: number }
interface AttendancePoint { day: string; count: number }
interface ExpiringMember { id: string; name: string; endDate: string; plan?: { name: string } | null }
interface GymData {
  dashboard?: {
    members?: { total?: number; active?: number; expired?: number; frozen?: number; cancelled?: number; newThisMonth?: number };
    todayCheckins?: number;
    revenue?: { currentMonth?: number };
    pendingPayments?: { count?: number };
    expiringSoon?: number;
    expiringSoonMembers?: ExpiringMember[];
    staffPresentToday?: number;
  };
  revenue?: { series?: RevenuePoint[] };
  attendance?: { trend?: AttendancePoint[] };
  pending?: { count?: number };
}

const CHART_COLORS = ["#15757b", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const industryConfig: Record<string, {
  title: string;
  subtitle: string;
  stats: (data: Record<string, number>) => StatCard[];
  actions: QuickAction[];
  gettingStarted: { title: string; desc: string }[];
}> = {
  SCHOOL: {
    title: "School Dashboard",
    subtitle: "Overview of your school management system.",
    stats: (d) => [
      { label: "Total Students", value: d.students ?? "—", icon: Users, color: "bg-blue-50 text-blue-600", href: "/dashboard/students" },
      { label: "Active Classes", value: d.classes ?? "—", icon: BookOpen, color: "bg-emerald-50 text-emerald-600", href: "/dashboard/classes" },
      { label: "Attendance Today", value: d.attendance ?? "—", icon: Calendar, color: "bg-purple-50 text-purple-600", href: "/dashboard/attendance" },
      { label: "Fee Collection", value: d.fees ? `PKR ${Number(d.fees).toLocaleString()}` : "—", icon: DollarSign, color: "bg-amber-50 text-amber-600", href: "/dashboard/fees" },
    ],
    actions: [
      { label: "Add Student", href: "/dashboard/students?action=new", icon: Users, color: "bg-blue-600" },
      { label: "Mark Attendance", href: "/dashboard/attendance", icon: Calendar, color: "bg-emerald-600" },
      { label: "Collect Fee", href: "/dashboard/fees", icon: DollarSign, color: "bg-amber-600" },
      { label: "Manage Classes", href: "/dashboard/classes", icon: BookOpen, color: "bg-purple-600" },
    ],
    gettingStarted: [
      { title: "Set up classes", desc: "Create classes and sections for your school." },
      { title: "Add students", desc: "Register students and assign them to classes." },
      { title: "Mark daily attendance", desc: "Track student attendance and generate reports." },
      { title: "Collect fees", desc: "Record fee payments and track outstanding balances." },
    ],
  },
  CLINIC: {
    title: "Clinic Dashboard",
    subtitle: "Overview of your clinic management system.",
    stats: (d) => [
      { label: "Total Patients", value: d.patients ?? "—", icon: Users, color: "bg-blue-50 text-blue-600", href: "/dashboard/patients" },
      { label: "Today's Appointments", value: d.appointments ?? "—", icon: Calendar, color: "bg-emerald-50 text-emerald-600", href: "/dashboard/appointments" },
      { label: "Active Doctors", value: d.doctors ?? "—", icon: Stethoscope, color: "bg-purple-50 text-purple-600", href: "/dashboard/doctors" },
      { label: "Revenue This Month", value: d.revenue ? `PKR ${Number(d.revenue).toLocaleString()}` : "—", icon: DollarSign, color: "bg-amber-50 text-amber-600", href: "/dashboard/billing" },
    ],
    actions: [
      { label: "Add Patient", href: "/dashboard/patients", icon: Users, color: "bg-blue-600" },
      { label: "Book Appointment", href: "/dashboard/appointments", icon: Calendar, color: "bg-emerald-600" },
      { label: "View Doctors", href: "/dashboard/doctors", icon: Stethoscope, color: "bg-purple-600" },
      { label: "Billing", href: "/dashboard/billing", icon: DollarSign, color: "bg-amber-600" },
    ],
    gettingStarted: [
      { title: "Add doctors", desc: "Register doctors and their specialties." },
      { title: "Register patients", desc: "Add patient records with contact info." },
      { title: "Schedule appointments", desc: "Book appointments and manage the calendar." },
      { title: "Generate invoices", desc: "Create bills and track payments." },
    ],
  },
  GYM: {
    title: "Gym Dashboard",
    subtitle: "Overview of your gym management system.",
    stats: (d) => [
      { label: "Active Members", value: d.activeMembers ?? "—", icon: Users, color: "bg-blue-50 text-blue-600", href: "/dashboard/members" },
      { label: "Today's Check-ins", value: d.todayCheckins ?? "—", icon: Activity, color: "bg-emerald-50 text-emerald-600", href: "/dashboard/sessions" },
      { label: "Monthly Revenue", value: d.monthlyRevenue ? `PKR ${Number(d.monthlyRevenue).toLocaleString()}` : "—", icon: DollarSign, color: "bg-amber-50 text-amber-600", href: "/dashboard/billing" },
      { label: "Pending Payments", value: d.pendingPayments ?? "—", icon: CreditCard, color: "bg-red-50 text-red-600", href: "/dashboard/billing" },
      { label: "Expiring Soon", value: d.expiringSoon ?? "—", icon: AlertCircle, color: "bg-orange-50 text-orange-600", href: "/dashboard/members" },
      { label: "New This Month", value: d.newThisMonth ?? "—", icon: UserPlus, color: "bg-purple-50 text-purple-600", href: "/dashboard/members" },
      { label: "Staff Present Today", value: d.staffPresentToday ?? "—", icon: Dumbbell, color: "bg-indigo-50 text-indigo-600", href: "/dashboard/sessions" },
      { label: "Total Members", value: d.totalMembers ?? "—", icon: Users, color: "bg-slate-50 text-slate-600", href: "/dashboard/members" },
    ],
    actions: [
      { label: "Add Member", href: "/dashboard/members", icon: Users, color: "bg-blue-600" },
      { label: "Attendance", href: "/dashboard/sessions", icon: Clock, color: "bg-emerald-600" },
      { label: "Billing", href: "/dashboard/billing", icon: DollarSign, color: "bg-amber-600" },
      { label: "Inventory", href: "/dashboard/inventory", icon: Package, color: "bg-rose-600" },
      { label: "Reports", href: "/dashboard/reports", icon: BarChart3, color: "bg-cyan-600" },
      { label: "Settings", href: "/dashboard/settings", icon: RefreshCw, color: "bg-slate-600" },
    ],
    gettingStarted: [
      { title: "Register members", desc: "Add members with membership plans." },
      { title: "Track check-ins", desc: "Monitor daily gym attendance." },
      { title: "Mark staff attendance", desc: "Track daily presence for your staff roster." },
      { title: "Manage billing", desc: "Track membership payments and dues." },
    ],
  },
  RESTAURANT: {
    title: "Restaurant Dashboard",
    subtitle: "Overview of your restaurant management system.",
    stats: (d) => [
      { label: "Open Orders", value: d.openOrders ?? "—", icon: UtensilsCrossed, color: "bg-blue-50 text-blue-600", href: "/dashboard/orders" },
      { label: "Tables Available", value: d.tables ?? "—", icon: Calendar, color: "bg-emerald-50 text-emerald-600", href: "/dashboard/tables" },
      { label: "Menu Items", value: d.menuItems ?? "—", icon: BookOpen, color: "bg-purple-50 text-purple-600", href: "/dashboard/menu" },
      { label: "Today's Revenue", value: d.revenue ? `PKR ${Number(d.revenue).toLocaleString()}` : "—", icon: DollarSign, color: "bg-amber-50 text-amber-600", href: "/dashboard/orders" },
    ],
    actions: [
      { label: "New Order", href: "/dashboard/orders", icon: UtensilsCrossed, color: "bg-blue-600" },
      { label: "View Tables", href: "/dashboard/tables", icon: Calendar, color: "bg-emerald-600" },
      { label: "Manage Menu", href: "/dashboard/menu", icon: BookOpen, color: "bg-purple-600" },
      { label: "Staff", href: "/dashboard/staff", icon: Users, color: "bg-amber-600" },
    ],
    gettingStarted: [
      { title: "Set up menu", desc: "Create categories and add menu items." },
      { title: "Configure tables", desc: "Set up your floor plan with tables." },
      { title: "Take orders", desc: "Start taking and managing orders." },
      { title: "Manage staff", desc: "Add staff members and assign roles." },
    ],
  },
  BOOKSHOP: {
    title: "BookShop Dashboard",
    subtitle: "Overview of your bookshop management system.",
    stats: (d) => [
      { label: "Total Books", value: d.books ?? "—", icon: BookMarked, color: "bg-blue-50 text-blue-600", href: "/dashboard/books" },
      { label: "Sales Today", value: d.sales ?? "—", icon: TrendingUp, color: "bg-emerald-50 text-emerald-600", href: "/dashboard/sales" },
      { label: "Customers", value: d.customers ?? "—", icon: Users, color: "bg-purple-50 text-purple-600", href: "/dashboard/customers" },
      { label: "Revenue Today", value: d.revenue ? `PKR ${Number(d.revenue).toLocaleString()}` : "—", icon: DollarSign, color: "bg-amber-50 text-amber-600", href: "/dashboard/sales" },
    ],
    actions: [
      { label: "Add Book", href: "/dashboard/books", icon: BookMarked, color: "bg-blue-600" },
      { label: "Record Sale", href: "/dashboard/sales", icon: DollarSign, color: "bg-emerald-600" },
      { label: "Customers", href: "/dashboard/customers", icon: Users, color: "bg-purple-600" },
      { label: "Inventory", href: "/dashboard/inventory", icon: BookOpen, color: "bg-amber-600" },
    ],
    gettingStarted: [
      { title: "Add books", desc: "Add your book inventory with prices." },
      { title: "Register customers", desc: "Keep track of regular customers." },
      { title: "Record sales", desc: "Process sales and generate invoices." },
      { title: "Track inventory", desc: "Monitor stock levels and reorder." },
    ],
  },
  CAR_RENTAL: {
    title: "Car Rental Dashboard",
    subtitle: "Manage showroom vehicles, customers, rentals, and payments.",
    stats: (d) => [
      { label: "Total Cars", value: d.totalCars ?? "—", icon: Package, color: "bg-blue-50 text-blue-600", href: "/dashboard/car-rental/cars" },
      { label: "Available Cars", value: d.availableCars ?? "—", icon: CheckCircle, color: "bg-emerald-50 text-emerald-600", href: "/dashboard/car-rental/cars" },
      { label: "Active Rentals", value: d.activeRentals ?? "—", icon: Calendar, color: "bg-amber-50 text-amber-600", href: "/dashboard/car-rental/rentals" },
      { label: "Collected Revenue", value: d.totalCollected ? `PKR ${Number(d.totalCollected).toLocaleString()}` : "—", icon: DollarSign, color: "bg-purple-50 text-purple-600", href: "/dashboard/car-rental/payments" },
    ],
    actions: [
      { label: "Add Car", href: "/dashboard/car-rental/cars", icon: Package, color: "bg-blue-600" },
      { label: "New Rental", href: "/dashboard/car-rental/rentals", icon: Calendar, color: "bg-emerald-600" },
      { label: "Customers", href: "/dashboard/car-rental/customers", icon: Users, color: "bg-purple-600" },
      { label: "Payments", href: "/dashboard/car-rental/payments", icon: DollarSign, color: "bg-amber-600" },
    ],
    gettingStarted: [
      { title: "Add showroom cars", desc: "Register vehicles, rates, pictures, and availability." },
      { title: "Register customers", desc: "Store license and contact details securely." },
      { title: "Create a rental", desc: "Assign an available car and collect payment or deposit." },
      { title: "Return and reconcile", desc: "Complete returns, mileage, damage notes, and balances." },
    ],
  },
  REAL_ESTATE: {
    title: "Real Estate Dashboard",
    subtitle: "Overview of your properties, units, leases, rent, and operations.",
    stats: (d) => [
      { label: "Properties", value: d.totalProperties ?? "—", icon: Building2, color: "bg-blue-50 text-blue-600", href: "/dashboard/real-estate/properties" },
      { label: "Occupied Units", value: d.occupiedUnits !== undefined ? `${d.occupiedUnits} / ${d.totalUnits ?? 0}` : "—", icon: Home, color: "bg-purple-50 text-purple-600", href: "/dashboard/real-estate/units" },
      { label: "Occupancy Rate", value: d.occupancyRate !== undefined ? `${d.occupancyRate}%` : "—", icon: CheckCircle, color: "bg-emerald-50 text-emerald-600", href: "/dashboard/real-estate/units" },
      { label: "Collected (Month)", value: d.collectedThisMonth ? `PKR ${Number(d.collectedThisMonth).toLocaleString()}` : "—", icon: DollarSign, color: "bg-green-50 text-green-700", href: "/dashboard/real-estate/payments" },
      { label: "Overdue Rent", value: d.overdueRent ? `PKR ${Number(d.overdueRent).toLocaleString()}` : "PKR 0", icon: AlertCircle, color: "bg-red-50 text-red-600", href: "/dashboard/real-estate/leases" },
      { label: "Open Maintenance", value: d.openMaintenance ?? "—", icon: Wrench, color: "bg-amber-50 text-amber-600", href: "/dashboard/real-estate/maintenance" },
    ],
    actions: [
      { label: "Add Property", href: "/dashboard/real-estate/properties", icon: Building2, color: "bg-blue-600" },
      { label: "New Lease", href: "/dashboard/real-estate/leases", icon: FileText, color: "bg-emerald-600" },
      { label: "Collect Rent", href: "/dashboard/real-estate/payments", icon: DollarSign, color: "bg-purple-600" },
      { label: "Reports", href: "/dashboard/real-estate/reports", icon: BarChart3, color: "bg-amber-600" },
    ],
    gettingStarted: [
      { title: "Add properties", desc: "Register buildings, addresses, and portfolio details." },
      { title: "Create units", desc: "Define apartments, shops, or offices with rent amounts." },
      { title: "Sign leases", desc: "Assign tenants to vacant units with due dates and deposits." },
      { title: "Track operations", desc: "Record expenses, maintenance, and collect rent on time." },
    ],
  },
};

export default function DashboardPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [gymData, setGymData] = useState<GymData | null>(null);
  const [loading, setLoading] = useState(true);
  const [renderNow] = useState(() => Date.now());

  useEffect(() => {
    getCurrentUser().then(data => {
      if (data.user) {
        setUserData(data.user);
        const ind = data.user.tenant?.industry || "SCHOOL";
        return fetchDashboardStats(ind);
      }
    }).finally(() => setLoading(false));
  }, []);

  const fetchDashboardStats = async (industry: string) => {
    try {
      if (industry === "SCHOOL") {
        const [studentsRes, classesRes, feesRes] = await Promise.all([
          fetch("/api/school/students?limit=1"),
          fetch("/api/school/classes"),
          fetch("/api/school/fees?limit=1"),
        ]);
        const [students, classes, fees] = await Promise.all([
          studentsRes.json(), classesRes.json(), feesRes.json(),
        ]);
        setStats({
          students: students.pagination?.total || 0,
          classes: classes.classes?.length || 0,
          fees: fees.summary?.totalPaid || 0,
        });
      } else if (industry === "CLINIC") {
        const [patientsRes, appointmentsRes, doctorsRes] = await Promise.all([
          fetch("/api/clinic/patients?limit=1"),
          fetch("/api/clinic/appointments?limit=50"),
          fetch("/api/clinic/doctors"),
        ]);
        const [patients, appointments, doctors] = await Promise.all([
          patientsRes.json(), appointmentsRes.json(), doctorsRes.json(),
        ]);
        const today = new Date().toISOString().split("T")[0];
        const todayAppts = appointments.appointments?.filter((a: { date: string }) => a.date?.startsWith(today)) || [];
        setStats({
          patients: patients.pagination?.total || 0,
          appointments: todayAppts.length,
          doctors: doctors.doctors?.length || 0,
        });
      } else if (industry === "GYM") {
        const [dashRes, revenueRes, attendanceRes, pendingRes] = await Promise.all([
          fetch("/api/gym/analytics/dashboard", { credentials: "include" }).then(r => r.json()).catch(() => null),
          fetch("/api/gym/analytics/revenue?months=6", { credentials: "include" }).then(r => r.json()).catch(() => null),
          fetch("/api/gym/attendance/trends?days=30", { credentials: "include" }).then(r => r.json()).catch(() => null),
          fetch("/api/gym/analytics/pending-payments", { credentials: "include" }).then(r => r.json()).catch(() => null),
        ]);
        setGymData({
          dashboard: dashRes,
          revenue: revenueRes,
          attendance: attendanceRes,
          pending: pendingRes,
        });
        setStats({
          totalMembers: dashRes?.members?.total || 0,
          activeMembers: dashRes?.members?.active || 0,
          expiredMembers: dashRes?.members?.expired || 0,
          frozenMembers: dashRes?.members?.frozen || 0,
          todayCheckins: dashRes?.todayCheckins || 0,
          monthlyRevenue: dashRes?.revenue?.currentMonth || 0,
          pendingPayments: dashRes?.pendingPayments?.count || 0,
          expiringSoon: dashRes?.expiringSoon || 0,
          newThisMonth: dashRes?.members?.newThisMonth || 0,
          staffPresentToday: dashRes?.staffPresentToday || 0,
        });
      } else if (industry === "CAR_RENTAL") {
        const response = await fetch("/api/car-rental/dashboard", { credentials: "include" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load car rental dashboard");
        setStats({
          totalCars: data.cars ? Object.values(data.cars).reduce((sum: number, value) => sum + Number(value), 0) : 0,
          availableCars: data.cars?.available || 0,
          activeRentals: data.activeRentals || 0,
          overdueRentals: data.overdueRentals || 0,
          totalCollected: data.totalCollected || 0,
        });
      } else if (industry === "REAL_ESTATE") {
        const response = await fetch("/api/real-estate/dashboard", { credentials: "include" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load real estate dashboard");
        setStats({
          totalProperties: data.totalProperties || 0,
          totalUnits: data.totalUnits || 0,
          occupiedUnits: data.occupiedUnits || 0,
          vacantUnits: data.vacantUnits || 0,
          occupancyRate: data.occupancyRate || 0,
          expectedRent: data.expectedRent || 0,
          collectedThisMonth: data.collectedThisMonth || 0,
          expensesThisMonth: data.expensesThisMonth || 0,
          netIncome: data.netIncome || 0,
          overdueRent: data.overdueRent || 0,
          upcomingExpirations: data.upcomingExpirations || 0,
          openMaintenance: data.openMaintenance || 0,
        });
      } else if (industry === "RESTAURANT") {
        const [ordersRes, tablesRes, menuRes] = await Promise.all([
          fetch("/api/restaurant/orders?limit=1&status=OPEN"),
          fetch("/api/restaurant/tables"),
          fetch("/api/restaurant/menu"),
        ]);
        const [orders, tables, menu] = await Promise.all([
          ordersRes.json(), tablesRes.json(), menuRes.json(),
        ]);
        const availTables = tables.tables?.filter((t: { status: string }) => t.status === "AVAILABLE").length || 0;
        const totalItems = menu.categories?.reduce((sum: number, c: { menuItems: { length: number } }) => sum + (c.menuItems?.length || 0), 0) || 0;
        setStats({
          openOrders: orders.pagination?.total || 0,
          tables: availTables,
          menuItems: totalItems,
        });
      } else if (industry === "BOOKSHOP") {
        const [booksRes, salesRes, customersRes] = await Promise.all([
          fetch("/api/bookshop/books?limit=1"),
          fetch("/api/bookshop/sales?limit=50"),
          fetch("/api/bookshop/customers"),
        ]);
        const [books, sales, customers] = await Promise.all([
          booksRes.json(), salesRes.json(), customersRes.json(),
        ]);
        const today = new Date().toISOString().split("T")[0];
        const todaySales = sales.sales?.filter((s: { createdAt: string }) => s.createdAt?.startsWith(today)) || [];
        const todayRevenue = todaySales.reduce((sum: number, s: { total: string }) => sum + Number(s.total || 0), 0);
        setStats({
          books: books.pagination?.total || 0,
          sales: todaySales.length,
          customers: customers.customers?.length || 0,
          revenue: todayRevenue,
        });
      }
    } catch (e) {
      console.error("Failed to fetch stats:", e);
    }
  };

  const revenueChartData = useMemo(() => {
    if (!gymData?.revenue?.series) return [];
     return gymData.revenue.series.map((s: RevenuePoint) => ({
      name: MONTH_NAMES[s.month - 1] || `${s.month}`,
      revenue: s.total,
    }));
  }, [gymData]);

  const attendanceChartData = useMemo(() => {
     if (!gymData?.attendance?.trend) return [];
     return [...gymData.attendance.trend].reverse().map((d: AttendancePoint) => ({
       name: d.day?.slice(5) || d.day,
      checkins: d.count,
    }));
  }, [gymData]);

  const memberStatusData = useMemo(() => {
    if (!gymData?.dashboard?.members) return [];
    const m = gymData.dashboard.members;
    return [
      { name: "Active", value: m.active || 0 },
      { name: "Expired", value: m.expired || 0 },
      { name: "Frozen", value: m.frozen || 0 },
      { name: "Cancelled", value: m.cancelled || 0 },
    ].filter(d => d.value > 0);
  }, [gymData]);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Loading...</div>;
  }

  const industry = userData?.tenant?.industry || "SCHOOL";
  const config = industryConfig[industry] || industryConfig.SCHOOL;
  const statCards = config.stats(stats);
  const isGym = industry === "GYM";
  const expiringSoonMembers = gymData?.dashboard?.expiringSoonMembers ?? [];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-1">{config.title}</h2>
        <p className="text-slate-500 text-sm">{config.subtitle}</p>
      </div>

      {/* Stats */}
      <div className={`grid gap-4 mb-8 ${isGym ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href || "#"}
            className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow no-underline group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon size={18} />
              </div>
              <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            <p className="text-slate-500 text-xs mt-0.5">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Gym Charts Row */}
      {isGym && gymData && (
        <div className="grid lg:grid-cols-3 gap-4 mb-8">
          {/* Revenue Chart */}
          {revenueChartData.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 text-sm">Revenue Trend</h3>
                <span className="text-xs text-slate-400">Last 6 months</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#15757b" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#15757b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                   <Tooltip formatter={(v: unknown) => [`PKR ${Number(v ?? 0).toLocaleString()}`, "Revenue"]} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
                  <Area type="monotone" dataKey="revenue" stroke="#15757b" fill="url(#revGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Member Status Pie */}
          {memberStatusData.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-bold text-slate-900 text-sm mb-4">Member Status</h3>
              <ResponsiveContainer width="100%" height={220}>
                <RePieChart>
                  <Pie data={memberStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                     {memberStatusData.map((_: unknown, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                   <Tooltip formatter={(v: unknown) => [Number(v ?? 0), "Members"]} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
                </RePieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-2">
                 {memberStatusData.map((d: { name: string; value: number }, i: number) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attendance Trend */}
          {attendanceChartData.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 lg:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 text-sm">Attendance Trend</h3>
                <span className="text-xs text-slate-400">Last 30 days</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={attendanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" interval={Math.floor(attendanceChartData.length / 8)} />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
                  <Bar dataKey="checkins" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className={`grid gap-4 mb-8 ${isGym ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
        {config.actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 hover:shadow-md transition-all group no-underline"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.color} text-white`}>
              <action.icon size={18} />
            </div>
            <span className="text-slate-900 font-semibold text-sm">{action.label}</span>
            <ArrowRight size={14} className="ml-auto text-slate-300 group-hover:text-slate-500 transition-colors" />
          </Link>
        ))}
      </div>

      {/* Gym Expiring Soon Widget */}
      {isGym && expiringSoonMembers.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">Expiring Soon</h3>
            <Link href="/dashboard/members" className="text-blue-600 text-sm font-semibold hover:underline">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 font-semibold text-slate-500">Member</th>
                  <th className="text-left py-2 font-semibold text-slate-500">Plan</th>
                  <th className="text-left py-2 font-semibold text-slate-500">Expires</th>
                  <th className="text-left py-2 font-semibold text-slate-500">Days Left</th>
                </tr>
              </thead>
              <tbody>
                 {expiringSoonMembers.slice(0, 5).map((m: ExpiringMember) => {
                  const daysLeft = Math.ceil((new Date(m.endDate).getTime() - renderNow) / 86400000);
                  return (
                    <tr key={m.id} className="border-b border-slate-50">
                      <td className="py-2.5 font-medium text-slate-900">{m.name}</td>
                      <td className="py-2.5 text-slate-600">{m.plan?.name || "—"}</td>
                      <td className="py-2.5 text-slate-600">{new Date(m.endDate).toLocaleDateString()}</td>
                      <td className="py-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${daysLeft <= 1 ? "bg-red-100 text-red-700" : daysLeft <= 3 ? "bg-orange-100 text-orange-700" : "bg-amber-100 text-amber-700"}`}>
                          {daysLeft}d
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Getting Started */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <h3 className="text-slate-900 font-bold text-lg mb-4">Getting Started</h3>
        <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
          {config.gettingStarted.map((step, i) => (
            <div key={i} className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 text-xs font-bold">{i + 1}</span>
              <div>
                <p className="font-semibold text-slate-900">{step.title}</p>
                <p>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
