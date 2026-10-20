"use client";

import { useEffect, useState } from "react";
import { usePermissions } from "@/lib/permissions";

interface Settings {
  salonName?: string;
  tagline?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  timezone?: string;
  currency?: string;
  taxRate?: number;
  defaultCommissionRate?: number;
  defaultAppointmentDuration?: number;
  lowStockThreshold?: number;
}

const empty: Settings = {
  salonName: "", tagline: "", phone: "", email: "", address: "", website: "",
  timezone: "Asia/Karachi", currency: "PKR", taxRate: 0,
  defaultCommissionRate: 0, defaultAppointmentDuration: 30, lowStockThreshold: 5,
};

export default function SalonSettingsPage() {
  const [form, setForm] = useState<Settings>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const { can } = usePermissions();

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/salon/settings", { credentials: "include" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load settings");
        setForm({ ...empty, ...(data.settings || {}) });
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Unable to load settings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!can("settings.edit")) {
      setError("You don't have permission to edit settings");
      return;
    }
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const response = await fetch("/api/salon/settings", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salonName: form.salonName || undefined,
          tagline: form.tagline || undefined,
          phone: form.phone || undefined,
          email: form.email || undefined,
          address: form.address || undefined,
          website: form.website || undefined,
          timezone: form.timezone || undefined,
          currency: form.currency || undefined,
          taxRate: Number(form.taxRate || 0),
          defaultCommissionRate: Number(form.defaultCommissionRate || 0),
          defaultAppointmentDuration: Number(form.defaultAppointmentDuration || 0),
          lowStockThreshold: Number(form.lowStockThreshold || 0),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save settings");
      setForm({ ...empty, ...(data.settings || {}) });
      setSaved(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-slate-400 text-sm">Loading settings...</p>;

  const field = (label: string, key: keyof Settings, type: string = "text") => (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      <input
        type={type}
        value={String(form[key] ?? "")}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
      />
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-extrabold text-slate-900">Salon Settings</h2>
      <p className="text-slate-500 text-sm mb-6">Business details, defaults, and preferences.</p>

      {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
      {saved && <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">Settings saved.</div>}

      <form onSubmit={save} className="bg-white border border-slate-200 rounded-xl p-6 max-w-3xl space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          {field("Salon name", "salonName")}
          {field("Tagline", "tagline")}
          {field("Phone", "phone")}
          {field("Email", "email", "email")}
          {field("Website", "website")}
          {field("Address", "address")}
          {field("Timezone", "timezone")}
          {field("Currency", "currency")}
        </div>
        <div className="grid sm:grid-cols-4 gap-4">
          {field("Tax rate (%)", "taxRate", "number")}
          {field("Default commission (%)", "defaultCommissionRate", "number")}
          {field("Default duration (min)", "defaultAppointmentDuration", "number")}
          {field("Low stock threshold", "lowStockThreshold", "number")}
        </div>
        {can("settings.edit") && (
          <button type="submit" disabled={saving} className="bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm cursor-pointer disabled:opacity-60">
            {saving ? "Saving..." : "Save Settings"}
          </button>
        )}
      </form>
    </div>
  );
}
