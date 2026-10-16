"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Rocket, X } from "lucide-react";

export default function OnboardingBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("nexus-onboarding-dismissed") === "1") return;
    fetch("/api/onboarding", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && !d.completed) setShow(true); })
      .catch(() => {});
  }, []);

  if (!show) return null;

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 sm:px-6 py-2.5 flex items-center gap-3">
      <Rocket size={16} className="text-blue-600 shrink-0" />
      <p className="text-sm text-blue-800 flex-1 min-w-0">
        <span className="font-semibold">Finish setting up your workspace.</span>{" "}
        <Link href="/dashboard/onboarding" className="font-semibold text-blue-600 underline no-underline hover:text-blue-700">
          Start the guided setup
        </Link>
      </p>
      <button
        onClick={() => { sessionStorage.setItem("nexus-onboarding-dismissed", "1"); setShow(false); }}
        className="p-1 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-100 bg-transparent border-none cursor-pointer shrink-0"
        aria-label="Dismiss"
      >
        <X size={15} />
      </button>
    </div>
  );
}
