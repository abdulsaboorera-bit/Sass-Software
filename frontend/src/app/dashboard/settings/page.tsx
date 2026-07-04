"use client";

import { useState, useEffect } from "react";
import { Save, Clock, Bell, Building2, Loader2 } from "lucide-react";

interface GymSettings {
  id?: string;
  gymName?: string;
  address?: string;
  phone?: string;
  email?: string;
  operatingHours?: { open: string; close: string };
  timezone?: string;
  currency?: string;
  notifications?: { lowStock: boolean; expiringMembers: boolean; dailyReport: boolean; smsReminders: boolean };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<GymSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/gym/settings", { credentials: "include" })
      .then(r => r.json())
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
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Opening Time</label>
              <input type="time" value={settings.operatingHours?.open || "06:00"}
                onChange={e => setSettings({ ...settings, operatingHours: { ...settings.operatingHours, open: e.target.value, close: settings.operatingHours?.close || "22:00" } })}
                className={inputCls} />
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Closing Time</label>
              <input type="time" value={settings.operatingHours?.close || "22:00"}
                onChange={e => setSettings({ ...settings, operatingHours: { ...settings.operatingHours, close: e.target.value, open: settings.operatingHours?.open || "06:00" } })}
                className={inputCls} />
            </div>
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
              { key: "lowStock" as const, label: "Low Stock Alerts", desc: "Get notified when inventory items fall below minimum stock level" },
              { key: "expiringMembers" as const, label: "Expiring Memberships", desc: "Alert when memberships are about to expire within 7 days" },
              { key: "dailyReport" as const, label: "Daily Summary Report", desc: "Receive daily summary of check-ins, revenue, and key metrics" },
              { key: "smsReminders" as const, label: "SMS Renewal Reminders", desc: "Send SMS reminders to members before membership expiry" },
            ].map(n => (
              <label key={n.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{n.label}</p>
                  <p className="text-xs text-slate-500">{n.desc}</p>
                </div>
                <div className="relative">
                  <input type="checkbox" checked={settings.notifications?.[n.key] ?? false}
                    onChange={e => setSettings({ ...settings, notifications: { ...settings.notifications, [n.key]: e.target.checked } })}
                    className="sr-only peer" />
                  <div className="w-10 h-6 bg-slate-200 rounded-full peer-checked:bg-blue-600 transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform" />
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
