"use client";

import { useEffect, useState } from "react";
import { Plus, X, Trash2 } from "lucide-react";

interface Ref { id: string; name: string; patientNo?: string; specialization?: string }
interface Medication { name: string; dosage?: string; frequency?: string; duration?: string; instructions?: string }
interface Prescription {
  id: string;
  patientId?: Ref;
  doctorId?: Ref;
  diagnosis: string;
  medications?: Medication[];
  advice?: string;
  status: string;
  createdAt?: string;
}

const STATUSES = ["ISSUED", "DISPENSED", "CANCELLED"];
const emptyMed: Medication = { name: "", dosage: "", frequency: "", duration: "", instructions: "" };
const empty = { patientId: "", doctorId: "", diagnosis: "", advice: "", followUpDate: "", status: "ISSUED", medications: [{ ...emptyMed }] as Medication[] };

export default function ClinicPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Ref[]>([]);
  const [doctors, setDoctors] = useState<Ref[]>([]);
  const [form, setForm] = useState(empty);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [rxResponse, patientsResponse, doctorsResponse] = await Promise.all([
        fetch("/api/clinic/prescriptions?limit=100", { credentials: "include" }),
        fetch("/api/clinic/patients?limit=100", { credentials: "include" }),
        fetch("/api/clinic/doctors", { credentials: "include" }),
      ]);
      const [rxData, patientsData, doctorsData] = await Promise.all([
        rxResponse.json(), patientsResponse.json(), doctorsResponse.json(),
      ]);
      if (!rxResponse.ok) throw new Error(rxData.error || "Unable to load prescriptions");
      setPrescriptions(rxData.prescriptions || []);
      setPatients(patientsData.patients || []);
      setDoctors(doctorsData.doctors || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to load prescriptions");
    }
  };

  useEffect(() => { void load(); }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const medications = form.medications.filter((m) => m.name.trim());
    if (medications.length === 0) {
      setError("Add at least one medication");
      return;
    }
    try {
      const response = await fetch("/api/clinic/prescriptions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: form.patientId,
          doctorId: form.doctorId,
          diagnosis: form.diagnosis,
          medications,
          advice: form.advice || undefined,
          followUpDate: form.followUpDate || undefined,
          status: form.status,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save prescription");
      setOpen(false);
      setForm(empty);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to save prescription");
    }
  };

  const setStatus = async (rx: Prescription, status: string) => {
    const response = await fetch(`/api/clinic/prescriptions/${rx.id}`, {
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

  const updateMed = (index: number, key: keyof Medication, value: string) => {
    setForm((prev) => {
      const medications = prev.medications.map((m, i) => (i === index ? { ...m, [key]: value } : m));
      return { ...prev, medications };
    });
  };

  const addMed = () => setForm((prev) => ({ ...prev, medications: [...prev.medications, { ...emptyMed }] }));
  const removeMed = (index: number) => setForm((prev) => ({ ...prev, medications: prev.medications.filter((_, i) => i !== index) }));

  const statusColor = (status: string) =>
    status === "DISPENSED" ? "bg-green-100 text-green-700"
      : status === "CANCELLED" ? "bg-red-100 text-red-700"
        : "bg-amber-100 text-amber-700";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Prescriptions</h2>
          <p className="text-slate-500 text-sm">Diagnoses and medication plans issued to patients.</p>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm cursor-pointer">
          <Plus size={16} /> New Prescription
        </button>
      </div>

      {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Date</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Patient</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Doctor</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Diagnosis</th>
              <th className="text-right px-4 py-3 text-xs uppercase text-slate-500">Meds</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {prescriptions.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">No prescriptions yet.</td></tr>
            ) : prescriptions.map((rx) => (
              <tr key={rx.id} className="border-b border-slate-100">
                <td className="px-4 py-3 text-sm text-slate-600">{rx.createdAt ? new Date(rx.createdAt).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-800">{rx.patientId?.name || "—"}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{rx.doctorId?.name || "—"}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{rx.diagnosis}</td>
                <td className="px-4 py-3 text-sm text-right text-slate-600">{rx.medications?.length || 0}</td>
                <td className="px-4 py-3">
                  <select value={rx.status} onChange={(e) => setStatus(rx, e.target.value)} className={`text-xs font-semibold rounded-full px-2 py-1 border-none cursor-pointer ${statusColor(rx.status)}`}>
                    {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4 overflow-y-auto">
          <form onSubmit={save} className="bg-white rounded-2xl w-full max-w-2xl p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">New Prescription</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 border-none bg-transparent cursor-pointer"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <select required value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  <option value="">Select patient</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.name} {p.patientNo ? `(${p.patientNo})` : ""}</option>)}
                </select>
                <select required value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  <option value="">Select doctor</option>
                  {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <input required placeholder="Diagnosis" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-600">Medications</p>
                  <button type="button" onClick={addMed} className="text-xs text-blue-600 border-none bg-transparent cursor-pointer">+ Add medication</button>
                </div>
                <div className="space-y-2">
                  {form.medications.map((med, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <input placeholder="Medicine" value={med.name} onChange={(e) => updateMed(index, "name", e.target.value)} className="col-span-4 px-2 py-1.5 border border-slate-200 rounded-lg text-sm" />
                      <input placeholder="Dosage" value={med.dosage} onChange={(e) => updateMed(index, "dosage", e.target.value)} className="col-span-2 px-2 py-1.5 border border-slate-200 rounded-lg text-sm" />
                      <input placeholder="Frequency" value={med.frequency} onChange={(e) => updateMed(index, "frequency", e.target.value)} className="col-span-3 px-2 py-1.5 border border-slate-200 rounded-lg text-sm" />
                      <input placeholder="Duration" value={med.duration} onChange={(e) => updateMed(index, "duration", e.target.value)} className="col-span-2 px-2 py-1.5 border border-slate-200 rounded-lg text-sm" />
                      <button type="button" onClick={() => removeMed(index)} className="col-span-1 text-slate-400 hover:text-red-600 border-none bg-transparent cursor-pointer grid place-items-center"><Trash2 size={15} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
              <textarea placeholder="Advice (optional)" value={form.advice} onChange={(e) => setForm({ ...form, advice: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" rows={2} />
            </div>
            <button type="submit" className="mt-5 w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl text-sm cursor-pointer">Save Prescription</button>
          </form>
        </div>
      )}
    </div>
  );
}
