"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";

interface Department { id: string; name: string; location?: string }
interface Doctor {
  id: string;
  name: string;
  specialization: string;
  phone: string;
  email?: string;
  qualification?: string;
  experience?: number;
  fee: number;
  salary?: number;
  commissionRate?: number;
  departmentId?: Department | string | null;
  availableTime?: string;
  isActive?: boolean;
}

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const empty = { name: "", specialization: "", phone: "", email: "", qualification: "", experience: "", fee: "", salary: "", commissionRate: "", departmentId: "", availableTime: "", availableDays: [] as string[] };

export default function ClinicDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState(empty);
  const [deptName, setDeptName] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [doctorsResponse, departmentsResponse] = await Promise.all([
        fetch("/api/clinic/doctors", { credentials: "include" }),
        fetch("/api/clinic/departments", { credentials: "include" }),
      ]);
      const doctorsData = await doctorsResponse.json();
      const departmentsData = await departmentsResponse.json();
      if (!doctorsResponse.ok) throw new Error(doctorsData.error || "Unable to load doctors");
      setDoctors(doctorsData.doctors || []);
      setDepartments(departmentsData.departments || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to load doctors");
    }
  };

  useEffect(() => { void load(); }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      const response = await fetch("/api/clinic/doctors", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          specialization: form.specialization,
          phone: form.phone,
          email: form.email || undefined,
          qualification: form.qualification || undefined,
          experience: Number(form.experience || 0),
          fee: Number(form.fee || 0),
          salary: Number(form.salary || 0),
          commissionRate: Number(form.commissionRate || 0),
          departmentId: form.departmentId || undefined,
          availableTime: form.availableTime || undefined,
          availableDays: form.availableDays,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save doctor");
      setOpen(false);
      setForm(empty);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to save doctor");
    }
  };

  const addDepartment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!deptName.trim()) return;
    setError("");
    try {
      const response = await fetch("/api/clinic/departments", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: deptName.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to add department");
      setDeptName("");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to add department");
    }
  };

  const archive = async (doctor: Doctor) => {
    if (!confirm(`Remove ${doctor.name}?`)) return;
    const response = await fetch(`/api/clinic/doctors/${doctor.id}`, { method: "DELETE", credentials: "include" });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Unable to remove doctor");
      return;
    }
    await load();
  };

  const toggleDay = (day: string) => {
    setForm((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(day) ? prev.availableDays.filter((d) => d !== day) : [...prev.availableDays, day],
    }));
  };

  const deptName2 = (doctor: Doctor) => {
    if (doctor.departmentId && typeof doctor.departmentId === "object") return doctor.departmentId.name;
    const match = departments.find((d) => d.id === doctor.departmentId);
    return match?.name || "—";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Doctors</h2>
          <p className="text-slate-500 text-sm">Your medical team with specialties, fees, and schedules.</p>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm cursor-pointer">
          <Plus size={16} /> Add Doctor
        </button>
      </div>

      {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <h3 className="font-bold text-slate-900 text-sm mb-3">Departments</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {departments.length === 0 ? <span className="text-slate-400 text-sm">No departments yet.</span> : departments.map((d) => (
            <span key={d.id} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">{d.name}</span>
          ))}
        </div>
        <form onSubmit={addDepartment} className="flex gap-2 max-w-md">
          <input placeholder="New department name" value={deptName} onChange={(e) => setDeptName(e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          <button type="submit" className="bg-slate-900 text-white font-semibold px-4 py-2 rounded-lg text-sm cursor-pointer">Add</button>
        </form>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {doctors.length === 0 ? (
          <p className="text-slate-400 text-sm">No doctors yet.</p>
        ) : doctors.map((doctor) => (
          <div key={doctor.id} className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900">{doctor.name}</h3>
                <p className="text-xs text-slate-500">{doctor.specialization} · {deptName2(doctor)}</p>
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-purple-50 text-purple-700">{doctor.commissionRate || 0}% comm.</span>
            </div>
            <p className="text-sm text-slate-600 mt-3">{doctor.phone}</p>
            <p className="text-sm font-semibold text-slate-800 mt-1">Fee PKR {Number(doctor.fee || 0).toLocaleString()}</p>
            <button onClick={() => archive(doctor)} className="mt-4 text-xs text-red-600 border-none bg-transparent cursor-pointer">Remove doctor</button>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4 overflow-y-auto">
          <form onSubmit={save} className="bg-white rounded-2xl w-full max-w-lg p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Add Doctor</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 border-none bg-transparent cursor-pointer"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <input required placeholder="Specialization" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input placeholder="Email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input placeholder="Qualification" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input type="number" placeholder="Experience (yrs)" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input required type="number" placeholder="Consultation fee" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input type="number" placeholder="Monthly salary" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input type="number" placeholder="Commission %" value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  <option value="">No department</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <input placeholder="Available time (e.g. 09:00-13:00)" value={form.availableTime} onChange={(e) => setForm({ ...form, availableTime: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">Available days</p>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => (
                    <button type="button" key={day} onClick={() => toggleDay(day)} className={`text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer border ${form.availableDays.includes(day) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200"}`}>{day}</button>
                  ))}
                </div>
              </div>
            </div>
            <button type="submit" className="mt-5 w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl text-sm cursor-pointer">Save Doctor</button>
          </form>
        </div>
      )}
    </div>
  );
}
