"use client";

import { useState, useEffect } from "react";
import { Save, Clock, Bell, Building2, Loader2 } from "lucide-react";

interface OperatingHour {
  day: number;
  open: string;
  close: string;
  isClosed: boolean;
}

interface GymSettings {
  id?: string;
  gymName?: string;
  address?: string;
  phone?: string;
  email?: string;
  operatingHours?: OperatingHour[];
  timezone?: string;
  currency?: string;
  enableNotifications?: boolean;
  enableWhatsApp?: boolean;
  enableEmail?: boolean;
  enableSMS?: boolean;
  reminderDaysBeforeExpiry?: number;
  reminderDaysBeforePayment?: number;
  lowStockThreshold?: number;
}

const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

const defaultHour = (day: number): OperatingHour => ({ day, open: "06:00", close: "22:00", isClosed: false });

export default function SettingsPage() {
  const [settings, setSettings] = useState<GymSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const getHour = (day: number) => settings.operatingHours?.find((hour) => hour.day === day) || defaultHour(day);

  const updateHour = (day: number, changes: Partial<OperatingHour>) => {
    setSettings((current) => {
      const hours = current.operatingHours ? [...current.operatingHours] : DAYS.map((item) => defaultHour(item.value));
      const index = hours.findIndex((hour) => hour.day === day);
      const next = { ...defaultHour(day), ...(index >= 0 ? hours[index] : {}), ...changes };
      if (index >= 0) hours[index] = next;
      else hours.push(next);
      return { ...current, operatingHours: hours };
    });
  };

  useEffect(() => {
    fetch("/api/gym/settings", { credentials: "include" })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Failed to load settings");
        return data;
      })
      .then(data => {
        if (data.settings) setSettings(data.settings);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/gym/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      if (data.settings) setSettings(data.settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    }
    setSaving(false);
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white";

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-slate-400 text-sm"><Loader2 size={20} className="animate-spin mr-2" /> Loading settings...</div>;
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Gym Settings</h2>
          <p className="text-slate-500 text-sm">Configure your gym profile and preferences</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm border-none cursor-pointer disabled:opacity-50">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-4">{error}</div>}

      <div className="space-y-6">
        {/* Gym Profile */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={16} className="text-blue-600" />
            <h3 className="text-slate-900 font-bold text-sm">Gym Profile</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Gym Name</label>
              <input type="text" value={settings.gymName || ""} onChange={e => setSettings({ ...settings, gymName: e.target.value })}
                placeholder="Your gym name" className={inputCls} />
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Address</label>
              <input type="text" value={settings.address || ""} onChange={e => setSettings({ ...settings, address: e.target.value })}
                placeholder="Full address" className={inputCls} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Phone</label>
                <input type="text" value={settings.phone || ""} onChange={e => setSettings({ ...settings, phone: e.target.value })}
                  placeholder="Contact phone" className={inputCls} />
              </div>
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Email</label>
                <input type="email" value={settings.email || ""} onChange={e => setSettings({ ...settings, email: e.target.value })}
                  placeholder="Contact email" className={inputCls} />
              </div>
            </div>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-emerald-600" />
            <h3 className="text-slate-900 font-bold text-sm">Operating Hours</h3>
          </div>
          <div className="space-y-2">
            {DAYS.map((day) => {
              const hour = getHour(day.value);
              return (
                <div key={day.value} className="grid grid-cols-[minmax(90px,1fr)_auto_auto_auto] items-center gap-2 text-sm">
                  <span className="font-semibold text-slate-700">{day.label}</span>
                  <input type="time" disabled={hour.isClosed} value={hour.open}
                    onChange={(e) => updateHour(day.value, { open: e.target.value })} className={inputCls} />
                  <input type="time" disabled={hour.isClosed} value={hour.close}
                    onChange={(e) => updateHour(day.value, { close: e.target.value })} className={inputCls} />
                  <label className="flex items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap">
                    <input type="checkbox" checked={hour.isClosed} onChange={(e) => updateHour(day.value, { isClosed: e.target.checked })} /> Closed
                  </label>
                </div>
              );
            })}
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Timezone</label>
              <select value={settings.timezone || "Asia/Karachi"} onChange={e => setSettings({ ...settings, timezone: e.target.value })} className={inputCls}>
                <option value="Asia/Karachi">Asia/Karachi (PKT)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Currency</label>
              <select value={settings.currency || "PKR"} onChange={e => setSettings({ ...settings, currency: e.target.value })} className={inputCls}>
                <option value="PKR">PKR (Pakistani Rupee)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="AED">AED (UAE Dirham)</option>
                <option value="INR">INR (Indian Rupee)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={16} className="text-purple-600" />
            <h3 className="text-slate-900 font-bold text-sm">Notifications</h3>
          </div>
          <div className="space-y-3">
            {[
              { key: "enableNotifications" as const, label: "Enable notifications", desc: "Allow the daily gym jobs to create member alerts" },
              { key: "enableWhatsApp" as const, label: "WhatsApp delivery", desc: "Queue WhatsApp notifications when an adapter is configured" },
              { key: "enableEmail" as const, label: "Email delivery", desc: "Queue email notifications when an adapter is configured" },
              { key: "enableSMS" as const, label: "SMS delivery", desc: "Queue SMS notifications when an adapter is configured" },
            ].map(n => (
              <label key={n.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{n.label}</p>
                  <p className="text-xs text-slate-500">{n.desc}</p>
                </div>
                <div className="relative">
                  <input type="checkbox" checked={settings[n.key] ?? (n.key === "enableNotifications")}
                    onChange={e => setSettings({ ...settings, [n.key]: e.target.checked })}
                    className="sr-only peer" />
                  <div className="w-10 h-6 bg-slate-200 rounded-full peer-checked:bg-blue-600 transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform" />
                </div>
              </label>
            ))}
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-600">Expiry reminder (days)
              <input type="number" min="0" value={settings.reminderDaysBeforeExpiry ?? 3}
                onChange={(e) => setSettings({ ...settings, reminderDaysBeforeExpiry: Number(e.target.value) })} className={`${inputCls} mt-1`} />
            </label>
            <label className="text-xs font-semibold text-slate-600">Payment reminder (days)
              <input type="number" min="0" value={settings.reminderDaysBeforePayment ?? 2}
                onChange={(e) => setSettings({ ...settings, reminderDaysBeforePayment: Number(e.target.value) })} className={`${inputCls} mt-1`} />
            </label>
            <label className="text-xs font-semibold text-slate-600">Low stock threshold
              <input type="number" min="0" value={settings.lowStockThreshold ?? 5}
                onChange={(e) => setSettings({ ...settings, lowStockThreshold: Number(e.target.value) })} className={`${inputCls} mt-1`} />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
