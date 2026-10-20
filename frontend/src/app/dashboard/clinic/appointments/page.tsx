"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { usePermissions } from "@/lib/permissions";

interface Ref { id: string; name: string; patientNo?: string; specialization?: string }
interface Appointment {
  id: string;
  patientId?: Ref;
  doctorId?: Ref;
  date: string;
  time?: string;
  duration?: number;
  reason?: string;
  fee?: number;
  status: string;
  paymentStatus?: string;
  notes?: string;
}

const STATUSES = ["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"];
const empty = { patientId: "", doctorId: "", date: new Date().toISOString().slice(0, 10), time: "10:00", duration: "30", reason: "", fee: "", status: "SCHEDULED", notes: "" };

export default function ClinicAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Ref[]>([]);
  const [doctors, setDoctors] = useState<Ref[]>([]);
  const [form, setForm] = useState(empty);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const { can } = usePermissions();

  const load = async () => {
    try {
      const [appointmentsResponse, patientsResponse, doctorsResponse] = await Promise.all([
        fetch("/api/clinic/appointments?limit=100", { credentials: "include" }),
        fetch("/api/clinic/patients?limit=100", { credentials: "include" }),
        fetch("/api/clinic/doctors", { credentials: "include" }),
      ]);
      const [appointmentsData, patientsData, doctorsData] = await Promise.all([
        appointmentsResponse.json(), patientsResponse.json(), doctorsResponse.json(),
      ]);
      if (!appointmentsResponse.ok) throw new Error(appointmentsData.error || "Unable to load appointments");
      setAppointments(appointmentsData.appointments || []);
      setPatients(patientsData.patients || []);
      setDoctors(doctorsData.doctors || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to load appointments");
    }
  };

  useEffect(() => { void load(); }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!can("appointments.create")) {
      setError("You don't have permission to create appointments");
      return;
    }
    setError("");
    try {
      const response = await fetch("/api/clinic/appointments", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: form.patientId,
          doctorId: form.doctorId,
          date: form.date,
          time: form.time || undefined,
          duration: Number(form.duration || 0),
          reason: form.reason || undefined,
          fee: form.fee === "" ? undefined : Number(form.fee),
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
      setError("You don't have permission to change appointment status");
      return;
    }
    const response = await fetch(`/api/clinic/appointments/${appointment.id}`, {
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

  const statusColor = (status: string) =>
    status === "COMPLETED" ? "bg-green-100 text-green-700"
      : status === "CANCELLED" || status === "NO_SHOW" ? "bg-red-100 text-red-700"
        : status === "CONFIRMED" || status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700"
          : "bg-amber-100 text-amber-700";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Appointments</h2>
          <p className="text-slate-500 text-sm">Book, track, and complete patient appointments.</p>
        </div>
        {can("appointments.create") && (
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm cursor-pointer">
            <Plus size={16} /> New Appointment
          </button>
        )}
      </div>

      {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Date</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Time</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Patient</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Doctor</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Reason</th>
              <th className="text-right px-4 py-3 text-xs uppercase text-slate-500">Fee</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">No appointments yet.</td></tr>
            ) : appointments.map((appointment) => (
              <tr key={appointment.id} className="border-b border-slate-100">
                <td className="px-4 py-3 text-sm text-slate-600">{new Date(appointment.date).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{appointment.time || "—"}</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-800">{appointment.patientId?.name || "—"}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{appointment.doctorId?.name || "—"}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{appointment.reason || "—"}</td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-slate-800">PKR {Number(appointment.fee || 0).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <select value={appointment.status} onChange={(e) => setStatus(appointment, e.target.value)} className={`text-xs font-semibold rounded-full px-2 py-1 border-none cursor-pointer ${statusColor(appointment.status)}`}>
                    {STATUSES.map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}
                  </select>
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
              <select required value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="">Select patient</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.name} {p.patientNo ? `(${p.patientNo})` : ""}</option>)}
              </select>
              <select required value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="">Select doctor</option>
                {doctors.map((d) => <option key={d.id} value={d.id}>{d.name} {d.specialization ? `· ${d.specialization}` : ""}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input type="number" placeholder="Duration (min)" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input type="number" placeholder="Fee (auto if blank)" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
              <input placeholder="Reason (optional)" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
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
