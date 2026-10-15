"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Clock, Bell, Building2, Percent, GraduationCap, Loader2 } from "lucide-react";
import { getCurrentUser } from "@/lib/currentUser";

interface OperatingHour {
  day: number;
  open: string;
  close: string;
  isClosed: boolean;
}

interface SettingsForm {
  operatingHours?: OperatingHour[];
  [key: string]: unknown;
}

interface IndustryConfig {
  endpoint: string;
  title: string;
  subtitle: string;
  nameKey: string;
  nameLabel: string;
  namePlaceholder: string;
  hours: boolean;
  academic: boolean;
  notifications: boolean;
  finance: boolean;
  serviceRates: boolean;
  website: boolean;
  saveKeys: string[];
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

const PROFILE_KEYS = ["address", "phone", "email", "timezone", "currency"];

const INDUSTRY_CONFIGS: Record<string, IndustryConfig> = {
  GYM: {
    endpoint: "/api/gym/settings",
    title: "Gym Settings",
    subtitle: "Configure your gym profile and preferences",
    nameKey: "gymName",
    nameLabel: "Gym Name",
    namePlaceholder: "Your gym name",
    hours: true,
    academic: false,
    notifications: true,
    finance: false,
    serviceRates: false,
    website: false,
    saveKeys: [
      "gymName", ...PROFILE_KEYS, "operatingHours",
      "enableNotifications", "enableWhatsApp", "enableEmail", "enableSMS",
      "reminderDaysBeforeExpiry", "reminderDaysBeforePayment", "lowStockThreshold",
    ],
  },
  SCHOOL: {
    endpoint: "/api/school/settings",
    title: "School Settings",
    subtitle: "Configure your school profile and academic preferences",
    nameKey: "schoolName",
    nameLabel: "School Name",
    namePlaceholder: "Your school name",
    hours: false,
    academic: true,
    notifications: false,
    finance: false,
    serviceRates: false,
    website: true,
    saveKeys: [
      "schoolName", ...PROFILE_KEYS, "website", "principalName", "registrationNo",
      "academicYear", "currentTerm", "passingPercent", "lowAttendanceThreshold", "feeDueDay",
    ],
  },
  RESTAURANT: {
    endpoint: "/api/restaurant/settings",
    title: "Restaurant Settings",
    subtitle: "Configure your restaurant profile and billing preferences",
    nameKey: "restaurantName",
    nameLabel: "Restaurant Name",
    namePlaceholder: "Your restaurant name",
    hours: true,
    academic: false,
    notifications: false,
    finance: true,
    serviceRates: true,
    website: true,
    saveKeys: [
      "restaurantName", ...PROFILE_KEYS, "website", "operatingHours",
      "taxRate", "serviceChargeRate", "deliveryFee", "lowStockThreshold",
    ],
  },
  BOOKSHOP: {
    endpoint: "/api/bookshop/settings",
    title: "Bookshop Settings",
    subtitle: "Configure your bookshop profile and sales preferences",
    nameKey: "businessName",
    nameLabel: "Bookshop Name",
    namePlaceholder: "Your bookshop name",
    hours: false,
    academic: false,
    notifications: false,
    finance: true,
    serviceRates: false,
    website: true,
    saveKeys: ["businessName", ...PROFILE_KEYS, "website", "taxRate", "lowStockThreshold"],
  },
  CAR_RENTAL: {
    endpoint: "/api/car-rental/settings",
    title: "Car Rental Settings",
    subtitle: "Configure your company profile and rental preferences",
    nameKey: "businessName",
    nameLabel: "Company Name",
    namePlaceholder: "Your company name",
    hours: false,
    academic: false,
    notifications: false,
    finance: true,
    serviceRates: false,
    website: true,
    saveKeys: ["businessName", ...PROFILE_KEYS, "website", "taxRate", "lowStockThreshold"],
  },
  REAL_ESTATE: {
    endpoint: "/api/real-estate/settings",
    title: "Real Estate Settings",
    subtitle: "Configure your agency profile and billing preferences",
    nameKey: "businessName",
    nameLabel: "Agency Name",
    namePlaceholder: "Your agency name",
    hours: false,
    academic: false,
    notifications: false,
    finance: true,
    serviceRates: false,
    website: true,
    saveKeys: ["businessName", ...PROFILE_KEYS, "website", "taxRate", "lowStockThreshold"],
  },
};

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white";

export default function SettingsPage() {
  const router = useRouter();
  const [config, setConfig] = useState<IndustryConfig | null>(null);
  const [form, setForm] = useState<SettingsForm>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getCurrentUser();
        const industry = data.user?.tenant?.industry || "GYM";
        if (industry === "CLINIC") { router.replace("/dashboard/clinic/settings"); return; }
        if (industry === "SALON") { router.replace("/dashboard/salon/settings"); return; }
        const cfg = INDUSTRY_CONFIGS[industry] || INDUSTRY_CONFIGS.GYM;
        if (cancelled) return;
        setConfig(cfg);
        const response = await fetch(cfg.endpoint, { credentials: "include" });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || "Unable to load settings");
        if (cancelled) return;
        setForm({ ...(body.settings || {}) });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unable to load settings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  const set = (key: string, value: unknown) => setForm((current) => ({ ...current, [key]: value }));

  const getHour = (day: number) => form.operatingHours?.find((hour) => hour.day === day) || defaultHour(day);

  const updateHour = (day: number, changes: Partial<OperatingHour>) => {
    setForm((current) => {
      const hours = current.operatingHours ? [...current.operatingHours] : DAYS.map((item) => defaultHour(item.value));
      const index = hours.findIndex((hour) => hour.day === day);
      const next = { ...defaultHour(day), ...(index >= 0 ? hours[index] : {}), ...changes };
      if (index >= 0) hours[index] = next;
      else hours.push(next);
      return { ...current, operatingHours: hours };
    });
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true); setError("");
    try {
      const payload: SettingsForm = {};
      for (const key of config.saveKeys) {
        const value = form[key];
        if (value !== undefined) payload[key] = value;
      }
      if (config.hours && !payload.operatingHours) {
        payload.operatingHours = DAYS.map((day) => defaultHour(day.value));
      }
      const res = await fetch(config.endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save");
      if (data.settings) setForm(data.settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save settings");
    }
    setSaving(false);
  };

  if (loading || !config) {
    return <div className="flex items-center justify-center py-20 text-slate-400 text-sm"><Loader2 size={20} className="animate-spin mr-2" /> Loading settings...</div>;
  }

  const field = (key: string, label: string, opts: { type?: string; placeholder?: string } = {}) => (
    <div>
      <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">{label}</label>
      <input
        type={opts.type || "text"}
        value={String(form[key] ?? "")}
        placeholder={opts.placeholder}
        onChange={(e) => set(key, opts.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
        className={inputCls}
      />
    </div>
  );

  const numberField = (key: string, label: string, fallback: number) => (
    <div>
      <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">{label}</label>
      <input
        type="number"
        min="0"
        value={String(form[key] ?? fallback)}
        onChange={(e) => set(key, Number(e.target.value))}
        className={inputCls}
      />
    </div>
  );

  const currencyField = (
    <div>
      <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Currency</label>
      <select value={String(form.currency ?? "PKR")} onChange={(e) => set("currency", e.target.value)} className={inputCls}>
        <option value="PKR">PKR (Pakistani Rupee)</option>
        <option value="USD">USD (US Dollar)</option>
        <option value="AED">AED (UAE Dirham)</option>
        <option value="INR">INR (Indian Rupee)</option>
      </select>
    </div>
  );

  const timezoneField = (
    <div>
      <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Timezone</label>
      <select value={String(form.timezone ?? "Asia/Karachi")} onChange={(e) => set("timezone", e.target.value)} className={inputCls}>
        <option value="Asia/Karachi">Asia/Karachi (PKT)</option>
        <option value="Asia/Dubai">Asia/Dubai (GST)</option>
        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
      </select>
    </div>
  );

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">{config.title}</h2>
          <p className="text-slate-500 text-sm">{config.subtitle}</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm border-none cursor-pointer disabled:opacity-50">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-4">{error}</div>}

      <div className="space-y-6">
        {/* Profile */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={16} className="text-blue-600" />
            <h3 className="text-slate-900 font-bold text-sm">{config.nameLabel.replace(/ Name$/, "")} Profile</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">{config.nameLabel}</label>
              <input type="text" value={String(form[config.nameKey] ?? "")} onChange={(e) => set(config.nameKey, e.target.value)}
                placeholder={config.namePlaceholder} className={inputCls} />
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Address</label>
              <input type="text" value={String(form.address ?? "")} onChange={(e) => set("address", e.target.value)}
                placeholder="Full address" className={inputCls} />
            </div>
            {config.website && (
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Website</label>
                <input type="text" value={String(form.website ?? "")} onChange={(e) => set("website", e.target.value)}
                  placeholder="https://example.com" className={inputCls} />
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              {field("phone", "Phone", { placeholder: "Contact phone" })}
              {field("email", "Email", { type: "email", placeholder: "Contact email" })}
            </div>
            {!config.hours && (
              <div className="grid sm:grid-cols-2 gap-4">
                {timezoneField}
                {currencyField}
              </div>
            )}
          </div>
        </div>

        {/* Operating Hours */}
        {config.hours && (
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
              {timezoneField}
              {currencyField}
            </div>
          </div>
        )}

        {/* Academic */}
        {config.academic && (
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap size={16} className="text-indigo-600" />
              <h3 className="text-slate-900 font-bold text-sm">Academic Settings</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {field("principalName", "Principal Name")}
              {field("registrationNo", "Registration No")}
              {field("academicYear", "Academic Year", { placeholder: "2025-2026" })}
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Current Term</label>
                <select value={String(form.currentTerm ?? "TERM_1")} onChange={(e) => set("currentTerm", e.target.value)} className={inputCls}>
                  <option value="TERM_1">Term 1</option>
                  <option value="TERM_2">Term 2</option>
                  <option value="TERM_3">Term 3</option>
                  <option value="ANNUAL">Annual</option>
                </select>
              </div>
              {numberField("passingPercent", "Passing Percent (%)", 40)}
              {numberField("lowAttendanceThreshold", "Low Attendance Threshold (%)", 75)}
              {numberField("feeDueDay", "Fee Due Day", 10)}
            </div>
          </div>
        )}

        {/* Billing / finance */}
        {config.finance && (
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Percent size={16} className="text-amber-600" />
              <h3 className="text-slate-900 font-bold text-sm">Billing &amp; Stock</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {numberField("taxRate", "Tax Rate (%)", 0)}
              {config.serviceRates && numberField("serviceChargeRate", "Service Charge (%)", 0)}
              {config.serviceRates && numberField("deliveryFee", "Delivery Fee", 0)}
              {numberField("lowStockThreshold", "Low Stock Threshold", 5)}
            </div>
          </div>
        )}

        {/* Notifications */}
        {config.notifications && (
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell size={16} className="text-purple-600" />
              <h3 className="text-slate-900 font-bold text-sm">Notifications</h3>
            </div>
            <div className="space-y-3">
              {[
                { key: "enableNotifications", label: "Enable notifications", desc: `Allow the daily ${config.title.replace(" Settings", "").toLowerCase()} jobs to create alerts` },
                { key: "enableWhatsApp", label: "WhatsApp delivery", desc: "Queue WhatsApp notifications when an adapter is configured" },
                { key: "enableEmail", label: "Email delivery", desc: "Queue email notifications when an adapter is configured" },
                { key: "enableSMS", label: "SMS delivery", desc: "Queue SMS notifications when an adapter is configured" },
              ].map((n) => (
                <label key={n.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{n.label}</p>
                    <p className="text-xs text-slate-500">{n.desc}</p>
                  </div>
                  <div className="relative">
                    <input type="checkbox" checked={Boolean(form[n.key] ?? (n.key === "enableNotifications"))}
                      onChange={(e) => set(n.key, e.target.checked)}
                      className="sr-only peer" />
                    <div className="w-10 h-6 bg-slate-200 rounded-full peer-checked:bg-blue-600 transition-colors" />
                    <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform" />
                  </div>
                </label>
              ))}
            </div>
            <div className="grid sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100">
              {numberField("reminderDaysBeforeExpiry", "Expiry reminder (days)", 3)}
              {numberField("reminderDaysBeforePayment", "Payment reminder (days)", 2)}
              {numberField("lowStockThreshold", "Low stock threshold", 5)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
