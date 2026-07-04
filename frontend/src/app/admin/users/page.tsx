"use client";

import { useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";

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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);

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

  const statusColor = (s: string) => {
    if (s === "ACTIVE") return "bg-emerald-100 text-emerald-700";
    if (s === "INVITED") return "bg-blue-100 text-blue-700";
    if (s === "SUSPENDED") return "bg-red-100 text-red-700";
    return "bg-slate-100 text-slate-600";
  };

  const roleColor = (r: string) => {
    if (r === "SUPER_ADMIN") return "bg-purple-100 text-purple-700";
    return "bg-slate-100 text-slate-600";
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Users</h2>
        <p className="text-slate-500 text-sm">Manage all platform users.</p>
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
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm cursor-pointer"
        >
          <option value="">All Roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="SUPPORT_AGENT">Support Agent</option>
        </select>
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
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Role</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Last Login</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-slate-400 text-sm">Loading...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-slate-400 text-sm">No users found.</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-semibold text-slate-900">{u.name}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{u.email}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{u.tenant?.name || "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleColor(u.role)}`}>
                      {u.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor(u.status)}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-5 py-3.5 text-right">
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
    </div>
  );
}
