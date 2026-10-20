"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { usePermissions } from "@/lib/permissions";

interface Staff {
  id: string;
  name: string;
  phone: string;
  role: string;
  specialization?: string;
  salary?: number;
  commissionRate?: number;
  isActive?: boolean;
}

const empty = { name: "", phone: "", role: "", specialization: "", salary: "", commissionRate: "" };

export default function SalonStaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [form, setForm] = useState(empty);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const { can } = usePermissions();

  const load = async () => {
    try {
      const response = await fetch("/api/salon/staff", { credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load staff");
      setStaff(data.staff || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to load staff");
    }
  };

  useEffect(() => { void load(); }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!can("staff.create")) {
      setError("You don't have permission to add staff");
      return;
    }
    setError("");
    try {
      const response = await fetch("/api/salon/staff", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          role: form.role,
          specialization: form.specialization || undefined,
          salary: Number(form.salary || 0),
          commissionRate: Number(form.commissionRate || 0),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save staff member");
      setOpen(false);
      setForm(empty);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to save staff member");
    }
  };

  const archive = async (member: Staff) => {
    if (!can("staff.edit")) {
      setError("You don't have permission to remove staff");
      return;
    }
    if (!confirm(`Remove ${member.name}?`)) return;
    const response = await fetch(`/api/salon/staff/${member.id}`, { method: "DELETE", credentials: "include" });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Unable to remove staff member");
      return;
    }
    await load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Staff</h2>
          <p className="text-slate-500 text-sm">Your stylists and team with salaries and commission rates.</p>
        </div>
        {can("staff.create") && (
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm cursor-pointer">
            <Plus size={16} /> Add Staff
          </button>
        )}
      </div>

      {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {staff.length === 0 ? (
          <p className="text-slate-400 text-sm">No staff yet.</p>
        ) : staff.map((member) => (
          <div key={member.id} className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900">{member.name}</h3>
                <p className="text-xs text-slate-500">{member.role}{member.specialization ? ` · ${member.specialization}` : ""}</p>
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-purple-50 text-purple-700">{member.commissionRate || 0}% comm.</span>
            </div>
            <p className="text-sm text-slate-600 mt-3">{member.phone}</p>
            <p className="text-sm font-semibold text-slate-800 mt-1">PKR {Number(member.salary || 0).toLocaleString()} / month</p>
            {can("staff.edit") && (
              <button onClick={() => archive(member)} className="mt-4 text-xs text-red-600 border-none bg-transparent cursor-pointer">Remove staff</button>
            )}
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4">
          <form onSubmit={save} className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Add Staff</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 border-none bg-transparent cursor-pointer"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <input required placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <input required placeholder="Role (e.g. Stylist, Beautician)" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <input placeholder="Specialization (optional)" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Monthly salary" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input type="number" placeholder="Commission %" value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
            </div>
            <button type="submit" className="mt-5 w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl text-sm cursor-pointer">Save Staff</button>
          </form>
        </div>
      )}
    </div>
  );
}
