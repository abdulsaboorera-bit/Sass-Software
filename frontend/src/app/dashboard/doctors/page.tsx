"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  phone: string;
  email: string | null;
  qualification: string | null;
  experience: number | null;
  fee: string;
  department: { id: string; name: string } | null;
}

const emptyForm = { name: "", specialization: "", phone: "", email: "", qualification: "", experience: "", fee: "" };

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchDoctors = () => {
    fetch("/api/clinic/doctors", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data.doctors) setDoctors(data.doctors); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDoctors(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (d: Doctor) => {
    setEditing(d);
    setForm({
      name: d.name,
      specialization: d.specialization,
      phone: d.phone,
      email: d.email || "",
      qualification: d.qualification || "",
      experience: d.experience != null ? String(d.experience) : "",
      fee: String(d.fee),
    });
    setError("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        specialization: form.specialization,
        phone: form.phone,
        fee: parseFloat(form.fee),
      };
      if (form.email) payload.email = form.email;
      if (form.qualification) payload.qualification = form.qualification;
      if (form.experience) payload.experience = parseInt(form.experience);

      const url = editing ? `/api/clinic/doctors` : "/api/clinic/doctors";
      const method = editing ? "PATCH" : "POST";
      if (editing) (payload as Record<string, unknown>).id = editing.id;

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setModalOpen(false);
      fetchDoctors();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deactivate this doctor?")) return;
    try {
      const res = await fetch(`/api/clinic/doctors?id=${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete");
      fetchDoctors();
    } catch {
      alert("Failed to delete doctor");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Doctors</h2>
          <p className="text-slate-500 text-sm">{doctors.length} active doctors</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm cursor-pointer">
          <Plus size={16} /> New Doctor
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 text-slate-400 text-sm">Loading...</div>
        ) : doctors.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400 text-sm">No doctors configured.</div>
        ) : doctors.map((d) => (
          <div key={d.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
                <span className="text-blue-600 font-bold text-sm">{d.name.split(" ").map((n) => n[0]).join("")}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer">
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-red-600 transition-colors cursor-pointer">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <h3 className="text-slate-900 font-bold text-sm">{d.name}</h3>
            <p className="text-blue-600 text-xs font-medium">{d.specialization}</p>
            {d.department && <p className="text-slate-500 text-xs mt-1">{d.department.name}</p>}
            <p className="text-slate-600 text-xs mt-2">Fee: PKR {Number(d.fee).toLocaleString()}</p>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">{editing ? "Edit Doctor" : "New Doctor"}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"><X size={18} /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Specialization *</label>
                  <input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Fee (PKR) *</label>
                  <input type="number" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phone *</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Qualification</label>
                  <input value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Experience (years)</label>
                  <input type="number" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.specialization || !form.phone || !form.fee} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer">{saving ? "Saving..." : editing ? "Update" : "Create"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
