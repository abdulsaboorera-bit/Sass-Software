"use client";

import { useEffect } from "react";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Keeps the staff session alive for as long as the user is signed in. Tokens are
 * rotated on mount, on a fixed interval, whenever the tab regains focus, and
 * whenever it becomes visible again after being backgrounded — so a user is only
 * ever sent back to the login screen when they explicitly log out.
 */
export default function SessionKeepAlive() {
  useEffect(() => {
    let stopped = false;

    const refresh = () => {
      if (stopped) return;
      void fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
    };

    refresh();

    const timer = window.setInterval(refresh, REFRESH_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", refresh);

    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return null;
}
