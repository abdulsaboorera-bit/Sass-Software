"use client";

import { useEffect, useState } from "react";
import { Search, Users, UserCog, ChevronDown, ChevronUp, MapPin, Phone, Mail, Cake, ShieldAlert } from "lucide-react";

type Tab = "members" | "staff";

export default function DirectoryPage() {
  const [tab, setTab] = useState<Tab>("members");
  const [search, setSearch] = useState("");

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Directory</h2>
          <p className="text-slate-500 text-sm">Full member &amp; staff details in one place.</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, email..."
            className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64"
          />
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1 w-fit">
        <button onClick={() => setTab("members")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all border-none cursor-pointer ${
            tab === "members" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 bg-transparent"
          }`}>
          <Users size={14} /> Members
        </button>
        <button onClick={() => setTab("staff")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all border-none cursor-pointer ${
            tab === "staff" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 bg-transparent"
          }`}>
          <UserCog size={14} /> Staff
        </button>
      </div>

      {tab === "members" ? <MemberDirectory search={search} /> : <StaffDirectory search={search} />}
    </div>
  );
}

const FEE_COLORS: Record<string, string> = {
  PAID: "bg-green-100 text-green-700",
  PENDING: "bg-amber-100 text-amber-700",
  PARTIAL: "bg-orange-100 text-orange-700",
  OVERDUE: "bg-red-100 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

interface DirMember {
  id: string;
  memberNo: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  emergencyContact?: string;
  effectiveStatus?: string;
  status: string;
  startDate: string;
  endDate: string;
  plan?: { name: string; price: string; duration: number };
  trainer?: { name: string } | null;
  feeStatus?: string | null;
}

function MemberDirectory({ search }: { search: string }) {
  const [members, setMembers] = useState<DirMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/gym/members?limit=500", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data.members) setMembers(data.members); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return m.name.toLowerCase().includes(q) || m.phone.includes(q) || m.memberNo.toLowerCase().includes(q) || (m.email || "").toLowerCase().includes(q);
  });

  if (loading) return <p className="text-sm text-slate-400 text-center py-12">Loading...</p>;
  if (filtered.length === 0) return <p className="text-sm text-slate-400 text-center py-12">No members found.</p>;

  return (
    <div className="space-y-3">
      {filtered.map((m) => {
        const isOpen = expanded === m.id;
        return (
          <div key={m.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <button onClick={() => setExpanded(isOpen ? null : m.id)}
              className="w-full flex items-center justify-between px-4 py-3 border-none bg-transparent cursor-pointer text-left">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {m.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{m.name}</p>
                  <p className="text-xs text-slate-400 font-mono">{m.memberNo} · {m.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {m.feeStatus && <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${FEE_COLORS[m.feeStatus] || "bg-slate-100 text-slate-500"}`}>{m.feeStatus}</span>}
                {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </div>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 pt-1 border-t border-slate-100 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <Detail icon={Phone} label="Phone" value={m.phone} />
                <Detail icon={Mail} label="Email" value={m.email || "—"} />
                <Detail icon={MapPin} label="Address" value={m.address || "—"} />
                <Detail icon={Cake} label="Date of Birth" value={m.dateOfBirth ? new Date(m.dateOfBirth).toLocaleDateString() : "—"} />
                <Detail label="Gender" value={m.gender || "—"} />
                <Detail icon={ShieldAlert} label="Emergency Contact" value={m.emergencyContact || "—"} />
                <Detail label="Plan" value={m.plan ? `${m.plan.name} — PKR ${Number(m.plan.price).toLocaleString()}` : "—"} />
                <Detail label="Trainer" value={m.trainer?.name || "—"} />
                <Detail label="Status" value={m.effectiveStatus || m.status} />
                <Detail label="Membership Period" value={`${new Date(m.startDate).toLocaleDateString()} → ${new Date(m.endDate).toLocaleDateString()}`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface DirStaff {
  id: string;
  name: string;
  phone: string;
  role?: string | null;
  isActive: boolean;
}

function StaffDirectory({ search }: { search: string }) {
  const [staff, setStaff] = useState<DirStaff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/gym/staff", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data.staff) setStaff(data.staff); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = staff.filter((s) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || s.phone.includes(q) || (s.role || "").toLowerCase().includes(q);
  });

  if (loading) return <p className="text-sm text-slate-400 text-center py-12">Loading...</p>;
  if (filtered.length === 0) return <p className="text-sm text-slate-400 text-center py-12">No staff found.</p>;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="divide-y divide-slate-100">
        {filtered.map((s) => (
          <div key={s.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                {s.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{s.name}</p>
                <p className="text-xs text-slate-400">{s.role || "Staff"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <span>{s.phone}</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${s.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                {s.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Detail({ icon: Icon, label, value }: { icon?: typeof Phone; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      {Icon && <Icon size={14} className="text-slate-400 mt-0.5 shrink-0" />}
      <div>
        <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wide">{label}</p>
        <p className="text-slate-700">{value}</p>
      </div>
    </div>
  );
}
