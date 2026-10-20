"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users, ShieldCheck, Plus, Search, X, Trash2, Loader2, AlertCircle,
  Check, KeyRound, Pencil,
} from "lucide-react";
import { usePermissions } from "@/lib/permissions";

type Role = {
  id: string;
  name: string;
  slug: string;
  isSystem: boolean;
  permissions: string[];
  memberCount: number;
  editable: boolean;
};

type Member = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  isActive: boolean;
  lastLoginAt: string | null;
  role: { id: string; name: string; slug: string } | null;
};

type PermGroup = { resource: string; label: string; permissions: { key: string; label: string }[] };

export default function TeamPage() {
  const { can } = usePermissions();
  const assignable = (r: Role) => r.permissions.every((p) => can(p));
  const [tab, setTab] = useState<"members" | "roles">("members");
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [groups, setGroups] = useState<PermGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  // member modal
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", password: "", roleId: "" });
  const [tempPassword, setTempPassword] = useState<{ email: string; password: string } | null>(null);

  // role modal
  const [roleModal, setRoleModal] = useState<{ id?: string; name: string; permissions: string[] } | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [mRes, rRes, pRes] = await Promise.all([
        fetch("/api/team/members", { credentials: "include" }),
        fetch("/api/team/roles", { credentials: "include" }),
        fetch("/api/team/permissions", { credentials: "include" }),
      ]);
      if (mRes.status === 403 || rRes.status === 403) {
        setForbidden(true);
        return;
      }
      const m = await mRes.json();
      const r = await rRes.json();
      const p = await pRes.json();
      setMembers(m.members || []);
      setRoles(r.roles || []);
      setGroups(p.groups || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load team");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  }, [members, search]);

  const createMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/team/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...addForm, password: addForm.password || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add member");
      setShowAdd(false);
      setAddForm({ name: "", email: "", password: "", roleId: "" });
      if (data.temporaryPassword) setTempPassword({ email: data.member.email, password: data.temporaryPassword });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add member");
    } finally {
      setBusy(false);
    }
  };

  const changeRole = async (member: Member, roleId: string) => {
    setError("");
    const res = await fetch(`/api/team/members/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ roleId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to change role");
    }
    await load();
  };

  const toggleActive = async (member: Member) => {
    setError("");
    const res = await fetch(`/api/team/members/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isActive: !member.isActive }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to update member");
    }
    await load();
  };

  const removeMember = async (member: Member) => {
    if (!window.confirm(`Remove ${member.name} from this workspace?`)) return;
    setError("");
    const res = await fetch(`/api/team/members/${member.id}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to remove member");
    }
    await load();
  };

  const saveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleModal) return;
    setBusy(true);
    setError("");
    try {
      const { id, name, permissions } = roleModal;
      const res = await fetch(id ? `/api/team/roles/${id}` : "/api/team/roles", {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, permissions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save role");
      setRoleModal(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save role");
    } finally {
      setBusy(false);
    }
  };

  const deleteRole = async (role: Role) => {
    if (!window.confirm(`Delete the "${role.name}" role?`)) return;
    setError("");
    const res = await fetch(`/api/team/roles/${role.id}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to delete role");
    }
    await load();
  };

  if (forbidden) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center">
        <AlertCircle size={28} className="mx-auto text-amber-500 mb-3" />
        <p className="text-slate-700 font-semibold">You don&apos;t have access to team management.</p>
        <p className="text-slate-500 text-sm mt-1">Ask an owner or administrator to grant you the settings permission.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Team &amp; Roles</h2>
          <p className="text-slate-500 text-sm">Invite your staff and control exactly what each role can see and do.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 bg-slate-100 p-1 rounded-lg w-fit">
        {(["members", "roles"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold cursor-pointer border-none transition-colors ${
              tab === t ? "bg-white text-slate-900 shadow-sm" : "bg-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "members" ? "Members" : "Roles"}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 size={22} className="animate-spin" />
        </div>
      ) : tab === "members" ? (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search members by name or email..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <button
              onClick={() => { setAddForm({ name: "", email: "", password: "", roleId: roles[0]?.id || "" }); setShowAdd(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer border-none ml-auto"
            >
              <Plus size={16} /> Add member
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Member</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400 text-sm">No members found.</td></tr>
                ) : filteredMembers.map((m) => (
                  <tr key={m.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-5 py-3.5">
                      <p className="text-slate-900 font-semibold text-sm">{m.name}</p>
                      <p className="text-slate-400 text-xs">{m.email}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        value={m.role?.id || ""}
                        onChange={(e) => changeRole(m, e.target.value)}
                        className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm bg-white cursor-pointer"
                      >
                        {roles.filter((r) => r.id === m.role?.id || assignable(r)).map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => toggleActive(m)}
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer border-none ${
                          m.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {m.isActive ? "Active" : "Disabled"}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => removeMember(m)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer border-none bg-transparent"
                        title="Remove member"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setRoleModal({ name: "", permissions: ["analytics.view"] })}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer border-none"
            >
              <Plus size={16} /> New role
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {roles.map((r) => (
              <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-slate-400" />
                    <p className="text-slate-900 font-semibold text-sm">{r.name}</p>
                  </div>
                  {r.isSystem && <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">SYSTEM</span>}
                </div>
                <p className="text-slate-400 text-xs mt-2">{r.permissions.includes("*") ? "Full access" : `${r.permissions.length} permissions`}</p>
                <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1"><Users size={11} /> {r.memberCount} {r.memberCount === 1 ? "member" : "members"}</p>
                {r.editable && (
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => setRoleModal({ id: r.id, name: r.name, permissions: r.permissions.includes("*") ? [] : r.permissions })}
                      className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 cursor-pointer border-none bg-transparent"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                    {!r.isSystem && (
                      <button
                        onClick={() => deleteRole(r)}
                        className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-600 cursor-pointer border-none bg-transparent ml-auto"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add member modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900">Add team member</h3>
              <button onClick={() => setShowAdd(false)} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer border-none bg-transparent">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={createMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full name</label>
                <input required value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                <input required type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Role</label>
                <select required value={addForm.roleId} onChange={(e) => setAddForm({ ...addForm, roleId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white cursor-pointer">
                  <option value="">Select a role…</option>
                  {roles.filter(assignable).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Password <span className="text-slate-400 font-normal">(optional)</span></label>
                <input type="text" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  placeholder="Leave blank to auto-generate"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer border-none bg-transparent">Cancel</button>
                <button type="submit" disabled={busy} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 cursor-pointer border-none disabled:opacity-50">
                  {busy ? "Adding…" : "Add member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Temporary password dialog */}
      {tempPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 text-center">
            <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <KeyRound size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Member added</h3>
            <p className="text-slate-500 text-sm mb-4">Share these sign-in details with <span className="font-semibold text-slate-700">{tempPassword.email}</span>.</p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-mono text-slate-800 mb-4 select-all">
              {tempPassword.password}
            </div>
            <button onClick={() => setTempPassword(null)} className="w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 cursor-pointer border-none">
              Done
            </button>
          </div>
        </div>
      )}

      {/* Role editor modal */}
      {roleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">{roleModal.id ? "Edit role" : "New role"}</h3>
              <button onClick={() => setRoleModal(null)} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer border-none bg-transparent">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={saveRole} className="flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Role name</label>
                <input required value={roleModal.name} onChange={(e) => setRoleModal({ ...roleModal, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 mb-5" />

                <p className="text-xs font-semibold text-slate-600 mb-2">Permissions</p>
                <div className="space-y-4">
                  {groups.map((g) => (
                    <div key={g.resource}>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">{g.label}</p>
                      <div className="flex flex-wrap gap-2">
                        {g.permissions.map((p) => {
                          const active = roleModal.permissions.includes(p.key);
                          const grantable = can(p.key);
                          return (
                            <button
                              key={p.key}
                              type="button"
                              disabled={!grantable && !active}
                              title={grantable ? undefined : "You don't hold this permission, so you can't grant it"}
                              onClick={() => setRoleModal({
                                ...roleModal,
                                permissions: active
                                  ? roleModal.permissions.filter((x) => x !== p.key)
                                  : [...roleModal.permissions, p.key],
                              })}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
                                active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                              } ${!grantable && !active ? "opacity-45 cursor-not-allowed" : ""}`}
                            >
                              {active && <Check size={12} />}
                              {p.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 p-6 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setRoleModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer border-none bg-transparent">Cancel</button>
                <button type="submit" disabled={busy} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 cursor-pointer border-none disabled:opacity-50">
                  {busy ? "Saving…" : "Save role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
