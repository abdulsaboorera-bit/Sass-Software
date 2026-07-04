"use client";

import { Shield, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const platformRoles = [
  {
    name: "Super Admin",
    slug: "SUPER_ADMIN",
    description: "Full platform access. Can manage all tenants, users, and settings.",
    permissions: [
      "tenants.read", "tenants.write", "tenants.suspend",
      "users.read", "users.write", "users.suspend",
      "roles.read", "roles.write",
      "settings.read", "settings.write",
      "analytics.read", "billing.read",
    ],
  },
  {
    name: "Support Agent",
    slug: "SUPPORT_AGENT",
    description: "Can view tenants and users, and perform limited support actions.",
    permissions: [
      "tenants.read",
      "users.read",
      "analytics.read",
    ],
  },
];

const permissionGroups = [
  { group: "Tenants", perms: ["tenants.read", "tenants.write", "tenants.suspend"] },
  { group: "Users", perms: ["users.read", "users.write", "users.suspend"] },
  { group: "Roles", perms: ["roles.read", "roles.write"] },
  { group: "Settings", perms: ["settings.read", "settings.write"] },
  { group: "Analytics", perms: ["analytics.read"] },
  { group: "Billing", perms: ["billing.read"] },
];

export default function RolesPage() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Roles & Permissions</h2>
        <p className="text-slate-500 text-sm">Platform-level roles and their permissions.</p>
      </div>

      <div className="space-y-4">
        {platformRoles.map((role) => (
          <div key={role.slug} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Shield size={18} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="text-slate-900 font-bold text-sm">{role.name}</h3>
                  <p className="text-slate-500 text-xs">{role.description}</p>
                </div>
              </div>
              <button
                onClick={() => setExpanded(expanded === role.slug ? null : role.slug)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer border-none bg-transparent transition-colors"
              >
                {expanded === role.slug ? <EyeOff size={14} /> : <Eye size={14} />}
                {expanded === role.slug ? "Hide" : "View"} Permissions
              </button>
            </div>

            {expanded === role.slug && (
              <div className="border-t border-slate-200 p-5 bg-slate-50">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {permissionGroups.map((pg) => (
                    <div key={pg.group}>
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-2">{pg.group}</p>
                      <div className="space-y-1.5">
                        {pg.perms.map((perm) => {
                          const has = role.permissions.includes(perm);
                          return (
                            <div key={perm} className="flex items-center gap-2 text-xs">
                              <span className={`w-2 h-2 rounded-full ${has ? "bg-emerald-500" : "bg-slate-300"}`} />
                              <span className={has ? "text-slate-700" : "text-slate-400"}>
                                {perm.split(".")[1]}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
