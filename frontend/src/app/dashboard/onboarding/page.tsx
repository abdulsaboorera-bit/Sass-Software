"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Rocket, Building2, Database, CheckCircle2, Loader2, ArrowRight, ArrowLeft, PartyPopper, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/currentUser";

const STEPS = ["Welcome", "Business", "Demo data", "Finish"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [industry, setIndustry] = useState<string>("");
  const [businessName, setBusinessName] = useState<string>("");
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{ created: number } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then((d) => {
        setBusinessName(d.user?.tenant?.name || "");
        setIndustry(d.user?.tenant?.industry || "");
      })
      .catch(() => {});
    fetch("/api/onboarding", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.seededDemo) setSeedResult({ created: 0 }); })
      .catch(() => {});
  }, []);

  const seed = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/onboarding/seed-demo", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (res.ok) setSeedResult({ created: data.created || 0 });
    } finally {
      setSeeding(false);
    }
  };

  const finish = async () => {
    setSaving(true);
    try {
      await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ steps: STEPS }),
      });
      router.push("/dashboard");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="max-w-2xl mx-auto">
      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i <= step ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}>
              {i < step ? <CheckCircle2 size={16} /> : i + 1}
            </div>
            <span className={`text-xs font-semibold hidden sm:block ${i <= step ? "text-slate-900" : "text-slate-400"}`}>{label}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? "bg-blue-600" : "bg-slate-200"}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
        {step === 0 && (
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <Rocket size={26} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Welcome{businessName ? `, ${businessName}` : ""}! 👋</h1>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Let’s get your workspace ready in a few quick steps. You can change any of these later in Settings.
            </p>
          </div>
        )}

        {step === 1 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Building2 size={20} className="text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Your business</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2.5 border-b border-slate-100">
                <span className="text-slate-500">Business name</span>
                <span className="font-semibold text-slate-900">{businessName || "—"}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-slate-100">
                <span className="text-slate-500">Industry</span>
                <span className="font-semibold text-slate-900">{industry ? industry.replace("_", " ").toLowerCase() : "—"}</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4">
              Want to update your logo, currency, or contact details? You can do that from <span className="font-semibold">Settings</span>.
            </p>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Database size={20} className="text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Add sample data (optional)</h2>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Populate your dashboard with realistic demo records so you can explore every module. You can delete them anytime.
            </p>
            {seedResult ? (
              <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
                <Sparkles size={15} className="inline mr-1" /> Demo data added{seedResult.created ? ` (${seedResult.created} records)` : ""}.
              </div>
            ) : (
              <button
                onClick={seed}
                disabled={seeding}
                className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 text-sm border-none cursor-pointer disabled:opacity-50"
              >
                {seeding ? <><Loader2 size={15} className="animate-spin" /> Adding…</> : <><Sparkles size={15} /> Add demo data</>}
              </button>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4">
              <PartyPopper size={26} />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">You’re all set!</h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Your workspace is ready. Head to your dashboard to start managing your business.
            </p>
          </div>
        )}

        {/* Nav */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={back}
            disabled={step === 0}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 bg-transparent border-none cursor-pointer disabled:opacity-0"
          >
            <ArrowLeft size={15} /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={next}
              className="inline-flex items-center gap-1.5 bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 text-sm border-none cursor-pointer"
            >
              Continue <ArrowRight size={15} />
            </button>
          ) : (
            <button
              onClick={finish}
              disabled={saving}
              className="inline-flex items-center gap-1.5 bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 text-sm border-none cursor-pointer disabled:opacity-50"
            >
              {saving ? "Finishing…" : "Go to dashboard"} <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
