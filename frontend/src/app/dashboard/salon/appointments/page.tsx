"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { usePermissions } from "@/lib/permissions";

interface Ref { id: string; name: string; customerNo?: string; role?: string; price?: number }
interface Appointment {
  id: string;
  customerId?: Ref;
  staffId?: Ref | null;
  services?: Ref[];
  date: string;
  startTime?: string;
  duration?: number;
  total?: number;
  status: string;
  paymentStatus?: string;
}

const STATUSES = ["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"];
const empty = { customerId: "", staffId: "", serviceIds: [] as string[], date: new Date().toISOString().slice(0, 10), startTime: "10:00", status: "SCHEDULED", notes: "" };

export default function SalonAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Ref[]>([]);
  const [staff, setStaff] = useState<Ref[]>([]);
  const [services, setServices] = useState<Ref[]>([]);
  const [form, setForm] = useState(empty);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const { can } = usePermissions();

  const load = async () => {
    try {
      const [appointmentsResponse, customersResponse, staffResponse, servicesResponse] = await Promise.all([
        fetch("/api/salon/appointments?limit=100", { credentials: "include" }),
        fetch("/api/salon/customers?limit=100", { credentials: "include" }),
        fetch("/api/salon/staff", { credentials: "include" }),
        fetch("/api/salon/services?limit=100", { credentials: "include" }),
      ]);
      const [appointmentsData, customersData, staffData, servicesData] = await Promise.all([
        appointmentsResponse.json(), customersResponse.json(), staffResponse.json(), servicesResponse.json(),
      ]);
      if (!appointmentsResponse.ok) throw new Error(appointmentsData.error || "Unable to load appointments");
      setAppointments(appointmentsData.appointments || []);
      setCustomers(customersData.customers || []);
      setStaff(staffData.staff || []);
      setServices(servicesData.services || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to load appointments");
    }
  };

  useEffect(() => { void load(); }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!can("appointments.create")) {
      setError("You don't have permission to book appointments");
      return;
    }
    setError("");
    if (form.serviceIds.length === 0) {
      setError("Select at least one service");
      return;
    }
    try {
      const response = await fetch("/api/salon/appointments", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: form.customerId,
          staffId: form.staffId || undefined,
          serviceIds: form.serviceIds,
          date: form.date,
          startTime: form.startTime,
          status: form.status,
          notes: form.notes || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save appointment");
      setOpen(false);
      setForm(empty);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to save appointment");
    }
  };

  const setStatus = async (appointment: Appointment, status: string) => {
    if (!can("appointments.edit")) {
      setError("You don't have permission to update appointments");
      return;
    }
    const response = await fetch(`/api/salon/appointments/${appointment.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Unable to update status");
      return;
    }
    await load();
  };

  const toggleService = (id: string) => {
    setForm((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(id) ? prev.serviceIds.filter((s) => s !== id) : [...prev.serviceIds, id],
    }));
  };

  const statusColor = (status: string) =>
    status === "COMPLETED" ? "bg-green-100 text-green-700"
      : status === "CANCELLED" || status === "NO_SHOW" ? "bg-red-100 text-red-700"
        : status === "CONFIRMED" ? "bg-blue-100 text-blue-700"
          : "bg-amber-100 text-amber-700";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Appointments</h2>
          <p className="text-slate-500 text-sm">Book, track, and complete client appointments.</p>
        </div>
        {can("appointments.create") && (
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm cursor-pointer">
            <Plus size={16} /> New Appointment
          </button>
        )}
      </div>

      {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Date</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Time</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Customer</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Staff</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Services</th>
              <th className="text-right px-4 py-3 text-xs uppercase text-slate-500">Total</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">No appointments yet.</td></tr>
            ) : appointments.map((appointment) => (
              <tr key={appointment.id} className="border-b border-slate-100">
                <td className="px-4 py-3 text-sm text-slate-600">{new Date(appointment.date).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{appointment.startTime || "—"}</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-800">{appointment.customerId?.name || "—"}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{appointment.staffId?.name || "—"}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{appointment.services?.map((s) => s.name).join(", ") || "—"}</td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-slate-800">PKR {Number(appointment.total || 0).toLocaleString()}</td>
                <td className="px-4 py-3">
                  {can("appointments.edit") ? (
                    <select value={appointment.status} onChange={(e) => setStatus(appointment, e.target.value)} className={`text-xs font-semibold rounded-full px-2 py-1 border-none cursor-pointer ${statusColor(appointment.status)}`}>
                      {STATUSES.map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}
                    </select>
                  ) : (
                    <span className={`text-xs font-semibold rounded-full px-2 py-1 ${statusColor(appointment.status)}`}>{appointment.status.replace("_", " ")}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4 overflow-y-auto">
          <form onSubmit={save} className="bg-white rounded-2xl w-full max-w-lg p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">New Appointment</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 border-none bg-transparent cursor-pointer"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <select required value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="">Select customer</option>
                {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} {customer.customerNo ? `(${customer.customerNo})` : ""}</option>)}
              </select>
              <select value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="">Unassigned</option>
                {staff.map((member) => <option key={member.id} value={member.id}>{member.name} {member.role ? `· ${member.role}` : ""}</option>)}
              </select>
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">Services</p>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-3">
                  {services.map((service) => (
                    <label key={service.id} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                      <input type="checkbox" checked={form.serviceIds.includes(service.id)} onChange={() => toggleService(service.id)} />
                      <span className="truncate">{service.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input required type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                {STATUSES.map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}
              </select>
              <textarea placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" rows={2} />
            </div>
            <button type="submit" className="mt-5 w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl text-sm cursor-pointer">Save Appointment</button>
          </form>
        </div>
      )}
    </div>
  );
}
