"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";

interface Patient {
  id: string;
  patientNo: string;
  name: string;
  phone: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  cnic?: string;
  isActive?: boolean;
}

const empty = { name: "", phone: "", email: "", gender: "FEMALE", dateOfBirth: "", bloodGroup: "", cnic: "", address: "", allergies: "", medicalHistory: "", emergencyContact: "", notes: "" };

export default function ClinicPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [form, setForm] = useState(empty);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/clinic/patients?limit=100", { credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load patients");
      setPatients(data.patients || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to load patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      const response = await fetch("/api/clinic/patients", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email || undefined,
          gender: form.gender || undefined,
          dateOfBirth: form.dateOfBirth || undefined,
          bloodGroup: form.bloodGroup || undefined,
          cnic: form.cnic || undefined,
          address: form.address || undefined,
          allergies: form.allergies || undefined,
          medicalHistory: form.medicalHistory || undefined,
          emergencyContact: form.emergencyContact || undefined,
          notes: form.notes || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save patient");
      setOpen(false);
      setForm(empty);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to save patient");
    }
  };

  const archive = async (patient: Patient) => {
    if (!confirm(`Archive ${patient.name}?`)) return;
    const response = await fetch(`/api/clinic/patients/${patient.id}`, { method: "DELETE", credentials: "include" });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Unable to archive patient");
      return;
    }
    await load();
  };

  const visible = patients.filter((p) =>
    !search || [p.name, p.patientNo, p.phone, p.cnic].some((v) => (v || "").toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Patients</h2>
          <p className="text-slate-500 text-sm">Your patient register with contact and medical details.</p>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm cursor-pointer">
          <Plus size={16} /> Register Patient
        </button>
      </div>

      {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      <input
        placeholder="Search by name, number, phone or CNIC"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full max-w-sm px-3 py-2 border border-slate-200 rounded-lg text-sm"
      />

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">No</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Name</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Phone</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Gender</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Blood</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">CNIC</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">Loading patients...</td></tr>
            ) : visible.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">No patients yet.</td></tr>
            ) : visible.map((patient) => (
              <tr key={patient.id} className="border-b border-slate-100">
                <td className="px-4 py-3 text-sm text-slate-500">{patient.patientNo}</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-800">{patient.name}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{patient.phone}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{patient.gender || "—"}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{patient.bloodGroup || "—"}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{patient.cnic || "—"}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => archive(patient)} className="text-xs text-red-600 border-none bg-transparent cursor-pointer">Archive</button>
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
              <h3 className="font-bold text-slate-900">Register Patient</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 border-none bg-transparent cursor-pointer"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input placeholder="CNIC" value={form.cnic} onChange={(e) => setForm({ ...form, cnic: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input placeholder="Email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  <option value="FEMALE">Female</option>
                  <option value="MALE">Male</option>
                  <option value="OTHER">Other</option>
                </select>
                <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input placeholder="Blood group" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
              <input placeholder="Address (optional)" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <input placeholder="Emergency contact (optional)" value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <input placeholder="Allergies (optional)" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <textarea placeholder="Medical history (optional)" value={form.medicalHistory} onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" rows={2} />
            </div>
            <button type="submit" className="mt-5 w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl text-sm cursor-pointer">Save Patient</button>
          </form>
        </div>
      )}
    </div>
  );
}
