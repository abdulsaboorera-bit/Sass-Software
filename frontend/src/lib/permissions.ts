import { useEffect, useState } from "react";
import { getCurrentUser } from "./currentUser";

/**
 * Mirror of the backend's `permits()` matcher (backend/src/middleware/rbac.js).
 * "*" grants everything, "resource.*" grants every action on that resource, and
 * scoped permissions (e.g. "members.view.assigned") never grant the broader
 * "resource.view" — with the one UI exception below that keeps the Members page
 * reachable for assigned-only viewers (parity with the sidebar rule).
 */
export function permits(permissions: string[] | null | undefined, permission?: string): boolean {
  if (!permission) return true;
  if (!permissions) return false;
  if (permissions.includes("*") || permissions.includes(permission)) return true;
  const resource = permission.split(".")[0];
  if (permissions.includes(`${resource}.*`)) return true;
  if (permission === "members.view" && permissions.includes("members.view.assigned")) return true;
  return false;
}

export interface PermissionState {
  /** Granted permission keys; empty while loading or when unavailable. */
  permissions: string[];
  /** Deny-by-default permission check (returns true while permissions are unknown only for "*" grants). */
  can: (permission?: string) => boolean;
  /** True until /api/me resolves — hide mutating UI until then. */
  loading: boolean;
}

/**
 * Loads the signed-in user's tenant permissions once per page load (the
 * /api/me promise is cached by lib/currentUser) and exposes `can()`.
 * Deny-by-default: unknown permissions are false, so create/edit/delete
 * buttons never flash for roles that are not allowed to use them.
 */
export function usePermissions(): PermissionState {
  const [permissions, setPermissions] = useState<string[] | null>(null);

  useEffect(() => {
    let alive = true;
    getCurrentUser()
      .then((data) => {
        if (alive) setPermissions(data.user?.permissions || []);
      })
      .catch(() => {
        if (alive) setPermissions([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  return {
    permissions: permissions || [],
    can: (permission?: string) => permits(permissions, permission),
    loading: permissions === null,
  };
}
