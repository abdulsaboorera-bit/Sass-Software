"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, CornerDownLeft } from "lucide-react";

interface SearchItem {
  id: string;
  title: string;
  subtitle?: string;
}
interface SearchGroup {
  key: string;
  label: string;
  items: SearchItem[];
}

// Maps a dataset key to the dashboard route that lists it, so a result click
// opens the right module.
const ROUTES: Record<string, string> = {
  "gym.members": "/dashboard/members",
  "gym.payments": "/dashboard/billing",
  "gym.plans": "/dashboard/plans",
  "gym.trainers": "/dashboard/trainers",
  "gym.expenses": "/dashboard/expenses",
  "school.students": "/dashboard/students",
  "school.teachers": "/dashboard/school/teachers",
  "school.admissions": "/dashboard/school/admissions",
  "school.fees": "/dashboard/fees",
  "school.expenses": "/dashboard/school/expenses",
  "school.library-books": "/dashboard/school/library",
  "clinic.patients": "/dashboard/clinic/patients",
  "clinic.doctors": "/dashboard/clinic/doctors",
  "clinic.appointments": "/dashboard/clinic/appointments",
  "clinic.prescriptions": "/dashboard/clinic/prescriptions",
  "clinic.lab-tests": "/dashboard/clinic/lab",
  "clinic.expenses": "/dashboard/clinic/expenses",
  "restaurant.customers": "/dashboard/restaurant/customers",
  "restaurant.menu-items": "/dashboard/restaurant/menu",
  "restaurant.reservations": "/dashboard/restaurant/reservations",
  "restaurant.staff": "/dashboard/restaurant/staff",
  "restaurant.inventory": "/dashboard/restaurant/inventory",
  "restaurant.expenses": "/dashboard/restaurant/expenses",
  "bookshop.books": "/dashboard/books",
  "bookshop.customers": "/dashboard/customers",
  "bookshop.sales": "/dashboard/sales",
  "car-rental.cars": "/dashboard/car-rental/cars",
  "car-rental.customers": "/dashboard/car-rental/customers",
  "car-rental.rentals": "/dashboard/car-rental/rentals",
  "real-estate.properties": "/dashboard/real-estate/properties",
  "real-estate.units": "/dashboard/real-estate/units",
  "real-estate.tenants": "/dashboard/real-estate/tenants",
  "real-estate.leases": "/dashboard/real-estate/leases",
  "real-estate.payments": "/dashboard/real-estate/payments",
  "real-estate.maintenance": "/dashboard/real-estate/maintenance",
  "real-estate.expenses": "/dashboard/real-estate/expenses",
  "salon.customers": "/dashboard/salon/customers",
  "salon.services": "/dashboard/salon/services",
  "salon.staff": "/dashboard/salon/staff",
  "salon.appointments": "/dashboard/salon/appointments",
  "salon.products": "/dashboard/salon/products",
  "salon.expenses": "/dashboard/salon/expenses",
};

export default function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setGroups([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { credentials: "include" });
      const data = res.ok ? await res.json() : { groups: [] };
      setGroups(data.groups || []);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), 250);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  const go = (key: string) => {
    const route = ROUTES[key];
    if (route) {
      setOpen(false);
      setQuery("");
      router.push(route);
    }
  };

  const hasResults = groups.some((g) => g.items.length > 0);

  return (
    <div className="relative hidden md:block" ref={boxRef}>
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        ref={inputRef}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        placeholder="Search…"
        className="w-56 lg:w-64 pl-9 pr-12 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
      />
      <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-0.5 text-[10px] text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">
        <span className="text-xs">⌘</span>K
      </kbd>

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <Loader2 size={18} className="animate-spin" />
              </div>
            ) : !hasResults ? (
              <p className="py-8 text-center text-sm text-slate-400">No matches for “{query}”.</p>
            ) : (
              groups
                .filter((g) => g.items.length > 0)
                .map((g) => (
                  <div key={g.key} className="py-1">
                    <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">{g.label}</p>
                    {g.items.map((item) => (
                      <button
                        key={`${g.key}-${item.id}`}
                        onClick={() => go(g.key)}
                        className="w-full flex items-center justify-between gap-2 px-4 py-2 hover:bg-slate-50 text-left bg-transparent border-none cursor-pointer"
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-slate-900 truncate">{item.title}</span>
                          {item.subtitle && <span className="block text-xs text-slate-400 truncate">{item.subtitle}</span>}
                        </span>
                        <CornerDownLeft size={13} className="shrink-0 text-slate-300" />
                      </button>
                    ))}
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
