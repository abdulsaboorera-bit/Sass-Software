"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

interface Student {
  id: string;
  name: string;
  admissionNo: string;
  class: { id: string; name: string; section: string };
}

interface AttendanceRecord {
  studentId: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE";
}

export default function AttendancePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string; section: string }[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [records, setRecords] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/school/classes", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.classes) {
          setClasses(data.classes);
          if (data.classes.length > 0) setSelectedClass(data.classes[0].id);
        }
      });
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    fetch(`/api/school/students?classId=${selectedClass}&limit=100`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.students) {
          setStudents(data.students);
          const init: Record<string, AttendanceRecord> = {};
          data.students.forEach((s: Student) => {
            init[s.id] = { studentId: s.id, status: "PRESENT" };
          });
          setRecords(init);
        }
      })
      .finally(() => setLoading(false));
  }, [selectedClass]);

  const setStatus = (studentId: string, status: AttendanceRecord["status"]) => {
    setRecords((prev) => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch("/api/school/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          date,
          records: Object.values(records),
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save attendance:", err);
    } finally {
      setSaving(false);
    }
  };

  const stats = {
    total: students.length,
    present: Object.values(records).filter((r) => r.status === "PRESENT").length,
    absent: Object.values(records).filter((r) => r.status === "ABSENT").length,
    late: Object.values(records).filter((r) => r.status === "LATE").length,
    leave: Object.values(records).filter((r) => r.status === "LEAVE").length,
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Attendance</h2>
          <p className="text-slate-500 text-sm">Mark daily attendance for your students.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || students.length === 0}
          className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save Attendance"}
          {!saving && !saved && <CheckCircle size={15} />}
          {saved && <CheckCircle size={15} />}
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div>
            <label className="block text-slate-600 text-xs font-bold mb-1 uppercase tracking-wide">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-slate-600 text-xs font-bold mb-1 uppercase tracking-wide">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-2 mb-6">
        {[
          { label: "Total", value: stats.total, color: "bg-slate-100 text-slate-700" },
          { label: "Present", value: stats.present, color: "bg-green-100 text-green-700" },
          { label: "Absent", value: stats.absent, color: "bg-red-100 text-red-700" },
          { label: "Late", value: stats.late, color: "bg-amber-100 text-amber-700" },
          { label: "Leave", value: stats.leave, color: "bg-blue-100 text-blue-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-lg px-3 py-2 text-center ${s.color}`}>
            <p className="text-lg font-black">{s.value}</p>
            <p className="text-[10px] font-semibold uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Student List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="px-4 py-12 text-center text-slate-400 text-sm">Loading students...</div>
        ) : students.length === 0 ? (
          <div className="px-4 py-12 text-center text-slate-400 text-sm">No students in this class.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {students.map((student) => (
              <div key={student.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{student.name}</p>
                  <p className="text-xs text-slate-400">{student.admissionNo}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {(["PRESENT", "ABSENT", "LATE", "LEAVE"] as const).map((status) => {
                    const isActive = records[student.id]?.status === status;
                    const icons = {
                      PRESENT: CheckCircle,
                      ABSENT: XCircle,
                      LATE: Clock,
                      LEAVE: AlertCircle,
                    };
                    const colors = {
                      PRESENT: isActive ? "bg-green-100 text-green-600 border-green-300" : "bg-white text-slate-400 border-slate-200 hover:bg-green-50",
                      ABSENT: isActive ? "bg-red-100 text-red-600 border-red-300" : "bg-white text-slate-400 border-slate-200 hover:bg-red-50",
                      LATE: isActive ? "bg-amber-100 text-amber-600 border-amber-300" : "bg-white text-slate-400 border-slate-200 hover:bg-amber-50",
                      LEAVE: isActive ? "bg-blue-100 text-blue-600 border-blue-300" : "bg-white text-slate-400 border-slate-200 hover:bg-blue-50",
                    };
                    const Icon = icons[status];
                    return (
                      <button
                        key={status}
                        onClick={() => setStatus(student.id, status)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${colors[status]}`}
                        title={status}
                      >
                        <Icon size={16} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
