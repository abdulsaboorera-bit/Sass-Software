"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

interface ClassOption {
  id: string;
  name: string;
  section: string;
}

export default function NewStudentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    admissionNo: "",
    name: "",
    fatherName: "",
    fatherPhone: "",
    motherPhone: "",
    classId: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    fetch("/api/school/classes")
      .then((r) => r.json())
      .then((data) => { if (data.classes) setClasses(data.classes); });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/school/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          gender: form.gender || undefined,
          dateOfBirth: form.dateOfBirth || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create student");
        return;
      }

      router.push("/dashboard/students");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <Link href="/dashboard/students" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm font-medium mb-4 no-underline">
        <ArrowLeft size={14} /> Back to Students
      </Link>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
        <h2 className="text-xl font-extrabold text-slate-900 mb-1">Add New Student</h2>
        <p className="text-slate-500 text-sm mb-6">Fill in the student details below.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Admission No *</label>
              <input
                required
                type="text"
                value={form.admissionNo}
                onChange={(e) => setForm({ ...form, admissionNo: e.target.value })}
                placeholder="BF-2026-001"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Class *</label>
              <select
                required
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Student Name *</label>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Father Name *</label>
              <input
                required
                type="text"
                value={form.fatherName}
                onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
                placeholder="Father's name"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Father Phone *</label>
              <input
                required
                type="tel"
                value={form.fatherPhone}
                onChange={(e) => setForm({ ...form, fatherPhone: e.target.value })}
                placeholder="+92 300 000 0000"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Mother Phone</label>
              <input
                type="tel"
                value={form.motherPhone}
                onChange={(e) => setForm({ ...form, motherPhone: e.target.value })}
                placeholder="+92 300 000 0000"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Date of Birth</label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Address</label>
            <textarea
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Home address"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer text-sm"
          >
            {loading ? "Saving..." : "Add Student"} {!loading && <Save size={15} />}
          </button>
        </form>
      </div>
    </div>
  );
}
