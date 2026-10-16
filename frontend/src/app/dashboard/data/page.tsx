"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileText, Upload, Loader2, Database } from "lucide-react";

interface Dataset {
  key: string;
  label: string;
  canExport: boolean;
  canImport: boolean;
}

export default function DataPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetch("/api/data", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { datasets: [] }))
      .then((d) => setDatasets(d.datasets || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleImport = async (key: string, file: File) => {
    setImporting(key);
    setMessage(null);
    try {
      const text = await file.text();
      const res = await fetch(`/api/data/${key}/import`, {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        credentials: "include",
        body: text,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      const r = data.result || {};
      setMessage({ type: "ok", text: `${r.created || 0} imported, ${r.skipped || 0} skipped of ${r.total || 0}.` });
    } catch (err) {
      setMessage({ type: "err", text: err instanceof Error ? err.message : "Import failed" });
    } finally {
      setImporting(null);
      const input = fileRefs.current[key];
      if (input) input.value = "";
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-1">
        <Database size={22} className="text-blue-600" />
        <h2 className="text-2xl font-extrabold text-slate-900">Data &amp; Reports</h2>
      </div>
      <p className="text-slate-500 text-sm mb-6">Export any module as CSV or PDF, or bulk-import records from a CSV file.</p>

      {message && (
        <div className={`mb-4 p-3 rounded-xl text-sm border ${message.type === "ok" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : datasets.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">No exportable datasets for your plan.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Dataset</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {datasets.map((d) => (
                <tr key={d.key} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">{d.label}</p>
                    <p className="text-xs text-slate-400 font-mono">{d.key}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {d.canExport && (
                        <>
                          <a
                            href={`/api/data/${d.key}/export.csv`}
                            className="inline-flex items-center gap-1.5 border border-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-50 text-xs no-underline"
                          >
                            <Download size={13} /> CSV
                          </a>
                          <a
                            href={`/api/data/${d.key}/export.pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 border border-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-50 text-xs no-underline"
                          >
                            <FileText size={13} /> PDF
                          </a>
                        </>
                      )}
                      {d.canImport && (
                        <>
                          <input
                            ref={(el) => { fileRefs.current[d.key] = el; }}
                            type="file"
                            accept=".csv,text/csv"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImport(d.key, file);
                            }}
                          />
                          <button
                            onClick={() => fileRefs.current[d.key]?.click()}
                            disabled={importing === d.key}
                            className="inline-flex items-center gap-1.5 bg-blue-600 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-700 text-xs border-none cursor-pointer disabled:opacity-50"
                          >
                            {importing === d.key ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} Import
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
