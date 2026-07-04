"use client";

import { useEffect, useState } from "react";
import { Plus, X, CheckCircle, Clock, Trash2 } from "lucide-react";

interface Appt {
  id: string;
  date: string;
  time: string;
  status: string;
  reason: string | null;
  patient: { id: string; name: string; patientNo: string };
  doctor: { id: string; name: string; specialization: string };
}

interface PatientOption { id: string; name: string; patientNo: string }
interface DoctorOption { id: string; name: string; specialization: string }

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [form, setForm] = useState({ patientId: "", doctorId: "", date: "", time: "", reason: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchAppointments = () => {
    fetch("/api/clinic/appointments?limit=50", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data.appointments) setAppointments(data.appointments); })
      .finally(() => setLoading(false));
  };

  const fetchDropdowns = () => {
    fetch("/api/clinic/patients?limit=200", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data.patients) setPatients(data.patients); });
    fetch("/api/clinic/doctors", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data.doctors) setDoctors(data.doctors); });
  };

  useEffect(() => { fetchAppointments(); fetchDropdowns(); }, []);

  const openCreate = () => {
    setForm({ patientId: "", doctorId: "", date: "", time: "", reason: "" });
    setError("");
    setModalOpen(true);
  };

  const handleCreate = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/clinic/appointments", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to book");
      setModalOpen(false);
      fetchAppointments();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to book");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/clinic/appointments/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      fetchAppointments();
    } catch {
      alert("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this appointment?")) return;
    try {
      const res = await fetch(`/api/clinic/appointments/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete");
      fetchAppointments();
    } catch {
      alert("Failed to delete appointment");
    }
  };

  const statusBadge = (status: string) => {
    const base = "px-2 py-0.5 text-xs font-semibold rounded-full";
    if (status === "COMPLETED") return `${base} bg-green-100 text-green-700`;
    if (status === "CANCELLED") return `${base} bg-red-100 text-red-700`;
    if (status === "CONFIRMED") return `${base} bg-amber-100 text-amber-700`;
    return `${base} bg-blue-100 text-blue-700`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Appointments</h2>
          <p className="text-slate-500 text-sm">Manage patient appointments.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm cursor-pointer">
          <Plus size={16} /> Book Appointment
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Patient</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Doctor</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Date</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Time</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">Loading...</td></tr>
            ) : appointments.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">No appointments.</td></tr>
            ) : appointments.map((a) => (
              <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{a.patient.name}</p>
                  <p className="text-xs text-slate-400">{a.patient.patientNo}</p>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {a.doctor.name}
                  <p className="text-xs text-slate-400">{a.doctor.specialization}</p>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{new Date(a.date).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{a.time}</td>
                <td className="px-4 py-3">
                  <span className={statusBadge(a.status)}>{a.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {a.status === "SCHEDULED" && (
                      <button onClick={() => updateStatus(a.id, "CONFIRMED")} title="Confirm" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer">
                        <CheckCircle size={14} />
                      </button>
                    )}
                    {a.status === "CONFIRMED" && (
                      <button onClick={() => updateStatus(a.id, "COMPLETED")} title="Complete" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-green-600 transition-colors cursor-pointer">
                        <Clock size={14} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(a.id)} title="Delete" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-red-600 transition-colors cursor-pointer">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Book Appointment</h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"><X size={18} /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Patient *</label>
                <select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select patient</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.patientNo})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Doctor *</label>
                <select value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select doctor</option>
                  {doctors.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Date *</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Time *</label>
                  <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Reason</label>
                <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">Cancel</button>
              <button onClick={handleCreate} disabled={saving || !form.patientId || !form.doctorId || !form.date || !form.time} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer">{saving ? "Booking..." : "Book"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
