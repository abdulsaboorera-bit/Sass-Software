"use client";

import { useEffect, useState } from "react";
import { Plus, X, FileText } from "lucide-react";

interface Ref { id: string; name: string; patientNo?: string; code?: string }
interface LabTest {
  id: string;
  name: string;
  code?: string;
  category?: string;
  price: number;
  unit?: string;
  referenceRange?: string;
  turnaroundHours?: number;
}
interface LabResult {
  id: string;
  patientId?: Ref;
  testId?: Ref;
  testName: string;
  date: string;
  result?: string;
  notes?: string;
  status: string;
}

const emptyTest = { name: "", code: "", category: "", price: "", unit: "", referenceRange: "", turnaroundHours: "24" };
const emptyResult = { patientId: "", testId: "", doctorId: "", testName: "", date: new Date().toISOString().slice(0, 10), result: "", notes: "", status: "COMPLETED" };
const RESULT_STATUSES = ["PENDING", "COMPLETED"];

export default function ClinicLabPage() {
  const [tab, setTab] = useState<"tests" | "results">("results");
  const [tests, setTests] = useState<LabTest[]>([]);
  const [results, setResults] = useState<LabResult[]>([]);
  const [patients, setPatients] = useState<Ref[]>([]);
  const [doctors, setDoctors] = useState<Ref[]>([]);
  const [testForm, setTestForm] = useState(emptyTest);
  const [resultForm, setResultForm] = useState(emptyResult);
  const [testOpen, setTestOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [testsResponse, resultsResponse, patientsResponse, doctorsResponse] = await Promise.all([
        fetch("/api/clinic/lab-tests", { credentials: "include" }),
        fetch("/api/clinic/lab-results?limit=100", { credentials: "include" }),
        fetch("/api/clinic/patients?limit=100", { credentials: "include" }),
        fetch("/api/clinic/doctors", { credentials: "include" }),
      ]);
      const [testsData, resultsData, patientsData, doctorsData] = await Promise.all([
        testsResponse.json(), resultsResponse.json(), patientsResponse.json(), doctorsResponse.json(),
      ]);
      if (!resultsResponse.ok) throw new Error(resultsData.error || "Unable to load lab data");
      setTests(testsData.labTests || []);
      setResults(resultsData.labResults || []);
      setPatients(patientsData.patients || []);
      setDoctors(doctorsData.doctors || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to load lab data");
    }
  };

  useEffect(() => { void load(); }, []);

  const saveTest = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      const response = await fetch("/api/clinic/lab-tests", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: testForm.name,
          code: testForm.code || undefined,
          category: testForm.category || undefined,
          price: Number(testForm.price || 0),
          unit: testForm.unit || undefined,
          referenceRange: testForm.referenceRange || undefined,
          turnaroundHours: Number(testForm.turnaroundHours || 0),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save lab test");
      setTestOpen(false);
      setTestForm(emptyTest);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to save lab test");
    }
  };

  const saveResult = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const test = tests.find((t) => t.id === resultForm.testId);
    try {
      const response = await fetch("/api/clinic/lab-results", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: resultForm.patientId,
          testId: resultForm.testId || undefined,
          doctorId: resultForm.doctorId || undefined,
          testName: resultForm.testName || test?.name || "Lab test",
          date: resultForm.date,
          result: resultForm.result || undefined,
          notes: resultForm.notes || undefined,
          status: resultForm.status,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save lab result");
      setResultOpen(false);
      setResultForm(emptyResult);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to save lab result");
    }
  };

  const archiveTest = async (test: LabTest) => {
    if (!confirm(`Delete ${test.name}?`)) return;
    const response = await fetch(`/api/clinic/lab-tests/${test.id}`, { method: "DELETE", credentials: "include" });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Unable to delete lab test");
    }
    await load();
  };

  const archiveResult = async (result: LabResult) => {
    if (!confirm("Delete this result?")) return;
    const response = await fetch(`/api/clinic/lab-results/${result.id}`, { method: "DELETE", credentials: "include" });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Unable to delete lab result");
    }
    await load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Laboratory</h2>
          <p className="text-slate-500 text-sm">Lab test catalogue and patient results.</p>
        </div>
        <button onClick={() => (tab === "tests" ? setTestOpen(true) : setResultOpen(true))} className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm cursor-pointer">
          <Plus size={16} /> {tab === "tests" ? "Add Lab Test" : "Record Result"}
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("results")} className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer border-none ${tab === "results" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>Results</button>
        <button onClick={() => setTab("tests")} className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer border-none ${tab === "tests" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>Test Catalogue</button>
      </div>

      {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      {tab === "results" ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Date</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Patient</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Test</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Result</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">No lab results yet.</td></tr>
              ) : results.map((result) => (
                <tr key={result.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 text-sm text-slate-600">{new Date(result.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800">{result.patientId?.name || "—"}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{result.testName}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{typeof result.result === "string" ? result.result : result.result ? JSON.stringify(result.result) : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${result.status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{result.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-3">
                      <a href={`/api/clinic/lab-results/${result.id}/pdf`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600"><FileText size={14} /> PDF</a>
                      <button onClick={() => archiveResult(result)} className="text-xs text-red-600 border-none bg-transparent cursor-pointer">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Test</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Code</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Category</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Reference</th>
                <th className="text-right px-4 py-3 text-xs uppercase text-slate-500">Price</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {tests.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">No lab tests yet.</td></tr>
              ) : tests.map((test) => (
                <tr key={test.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800">{test.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{test.code || "—"}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{test.category || "—"}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{test.referenceRange || "—"}</td>
                  <td className="px-4 py-3 text-sm text-right text-slate-600">PKR {Number(test.price).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => archiveTest(test)} className="text-xs text-red-600 border-none bg-transparent cursor-pointer">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {testOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4">
          <form onSubmit={saveTest} className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Add Lab Test</h3>
              <button type="button" onClick={() => setTestOpen(false)} className="text-slate-400 border-none bg-transparent cursor-pointer"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <input required placeholder="Test name" value={testForm.name} onChange={(e) => setTestForm({ ...testForm, name: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Code" value={testForm.code} onChange={(e) => setTestForm({ ...testForm, code: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input placeholder="Category" value={testForm.category} onChange={(e) => setTestForm({ ...testForm, category: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input required type="number" placeholder="Price" value={testForm.price} onChange={(e) => setTestForm({ ...testForm, price: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input placeholder="Unit" value={testForm.unit} onChange={(e) => setTestForm({ ...testForm, unit: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input placeholder="Reference range" value={testForm.referenceRange} onChange={(e) => setTestForm({ ...testForm, referenceRange: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input type="number" placeholder="Turnaround (hrs)" value={testForm.turnaroundHours} onChange={(e) => setTestForm({ ...testForm, turnaroundHours: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
            </div>
            <button type="submit" className="mt-5 w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl text-sm cursor-pointer">Save Lab Test</button>
          </form>
        </div>
      )}

      {resultOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4 overflow-y-auto">
          <form onSubmit={saveResult} className="bg-white rounded-2xl w-full max-w-lg p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Record Lab Result</h3>
              <button type="button" onClick={() => setResultOpen(false)} className="text-slate-400 border-none bg-transparent cursor-pointer"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <select required value={resultForm.patientId} onChange={(e) => setResultForm({ ...resultForm, patientId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="">Select patient</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.name} {p.patientNo ? `(${p.patientNo})` : ""}</option>)}
              </select>
              <select required value={resultForm.testId} onChange={(e) => { const t = tests.find((x) => x.id === e.target.value); setResultForm({ ...resultForm, testId: e.target.value, testName: t?.name || "" }); }} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="">Select test</option>
                {tests.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <select value={resultForm.doctorId} onChange={(e) => setResultForm({ ...resultForm, doctorId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="">Referring doctor (optional)</option>
                {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input required type="date" value={resultForm.date} onChange={(e) => setResultForm({ ...resultForm, date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <select value={resultForm.status} onChange={(e) => setResultForm({ ...resultForm, status: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  {RESULT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
              <input placeholder="Result value" value={resultForm.result} onChange={(e) => setResultForm({ ...resultForm, result: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <textarea placeholder="Notes (optional)" value={resultForm.notes} onChange={(e) => setResultForm({ ...resultForm, notes: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" rows={2} />
            </div>
            <button type="submit" className="mt-5 w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl text-sm cursor-pointer">Save Result</button>
          </form>
        </div>
      )}
    </div>
  );
}
