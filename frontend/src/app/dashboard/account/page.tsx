"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ShieldOff, Loader2, Copy, Check, KeyRound } from "lucide-react";
import { getCurrentUser } from "@/lib/currentUser";

interface Profile {
  name: string;
  email: string;
  role: string;
  tenantName: string | null;
}

export default function AccountPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [setupData, setSetupData] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [qr, setQr] = useState("");
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showDisable, setShowDisable] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then((data) => {
        const u = data.user;
        if (u) {
          setProfile({
            name: u.user.name,
            email: u.user.email,
            role: u.user.role,
            tenantName: u.tenant?.name || null,
          });
        }
      })
      .catch(() => {});
    fetch("/api/auth/2fa/status", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { enabled: false }))
      .then((d) => setEnabled(Boolean(d.enabled)))
      .catch(() => setEnabled(false));
  }, []);

  const startSetup = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to start setup");
      setSetupData(data);
      const qrRes = await fetch(`/api/lookup/qr?data=${encodeURIComponent(data.otpauthUrl)}`, { credentials: "include" });
      const qrData = await qrRes.json();
      setQr(qrData.qr || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const confirmEnable = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid code");
      setRecoveryCodes(data.recoveryCodes || []);
      setEnabled(true);
      setSetupData(null);
      setQr("");
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const confirmDisable = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid code");
      setEnabled(false);
      setShowDisable(false);
      setCode("");
      setRecoveryCodes([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const copySecret = () => {
    if (setupData) {
      navigator.clipboard.writeText(setupData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Account</h2>
      <p className="text-slate-500 text-sm mb-6">Manage your profile and account security.</p>

      {/* Profile */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <h3 className="text-slate-900 font-bold text-sm mb-4">Profile</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Name</p>
            <p className="text-sm text-slate-900">{profile?.name || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Email</p>
            <p className="text-sm text-slate-900">{profile?.email || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Role</p>
            <p className="text-sm text-slate-900">{profile?.role?.replace("_", " ") || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Business</p>
            <p className="text-sm text-slate-900">{profile?.tenantName || "—"}</p>
          </div>
        </div>
      </div>

      {/* Two-factor */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${enabled ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-500"}`}>
            {enabled ? <ShieldCheck size={18} /> : <ShieldOff size={18} />}
          </div>
          <div>
            <h3 className="text-slate-900 font-bold text-sm">Two-Factor Authentication</h3>
            <p className="text-slate-500 text-xs">
              {enabled === null ? "Checking…" : enabled ? "Enabled — your account is protected by an authenticator app." : "Add an extra layer of security with a 6-digit code."}
            </p>
          </div>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

        {enabled === false && !setupData && (
          <button
            onClick={startSetup}
            disabled={busy}
            className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors text-sm border-none cursor-pointer disabled:opacity-50"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />} Enable 2FA
          </button>
        )}

        {setupData && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-5">
              {qr && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qr} alt="2FA QR code" width={180} height={180} className="rounded-lg border border-slate-200" />
              )}
              <div className="flex-1">
                <p className="text-sm text-slate-600 mb-2">Scan this QR code with Google Authenticator, Authy, or any TOTP app.</p>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Or enter this key manually</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-slate-100 rounded-lg px-3 py-2 text-slate-700 break-all flex-1">{setupData.secret}</code>
                  <button onClick={copySecret} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 bg-white cursor-pointer">
                    {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Enter the 6-digit code to confirm</label>
              <div className="flex gap-2">
                <input
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-40 px-4 py-2.5 rounded-xl border border-slate-200 text-sm tracking-[0.3em] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button
                  onClick={confirmEnable}
                  disabled={busy || code.length < 6}
                  className="bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm border-none cursor-pointer disabled:opacity-50"
                >
                  {busy ? "Verifying…" : "Verify & Enable"}
                </button>
                <button
                  onClick={() => { setSetupData(null); setQr(""); setCode(""); setError(""); }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 bg-white cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {enabled === true && (
          <div className="space-y-4">
            {recoveryCodes.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-sm font-semibold text-amber-800 mb-2">Save these recovery codes now — they won’t be shown again.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {recoveryCodes.map((c) => (
                    <code key={c} className="text-xs bg-white rounded px-2 py-1 text-slate-700 border border-amber-200 text-center">{c}</code>
                  ))}
                </div>
              </div>
            )}
            {!showDisable ? (
              <button
                onClick={() => setShowDisable(true)}
                className="inline-flex items-center gap-2 border border-red-200 text-red-600 font-semibold px-4 py-2 rounded-xl hover:bg-red-50 transition-colors text-sm bg-white cursor-pointer"
              >
                <ShieldOff size={15} /> Disable 2FA
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-40 px-4 py-2.5 rounded-xl border border-slate-200 text-sm tracking-[0.3em] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button onClick={confirmDisable} disabled={busy || code.length < 6} className="bg-red-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-red-700 text-sm border-none cursor-pointer disabled:opacity-50">
                  {busy ? "Disabling…" : "Confirm Disable"}
                </button>
                <button onClick={() => { setShowDisable(false); setCode(""); setError(""); }} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 bg-white cursor-pointer">
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
