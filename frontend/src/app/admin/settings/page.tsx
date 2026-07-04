"use client";

import { useState } from "react";
import { Settings, Check, Info } from "lucide-react";

interface Config {
  appName: string;
  defaultPlan: string;
  trialDurationDays: number;
  supportEmail: string;
}

export default function SettingsPage() {
  const [config, setConfig] = useState<Config>({
    appName: "Orbitrix ERP",
    defaultPlan: "TRIAL",
    trialDurationDays: 14,
    supportEmail: "support@orbitrixerp.com",
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Platform Settings</h2>
        <p className="text-slate-500 text-sm">Configure platform-wide settings.</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* General */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Settings size={18} className="text-slate-400" />
            <h3 className="text-slate-900 font-bold text-sm">General</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">App Name</label>
              <input
                type="text"
                value={config.appName}
                onChange={(e) => setConfig({ ...config, appName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Support Email</label>
              <input
                type="email"
                value={config.supportEmail}
                onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Info size={18} className="text-slate-400" />
            <h3 className="text-slate-900 font-bold text-sm">Subscription Defaults</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Default Plan for New Tenants</label>
              <select
                value={config.defaultPlan}
                onChange={(e) => setConfig({ ...config, defaultPlan: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="TRIAL">Trial</option>
                <option value="STARTER">Starter</option>
                <option value="PROFESSIONAL">Professional</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Trial Duration (days)</label>
              <input
                type="number"
                min={1}
                value={config.trialDurationDays}
                onChange={(e) => setConfig({ ...config, trialDurationDays: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 cursor-pointer border-none transition-colors"
          >
            {saved ? <Check size={16} /> : null}
            {saved ? "Saved!" : "Save Settings"}
          </button>
          <p className="text-slate-400 text-xs">Settings are stored locally (no API).</p>
        </div>
      </div>
    </div>
  );
}
