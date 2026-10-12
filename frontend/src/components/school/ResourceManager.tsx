"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, X, Pencil, Trash2, Search } from "lucide-react";

export type Row = Record<string, unknown>;

export interface Column {
  key: string;
  label: string;
  render?: (row: Row) => React.ReactNode;
}

export interface FieldOption {
  value: string;
  label: string;
}

export interface Field {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "time" | "textarea" | "select" | "boolean";
  options?: FieldOption[];
  optionsEndpoint?: string;
  optionsKey?: string;
  optionLabelField?: string;
  optionLabelExtraField?: string;
  required?: boolean;
  placeholder?: string;
  step?: string;
  help?: string;
}

interface ResourceManagerProps {
  title: string;
  subtitle?: string;
  endpoint: string;
  listKey: string;
  columns: Column[];
  fields: Field[];
  searchable?: boolean;
  allowCreate?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
  transformCreate?: (payload: Row) => Row;
  transformUpdate?: (payload: Row) => Row;
}

function getValue(row: Row | null, path: string): unknown {
  if (!row) return undefined;
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object") return (acc as Row)[part];
    return undefined;
  }, row);
}

function displayValue(row: Row, col: Column): React.ReactNode {
  if (col.render) return col.render(row);
  const v = getValue(row, col.key);
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

function toFormValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return "";
    }
  }
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}/.test(s)) return s.slice(0, 10);
  return s;
}

export default function ResourceManager({
  title,
  subtitle,
  endpoint,
  listKey,
  columns,
  fields,
  searchable = true,
  allowCreate = true,
  allowEdit = true,
  allowDelete = true,
  transformCreate,
  transformUpdate,
}: ResourceManagerProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, FieldOption[]>>({});

  const optionsFields = useMemo(() => fields.filter((f) => f.optionsEndpoint), [fields]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (searchable && search) params.set("search", search);
      params.set("limit", "500");
      const res = await fetch(`${endpoint}?${params}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to load records");
      const list = data[listKey];
      setRows(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load records");
    } finally {
      setLoading(false);
    }
  }, [endpoint, listKey, search, searchable]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    optionsFields.forEach(async (field) => {
      try {
        const res = await fetch(`${field.optionsEndpoint}?limit=500`, { credentials: "include" });
        const data = await res.json();
        const list = field.optionsKey ? data[field.optionsKey] : data;
        if (Array.isArray(list)) {
          setDynamicOptions((prev) => ({
            ...prev,
            [field.name]: list.map((item: Row) => {
              const base = field.optionLabelField ? String(item[field.optionLabelField] ?? "") : String(item.name ?? item.id);
              const extra = field.optionLabelExtraField ? ` (${item[field.optionLabelExtraField] ?? ""})` : "";
              return { value: String(item.id ?? item._id), label: `${base}${extra}` };
            }),
          }));
        }
      } catch {
        /* ignore option load failure */
      }
    });
  }, [optionsFields]);

  const openCreate = () => {
    setEditing(null);
    const initial: Record<string, string> = {};
    fields.forEach((f) => { initial[f.name] = f.type === "boolean" ? "true" : ""; });
    setForm(initial);
    setModalOpen(true);
  };

  const openEdit = (row: Row) => {
    setEditing(row);
    const initial: Record<string, string> = {};
    fields.forEach((f) => { initial[f.name] = toFormValue(row[f.name]); });
    setForm(initial);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload: Row = {};
      fields.forEach((f) => {
        const raw = form[f.name];
        if (raw === "" || raw === undefined) {
          if (f.required) throw new Error(`${f.label} is required`);
          return;
        }
        if (f.type === "number") payload[f.name] = Number(raw);
        else if (f.type === "boolean") payload[f.name] = raw === "true";
        else payload[f.name] = raw;
      });
      const body = editing
        ? (transformUpdate ? transformUpdate(payload) : payload)
        : (transformCreate ? transformCreate(payload) : payload);
      const url = editing ? `${endpoint}/${String(editing.id)}` : endpoint;
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to save record");
      setModalOpen(false);
      await fetchRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save record");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: Row) => {
    if (!window.confirm("Delete this record? This cannot be undone.")) return;
    try {
      const res = await fetch(`${endpoint}/${String(row.id)}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Unable to delete record");
      }
      await fetchRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete record");
    }
  };

  const renderField = (field: Field) => {
    const common = {
      required: field.required,
      value: form[field.name] ?? "",
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm((prev) => ({ ...prev, [field.name]: e.target.value })),
      className:
        "w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
    };
    if (field.type === "textarea") return <textarea {...common} rows={3} placeholder={field.placeholder} />;
    if (field.type === "select" || field.type === "boolean") {
      const opts = field.type === "boolean"
        ? [{ value: "true", label: "Yes" }, { value: "false", label: "No" }]
        : (field.options || dynamicOptions[field.name] || []);
      return (
        <select {...common} className={`${common.className} bg-white`}>
          <option value="">Select {field.label}</option>
          {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    }
    return <input {...common} type={field.type || "text"} step={field.step} placeholder={field.placeholder} />;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">{title}</h2>
          {subtitle && <p className="text-slate-500 text-sm">{subtitle}</p>}
        </div>
        {allowCreate && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm border-none cursor-pointer"
          >
            <Plus size={16} /> Add
          </button>
        )}
      </div>

      {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      {searchable && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {columns.map((c) => (
                  <th key={c.key} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">{c.label}</th>
                ))}
                {(allowEdit || allowDelete) && <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length + 1} className="px-4 py-12 text-center text-slate-400 text-sm">Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={columns.length + 1} className="px-4 py-12 text-center text-slate-400 text-sm">No records found.</td></tr>
              ) : (
                rows.map((row) => (
                  <tr key={String(row.id)} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    {columns.map((c) => (
                      <td key={c.key} className="px-4 py-3 text-sm text-slate-700">{displayValue(row, c)}</td>
                    ))}
                    {(allowEdit || allowDelete) && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {allowEdit && (
                          <button onClick={() => openEdit(row)} className="inline-flex p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer border-none bg-transparent" title="Edit">
                            <Pencil size={15} />
                          </button>
                        )}
                        {allowDelete && (
                          <button onClick={() => handleDelete(row)} className="inline-flex p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer border-none bg-transparent" title="Delete">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900">{editing ? `Edit ${title}` : `Add ${title}`}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer border-none bg-transparent">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {fields.map((f) => (
                <div key={f.name}>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                    {f.label}{f.required && <span className="text-red-500"> *</span>}
                  </label>
                  {renderField(f)}
                  {f.help && <p className="text-xs text-slate-400 mt-1">{f.help}</p>}
                </div>
              ))}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2.5 text-slate-600 font-medium text-sm rounded-xl hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-5 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 border-none cursor-pointer">
                  {saving ? "Saving..." : editing ? "Save Changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
