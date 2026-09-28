"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";

interface Session { id: string; name: string; dayOfWeek: number; startTime: string; endTime: string; capacity: number; trainerId?: { name: string } | string }
interface Trainer { id: string; name: string }
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function GymClassesPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", trainerId: "", dayOfWeek: "1", startTime: "07:00", endTime: "08:00", capacity: "20" });

  const load = async () => {
    setError("");
    try {
      const [sessionsResponse, trainersResponse] = await Promise.all([
        fetch("/api/gym/sessions?limit=100", { credentials: "include" }),
        fetch("/api/gym/trainers?limit=100", { credentials: "include" }),
      ]);
      const sessionsData = await sessionsResponse.json(); const trainersData = await trainersResponse.json();
      if (!sessionsResponse.ok) throw new Error(sessionsData.error || "Unable to load classes");
      setSessions(sessionsData.sessions || []); setTrainers(trainersData.trainers || []);
      if (!form.trainerId && trainersData.trainers?.[0]) setForm((current) => ({ ...current, trainerId: trainersData.trainers[0].id }));
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Unable to load classes"); }
  };
  useEffect(() => { void load(); }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setError("");
    try {
      const response = await fetch("/api/gym/sessions", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, dayOfWeek: Number(form.dayOfWeek), capacity: Number(form.capacity) }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to create class");
      setOpen(false); setForm({ ...form, name: "" }); await load();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Unable to create class"); }
  };

  return <div><div className="flex items-center justify-between mb-6"><div><h2 className="text-2xl font-extrabold text-slate-900">Classes & Sessions</h2><p className="text-slate-500 text-sm">Create the recurring classes your members can book.</p></div><button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm cursor-pointer"><Plus size={16} /> New Class</button></div>{error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}<div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{sessions.length === 0 ? <p className="text-slate-400 text-sm">No classes configured.</p> : sessions.map((session) => <div key={session.id} className="bg-white border border-slate-200 rounded-xl p-5"><h3 className="font-bold text-slate-900">{session.name}</h3><p className="text-sm text-slate-600 mt-2">{days[session.dayOfWeek]} · {session.startTime} - {session.endTime}</p><p className="text-xs text-slate-400 mt-2">Capacity {session.capacity} · {typeof session.trainerId === "object" ? session.trainerId.name : "Trainer assigned"}</p></div>)}</div>{open && <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4"><form onSubmit={save} className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4"><div className="flex items-center justify-between"><h3 className="font-bold text-lg">New Class</h3><button type="button" onClick={() => setOpen(false)} className="border-none bg-transparent text-slate-400 cursor-pointer"><X size={18} /></button></div><input required placeholder="Class name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" /><select required value={form.trainerId} onChange={(e) => setForm({ ...form, trainerId: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white"><option value="">Select trainer</option>{trainers.map((trainer) => <option key={trainer.id} value={trainer.id}>{trainer.name}</option>)}</select><div className="grid grid-cols-2 gap-3"><select value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })} className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white">{days.map((day, index) => <option key={day} value={index}>{day}</option>)}</select><input required min="1" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm" /></div><div className="grid grid-cols-2 gap-3"><input required type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm" /><input required type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm" /></div><button className="w-full bg-blue-600 text-white rounded-xl py-2.5 font-semibold text-sm cursor-pointer">Create Class</button></form></div>}</div>;
}
