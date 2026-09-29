"use client";

import { useEffect } from "react";

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

export default function SessionKeepAlive() {
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      void fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
    };
    const timer = window.setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  return null;
}
