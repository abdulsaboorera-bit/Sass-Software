"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";

interface SchoolClass {
  id: string;
  name: string;
  section: string;
  feeAmount: string | null;
  _count: { students: number };
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", section: "", feeAmount: "" });
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState<SchoolClass | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/school/classes", { credentials: "include" });
      const data = await res.json();
      if (data.classes) setClasses(data.classes);
    } catch (err) {
      console.error("Failed to fetch classes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClasses(); }, []);

  const resetForm = () => {
    setForm({ name: "", section: "", feeAmount: "" });
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (c: SchoolClass) => {
    setEditing(c);
    setForm({
      name: c.name,
      section: c.section,
      feeAmount: c.feeAmount ? String(c.feeAmount) : "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const res = await fetch("/api/school/classes", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            id: editing.id,
            name: form.name,
            section: form.section,
            feeAmount: form.feeAmount ? parseFloat(form.feeAmount) : undefined,
          }),
        });
        if (res.ok) {
          closeForm();
          fetchClasses();
        }
      } else {
        const res = await fetch("/api/school/classes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: form.name,
            section: form.section,
            feeAmount: form.feeAmount ? parseFloat(form.feeAmount) : undefined,
          }),
        });
        if (res.ok) {
          closeForm();
          fetchClasses();
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this class?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/school/classes?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) fetchClasses();
    } catch (err) {
      console.error("Failed to delete class:", err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Classes</h2>
          <p className="text-slate-500 text-sm">{classes.length} classes configured</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm border-none cursor-pointer"
        >
          <Plus size={16} /> Add Class
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-slate-900 font-bold text-sm">{editing ? "Edit Class" : "New Class"}</h3>
            <button onClick={closeForm} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer border-none bg-transparent">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Class name (e.g., Class 1)"
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <input
              required
              type="text"
              value={form.section}
              onChange={(e) => setForm({ ...form, section: e.target.value })}
              placeholder="Section (e.g., A)"
              className="w-24 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <input
              type="number"
              value={form.feeAmount}
              onChange={(e) => setForm({ ...form, feeAmount: e.target.value })}
              placeholder="Fee (PKR)"
              className="w-36 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 border-none cursor-pointer"
            >
              {saving ? "Saving..." : editing ? "Update" : "Create"}
            </button>
          </form>
        </div>
      )}

      {/* Classes Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading...</div>
      ) : classes.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">No classes created yet. Click &quot;Add Class&quot; to start.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c) => (
            <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-slate-900 font-bold text-lg">{c.name}</h3>
                  <p className="text-slate-500 text-sm">Section {c.section}</p>
                </div>
                <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {c._count.students} students
                </span>
              </div>
              {c.feeAmount && (
                <p className="text-slate-600 text-sm mb-3">
                  Monthly Fee: <span className="font-semibold">PKR {Number(c.feeAmount).toLocaleString()}</span>
                </p>
              )}
              <div className="flex gap-1 pt-2 border-t border-slate-100 mt-3">
                <button
                  onClick={() => openEdit(c)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                >
                  <Pencil size={12} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  disabled={deletingId === c.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border-none bg-transparent disabled:opacity-30"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
