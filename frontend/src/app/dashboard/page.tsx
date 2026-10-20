"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Users, BookOpen, Calendar, DollarSign, TrendingUp, ArrowRight,
  Stethoscope, Dumbbell, UtensilsCrossed, BookMarked, Clock, AlertCircle,
  CheckCircle, ChevronRight, Activity, UserPlus, CreditCard,
  BarChart3, RefreshCw, Package,
  Building2, Home, Wrench, FileText, Contact
} from "lucide-react";
import { getCurrentUser } from "@/lib/currentUser";
import { usePermissions } from "@/lib/permissions";

// recharts is heavy and only ever renders for a few industries — load it lazily
// so the dashboard shell paints without waiting on the charting library.
const DashboardCharts = dynamic(() => import("@/components/dashboard/DashboardCharts"), { ssr: false, loading: () => null });
const InsightsCard = dynamic(() => import("@/components/dashboard/InsightsCard"), { ssr: false, loading: () => null });

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
  permission?: string;
}

interface QuickAction {
  label: string;
  href: string;
  icon: typeof Users;
  color: string;
  permission?: string;
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

interface SalonTopService { serviceId: string; name?: string; price?: number; bookings: number }
interface SalonTopStaff { staffId: string; name?: string; role?: string; services: number; revenue: number }
interface SalonData {
  revenue?: { series?: RevenuePoint[] };
  topServices?: SalonTopService[];
  topStaff?: SalonTopStaff[];
}

interface ClinicTopDoctor { doctorId: string; name?: string; specialization?: string; appointments: number; revenue: number }
interface ClinicData {
  revenue?: { series?: RevenuePoint[] };
  topDoctors?: ClinicTopDoctor[];
}

interface SchoolLowAttendanceRow { studentId: string; name?: string; admissionNo?: string; percent: number }
interface SchoolData {
  revenue?: { series?: RevenuePoint[] };
  attendance?: { trend?: AttendancePoint[] };
  lowAttendance?: { threshold?: number; rows?: SchoolLowAttendanceRow[] };
}

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
      { label: "Total Students", value: d.students ?? "—", icon: Users, color: "bg-blue-50 text-blue-600", href: "/dashboard/students", permission: "students.view" },
      { label: "Active Classes", value: d.classes ?? "—", icon: BookOpen, color: "bg-emerald-50 text-emerald-600", href: "/dashboard/classes", permission: "classes.view" },
      { label: "Attendance Today", value: d.attendance ?? "—", icon: Calendar, color: "bg-purple-50 text-purple-600", href: "/dashboard/attendance", permission: "attendance.view" },
      { label: "Fee Collection", value: d.fees ? `PKR ${Number(d.fees).toLocaleString()}` : "—", icon: DollarSign, color: "bg-amber-50 text-amber-600", href: "/dashboard/fees", permission: "fees.view" },
    ],
    actions: [
      { label: "Add Student", href: "/dashboard/students?action=new", icon: Users, color: "bg-blue-600", permission: "students.create" },
      { label: "Mark Attendance", href: "/dashboard/attendance", icon: Calendar, color: "bg-emerald-600", permission: "attendance.mark" },
      { label: "Collect Fee", href: "/dashboard/fees", icon: DollarSign, color: "bg-amber-600", permission: "fees.collect" },
      { label: "Manage Classes", href: "/dashboard/classes", icon: BookOpen, color: "bg-purple-600", permission: "classes.view" },
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
    subtitle: "Patients, appointments, pharmacy, and revenue at a glance.",
    stats: (d) => [
      { label: "Total Patients", value: d.patients ?? "—", icon: Users, color: "bg-blue-50 text-blue-600", href: "/dashboard/clinic/patients", permission: "patients.view" },
      { label: "Today's Appointments", value: d.todayAppointments ?? "—", icon: Calendar, color: "bg-emerald-50 text-emerald-600", href: "/dashboard/clinic/appointments", permission: "appointments.view" },
      { label: "Doctors", value: d.doctors ?? "—", icon: Stethoscope, color: "bg-purple-50 text-purple-600", href: "/dashboard/clinic/doctors", permission: "doctors.view" },
      { label: "Revenue This Month", value: d.monthlyRevenue ? `PKR ${Number(d.monthlyRevenue).toLocaleString()}` : "—", icon: DollarSign, color: "bg-amber-50 text-amber-600", href: "/dashboard/clinic/billing", permission: "billing.view" },
      { label: "Pending Invoices", value: d.pendingPayments ?? "—", icon: AlertCircle, color: "bg-red-50 text-red-600", href: "/dashboard/clinic/billing", permission: "billing.view" },
      { label: "Low Stock Medicines", value: d.lowStock ?? "—", icon: Package, color: "bg-orange-50 text-orange-600", href: "/dashboard/clinic/pharmacy", permission: "pharmacy.view" },
    ],
    actions: [
      { label: "Register Patient", href: "/dashboard/clinic/patients", icon: Users, color: "bg-blue-600", permission: "patients.create" },
      { label: "Book Appointment", href: "/dashboard/clinic/appointments", icon: Calendar, color: "bg-emerald-600", permission: "appointments.create" },
      { label: "Pharmacy", href: "/dashboard/clinic/pharmacy", icon: Package, color: "bg-purple-600", permission: "pharmacy.view" },
      { label: "Billing", href: "/dashboard/clinic/billing", icon: DollarSign, color: "bg-amber-600", permission: "billing.view" },
      { label: "Laboratory", href: "/dashboard/clinic/lab", icon: Activity, color: "bg-cyan-600", permission: "lab.view" },
      { label: "Reports", href: "/dashboard/clinic/reports", icon: BarChart3, color: "bg-slate-600", permission: "analytics.view" },
    ],
    gettingStarted: [
      { title: "Add doctors & departments", desc: "Register doctors with specialties, fees, and schedules." },
      { title: "Register patients", desc: "Add patient records with contact and medical details." },
      { title: "Schedule appointments", desc: "Book appointments and manage the daily calendar." },
      { title: "Dispense & bill", desc: "Dispense pharmacy medicines, run lab tests, and generate invoices." },
    ],
  },
  GYM: {
    title: "Gym Dashboard",
    subtitle: "Overview of your gym management system.",
    stats: (d) => [
      { label: "Active Members", value: d.activeMembers ?? "—", icon: Users, color: "bg-blue-50 text-blue-600", href: "/dashboard/members", permission: "members.view" },
      { label: "Today's Check-ins", value: d.todayCheckins ?? "—", icon: Activity, color: "bg-emerald-50 text-emerald-600", href: "/dashboard/sessions", permission: "attendance.view" },
      { label: "Monthly Revenue", value: d.monthlyRevenue ? `PKR ${Number(d.monthlyRevenue).toLocaleString()}` : "—", icon: DollarSign, color: "bg-amber-50 text-amber-600", href: "/dashboard/billing", permission: "billing.view" },
      { label: "Pending Payments", value: d.pendingPayments ?? "—", icon: CreditCard, color: "bg-red-50 text-red-600", href: "/dashboard/billing", permission: "billing.view" },
      { label: "Expiring Soon", value: d.expiringSoon ?? "—", icon: AlertCircle, color: "bg-orange-50 text-orange-600", href: "/dashboard/members", permission: "members.view" },
      { label: "New This Month", value: d.newThisMonth ?? "—", icon: UserPlus, color: "bg-purple-50 text-purple-600", href: "/dashboard/members", permission: "members.view" },
      { label: "Staff Present Today", value: d.staffPresentToday ?? "—", icon: Dumbbell, color: "bg-indigo-50 text-indigo-600", href: "/dashboard/sessions", permission: "attendance.view" },
      { label: "Total Members", value: d.totalMembers ?? "—", icon: Users, color: "bg-slate-50 text-slate-600", href: "/dashboard/members", permission: "members.view" },
    ],
    actions: [
      { label: "Add Member", href: "/dashboard/members", icon: Users, color: "bg-blue-600", permission: "members.create" },
      { label: "Attendance", href: "/dashboard/sessions", icon: Clock, color: "bg-emerald-600", permission: "attendance.mark" },
      { label: "Billing", href: "/dashboard/billing", icon: DollarSign, color: "bg-amber-600", permission: "billing.view" },
      { label: "Inventory", href: "/dashboard/inventory", icon: Package, color: "bg-rose-600", permission: "inventory.view" },
      { label: "Reports", href: "/dashboard/reports", icon: BarChart3, color: "bg-cyan-600", permission: "analytics.view" },
      { label: "Settings", href: "/dashboard/settings", icon: RefreshCw, color: "bg-slate-600", permission: "settings.view" },
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
      { label: "Open Orders", value: d.openOrders ?? "—", icon: UtensilsCrossed, color: "bg-blue-50 text-blue-600", href: "/dashboard/orders", permission: "orders.view" },
      { label: "Tables Available", value: d.tables ?? "—", icon: Calendar, color: "bg-emerald-50 text-emerald-600", href: "/dashboard/tables", permission: "tables.view" },
      { label: "Menu Items", value: d.menuItems ?? "—", icon: BookOpen, color: "bg-purple-50 text-purple-600", href: "/dashboard/menu", permission: "menu.view" },
      { label: "Today's Revenue", value: d.revenue ? `PKR ${Number(d.revenue).toLocaleString()}` : "—", icon: DollarSign, color: "bg-amber-50 text-amber-600", href: "/dashboard/orders", permission: "orders.view" },
    ],
    actions: [
      { label: "New Order", href: "/dashboard/orders", icon: UtensilsCrossed, color: "bg-blue-600", permission: "orders.create" },
      { label: "View Tables", href: "/dashboard/tables", icon: Calendar, color: "bg-emerald-600", permission: "tables.view" },
      { label: "Manage Menu", href: "/dashboard/menu", icon: BookOpen, color: "bg-purple-600", permission: "menu.create" },
      { label: "Staff", href: "/dashboard/staff", icon: Users, color: "bg-amber-600", permission: "staff.view" },
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
      { label: "Total Books", value: d.books ?? "—", icon: BookMarked, color: "bg-blue-50 text-blue-600", href: "/dashboard/books", permission: "inventory.view" },
      { label: "Sales Today", value: d.sales ?? "—", icon: TrendingUp, color: "bg-emerald-50 text-emerald-600", href: "/dashboard/sales", permission: "sales.view" },
      { label: "Customers", value: d.customers ?? "—", icon: Users, color: "bg-purple-50 text-purple-600", href: "/dashboard/customers", permission: "customers.view" },
      { label: "Revenue Today", value: d.revenue ? `PKR ${Number(d.revenue).toLocaleString()}` : "—", icon: DollarSign, color: "bg-amber-50 text-amber-600", href: "/dashboard/sales", permission: "sales.view" },
    ],
    actions: [
      { label: "Add Book", href: "/dashboard/books", icon: BookMarked, color: "bg-blue-600", permission: "inventory.create" },
      { label: "Record Sale", href: "/dashboard/sales", icon: DollarSign, color: "bg-emerald-600", permission: "sales.create" },
      { label: "Customers", href: "/dashboard/customers", icon: Users, color: "bg-purple-600", permission: "customers.view" },
      { label: "Inventory", href: "/dashboard/inventory", icon: BookOpen, color: "bg-amber-600", permission: "inventory.view" },
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
      { label: "Total Cars", value: d.totalCars ?? "—", icon: Package, color: "bg-blue-50 text-blue-600", href: "/dashboard/car-rental/cars", permission: "cars.view" },
      { label: "Available Cars", value: d.availableCars ?? "—", icon: CheckCircle, color: "bg-emerald-50 text-emerald-600", href: "/dashboard/car-rental/cars", permission: "cars.view" },
      { label: "Active Rentals", value: d.activeRentals ?? "—", icon: Calendar, color: "bg-amber-50 text-amber-600", href: "/dashboard/car-rental/rentals", permission: "rentals.view" },
      { label: "Collected Revenue", value: d.totalCollected ? `PKR ${Number(d.totalCollected).toLocaleString()}` : "—", icon: DollarSign, color: "bg-purple-50 text-purple-600", href: "/dashboard/car-rental/payments", permission: "billing.view" },
    ],
    actions: [
      { label: "Add Car", href: "/dashboard/car-rental/cars", icon: Package, color: "bg-blue-600", permission: "cars.create" },
      { label: "New Rental", href: "/dashboard/car-rental/rentals", icon: Calendar, color: "bg-emerald-600", permission: "rentals.create" },
      { label: "Customers", href: "/dashboard/car-rental/customers", icon: Users, color: "bg-purple-600", permission: "customers.view" },
      { label: "Payments", href: "/dashboard/car-rental/payments", icon: DollarSign, color: "bg-amber-600", permission: "billing.view" },
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
      { label: "Properties", value: d.totalProperties ?? "—", icon: Building2, color: "bg-blue-50 text-blue-600", href: "/dashboard/real-estate/properties", permission: "properties.view" },
      { label: "Occupied Units", value: d.occupiedUnits !== undefined ? `${d.occupiedUnits} / ${d.totalUnits ?? 0}` : "—", icon: Home, color: "bg-purple-50 text-purple-600", href: "/dashboard/real-estate/units", permission: "units.view" },
      { label: "Occupancy Rate", value: d.occupancyRate !== undefined ? `${d.occupancyRate}%` : "—", icon: CheckCircle, color: "bg-emerald-50 text-emerald-600", href: "/dashboard/real-estate/units", permission: "units.view" },
      { label: "Collected (Month)", value: d.collectedThisMonth ? `PKR ${Number(d.collectedThisMonth).toLocaleString()}` : "—", icon: DollarSign, color: "bg-green-50 text-green-700", href: "/dashboard/real-estate/payments", permission: "billing.view" },
      { label: "Overdue Rent", value: d.overdueRent ? `PKR ${Number(d.overdueRent).toLocaleString()}` : "PKR 0", icon: AlertCircle, color: "bg-red-50 text-red-600", href: "/dashboard/real-estate/leases", permission: "leases.view" },
      { label: "Open Maintenance", value: d.openMaintenance ?? "—", icon: Wrench, color: "bg-amber-50 text-amber-600", href: "/dashboard/real-estate/maintenance", permission: "maintenance.view" },
    ],
    actions: [
      { label: "Add Property", href: "/dashboard/real-estate/properties", icon: Building2, color: "bg-blue-600", permission: "properties.create" },
      { label: "New Lease", href: "/dashboard/real-estate/leases", icon: FileText, color: "bg-emerald-600", permission: "leases.create" },
      { label: "Collect Rent", href: "/dashboard/real-estate/payments", icon: DollarSign, color: "bg-purple-600", permission: "billing.create" },
      { label: "Reports", href: "/dashboard/real-estate/reports", icon: BarChart3, color: "bg-amber-600", permission: "analytics.view" },
    ],
    gettingStarted: [
      { title: "Add properties", desc: "Register buildings, addresses, and portfolio details." },
      { title: "Create units", desc: "Define apartments, shops, or offices with rent amounts." },
      { title: "Sign leases", desc: "Assign tenants to vacant units with due dates and deposits." },
      { title: "Track operations", desc: "Record expenses, maintenance, and collect rent on time." },
    ],
  },
  SALON: {
    title: "Salon Dashboard",
    subtitle: "Appointments, services, staff, and revenue at a glance.",
    stats: (d) => [
      { label: "Customers", value: d.customers ?? "—", icon: Users, color: "bg-blue-50 text-blue-600", href: "/dashboard/salon/customers", permission: "customers.view" },
      { label: "Today's Appointments", value: d.todayAppointments ?? "—", icon: Calendar, color: "bg-emerald-50 text-emerald-600", href: "/dashboard/salon/appointments", permission: "appointments.view" },
      { label: "Revenue This Month", value: d.monthlyRevenue ? `PKR ${Number(d.monthlyRevenue).toLocaleString()}` : "—", icon: DollarSign, color: "bg-amber-50 text-amber-600", href: "/dashboard/salon/billing", permission: "billing.view" },
      { label: "Pending Payments", value: d.pendingPayments ?? "—", icon: CreditCard, color: "bg-red-50 text-red-600", href: "/dashboard/salon/billing", permission: "billing.view" },
      { label: "Staff", value: d.staff ?? "—", icon: Contact, color: "bg-purple-50 text-purple-600", href: "/dashboard/salon/staff", permission: "staff.view" },
      { label: "Low Stock Items", value: d.lowStock ?? "—", icon: AlertCircle, color: "bg-orange-50 text-orange-600", href: "/dashboard/salon/products", permission: "inventory.view" },
    ],
    actions: [
      { label: "New Appointment", href: "/dashboard/salon/appointments", icon: Calendar, color: "bg-blue-600", permission: "appointments.create" },
      { label: "Add Customer", href: "/dashboard/salon/customers", icon: Users, color: "bg-emerald-600", permission: "customers.create" },
      { label: "Billing", href: "/dashboard/salon/billing", icon: DollarSign, color: "bg-amber-600", permission: "billing.view" },
      { label: "Staff", href: "/dashboard/salon/staff", icon: Contact, color: "bg-purple-600", permission: "staff.view" },
      { label: "Expenses", href: "/dashboard/salon/expenses", icon: CreditCard, color: "bg-rose-600", permission: "expenses.view" },
      { label: "Reports", href: "/dashboard/salon/reports", icon: BarChart3, color: "bg-cyan-600", permission: "analytics.view" },
    ],
    gettingStarted: [
      { title: "Add your services", desc: "Build a service catalogue with prices and durations." },
      { title: "Register your team", desc: "Add stylists and staff with salaries and commissions." },
      { title: "Book appointments", desc: "Schedule customers across your staff and services." },
      { title: "Track billing & payroll", desc: "Record payments, expenses, and monthly salaries." },
    ],
  },
};

export default function DashboardPage() {
  const { can } = usePermissions();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [gymData, setGymData] = useState<GymData | null>(null);
  const [salonData, setSalonData] = useState<SalonData | null>(null);
  const [clinicData, setClinicData] = useState<ClinicData | null>(null);
  const [schoolData, setSchoolData] = useState<SchoolData | null>(null);
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
        // The dashboard payload already embeds revenue + low-attendance; only the
        // attendance trend needs a second call.
        const [dashRes, attendanceRes] = await Promise.all([
          fetch("/api/school/analytics/dashboard", { credentials: "include" }).then((r) => r.json()).catch(() => null),
          fetch("/api/school/analytics/attendance-trend?days=30", { credentials: "include" }).then((r) => r.json()).catch(() => null),
        ]);
        const dash = dashRes || {};
        setSchoolData({
          revenue: dash.revenue || undefined,
          attendance: attendanceRes || undefined,
          lowAttendance: dash.lowAttendance || undefined,
        });
        setStats({
          students: dash.students?.total || 0,
          classes: dash.classes || 0,
          attendance: dash.attendanceToday?.marked || 0,
          fees: dash.fees?.collected || 0,
        });
      } else if (industry === "CLINIC") {
        // The dashboard payload already embeds revenue + top doctors.
        const dashRes = await fetch("/api/clinic/analytics/dashboard", { credentials: "include" }).then(r => r.json()).catch(() => null);
        const dash = dashRes || {};
        setClinicData({ revenue: dash.revenue || undefined, topDoctors: dash.topDoctors || [] });
        setStats({
          patients: dash.patients?.total || 0,
          todayAppointments: dash.appointments?.today || 0,
          doctors: dash.doctorsCount || 0,
          monthlyRevenue: dash.revenue?.currentMonth || 0,
          pendingPayments: dash.pendingInvoices?.count || 0,
          lowStock: dash.inventory?.lowStockCount || 0,
        });
      } else if (industry === "GYM") {
        // The dashboard payload already embeds revenue, attendance trend, and
        // pending payments — one call replaces four.
        const dashRes = await fetch("/api/gym/analytics/dashboard", { credentials: "include" }).then(r => r.json()).catch(() => null);
        setGymData({
          dashboard: dashRes,
          revenue: dashRes?.revenue,
          attendance: dashRes?.attendanceTrend,
          pending: dashRes?.pendingPayments,
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
      } else if (industry === "SALON") {
        const response = await fetch("/api/salon/analytics/dashboard", { credentials: "include" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load salon dashboard");
        setSalonData(data);
        setStats({
          customers: data.customers?.total || 0,
          todayAppointments: data.appointments?.today || 0,
          monthlyRevenue: data.revenue?.currentMonth || 0,
          pendingPayments: data.pendingPayments?.count || 0,
          staff: data.staffCount || 0,
          lowStock: data.inventory?.lowStockCount || 0,
        });
      } else if (industry === "RESTAURANT") {
        const dashboard = await fetch("/api/restaurant/analytics/dashboard").then((r) => r.json());
        const data = dashboard.data || {};
        setStats({
          openOrders: data.orders?.open || 0,
          tables: data.tables?.available || 0,
          menuItems: data.menuCount || 0,
          monthlyRevenue: data.revenue?.currentMonth || 0,
          lowStock: data.inventory?.lowStockCount || 0,
          customers: data.customers?.total || 0,
          staff: data.staffCount || 0,
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

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Loading...</div>;
  }
  const industry = userData?.tenant?.industry || "SCHOOL";
  const config = industryConfig[industry] || industryConfig.SCHOOL;
  const statCards = config.stats(stats).filter((stat) => can(stat.permission));
  const quickActions = config.actions.filter((action) => can(action.permission));
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

      <DashboardCharts industry={industry} gymData={gymData} salonData={salonData} clinicData={clinicData} schoolData={schoolData} />

      <InsightsCard days={30} />

      {/* Quick Actions */}
      <div className={`grid gap-4 mb-8 ${isGym ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-4"}`}>        {quickActions.map((action) => (          <Link
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
