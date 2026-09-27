"use client";

import { useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight, AlertCircle, Plus, X, Pencil, Trash2 } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
  tenant: { id: string; name: string; slug: string } | null;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  industry: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const emptyForm = { name: "", email: "", password: "", assignment: "platform" as "platform" | "tenant", tenantId: "" };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  useEffect(() => {
    fetch("/api/admin/tenants?limit=200", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data.tenants) setTenants(data.tenants); });
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/users?${params}`, { credentials: "include" });
      const data = await res.json();
      setUsers(data.users || []);
      setPagination(data.pagination || null);
    } catch (e) {
      setError("Failed to load users");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const toggleStatus = async (user: User) => {
    const newStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      setActionLoading(user.id);
      await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: user.id, status: newStatus }),
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Delete user "${user.name}" (${user.email})? This cannot be undone.`)) return;
    try {
      setActionLoading(user.id);
      const res = await fetch(`/api/admin/users?id=${user.id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error();
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch {
      alert("Failed to delete user");
    } finally {
      setActionLoading(null);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setForm({
      name: u.name,
      email: u.email,
      password: "",
      assignment: u.tenant ? "tenant" : "platform",
      tenantId: u.tenant?.id || "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const tenantId = form.assignment === "tenant" ? form.tenantId : null;
      if (form.assignment === "tenant" && !tenantId) throw new Error("Select a tenant");

      if (editing) {
        const payload: Record<string, unknown> = { id: editing.id, name: form.name, email: form.email, tenantId };
        if (form.password) payload.password = form.password;
        const res = await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update user");
      } else {
        if (!form.password) throw new Error("Password is required");
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: form.email, password: form.password, tenantId: tenantId || undefined }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create user");
      }
      closeModal();
      fetchUsers();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === "ACTIVE") return "bg-emerald-100 text-emerald-700";
    if (s === "INVITED") return "bg-blue-100 text-blue-700";
    if (s === "SUSPENDED") return "bg-red-100 text-red-700";
    return "bg-slate-100 text-slate-600";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Users</h2>
          <p className="text-slate-500 text-sm">Manage platform admins and tenant owner logins.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer border-none"
        >
          <Plus size={16} />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm text-slate-700 cursor-pointer border-none transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Name</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Email</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Tenant</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Last Login</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-sm">Loading...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-sm">No users found.</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-semibold text-slate-900">{u.name}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{u.email}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">
                    {u.tenant ? u.tenant.name : <span className="text-purple-600 font-medium">Platform Admin</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor(u.status)}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEdit(u)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors border-none bg-transparent cursor-pointer"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => toggleStatus(u)}
                        disabled={actionLoading === u.id}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border-none transition-colors ${
                          u.status === "ACTIVE"
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        }`}
                      >
                        {actionLoading === u.id ? "..." : u.status === "ACTIVE" ? "Suspend" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        disabled={actionLoading === u.id}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors border-none bg-transparent cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-slate-500 text-xs">
            Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer bg-white"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-slate-600">Page {pagination.page} of {pagination.pages}</span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page >= pagination.pages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer bg-white"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900">{editing ? "Edit User" : "Add User"}</h3>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer border-none bg-transparent">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{formError}</div>}
              {editing && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Name</label>
                  <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                {!editing && <p className="text-[11px] text-slate-400 mb-1">This email + password becomes their login directly.</p>}
                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {editing ? "New Password (leave blank to keep current)" : "Password"}
                </label>
                <input type="password" required={!editing} minLength={8} value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Access</label>
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer">
                    <input type="radio" checked={form.assignment === "platform"}
                      onChange={() => setForm({ ...form, assignment: "platform" })} />
                    Platform Super Admin
                  </label>
                  <label className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer">
                    <input type="radio" checked={form.assignment === "tenant"}
                      onChange={() => setForm({ ...form, assignment: "tenant" })} />
                    Owner of a tenant
                  </label>
                </div>
                {form.assignment === "tenant" && (
                  <select required value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                    <option value="">Select a tenant</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.industry})</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer border-none bg-transparent">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 cursor-pointer border-none disabled:opacity-50">
                  {saving ? "Saving..." : editing ? "Save Changes" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
