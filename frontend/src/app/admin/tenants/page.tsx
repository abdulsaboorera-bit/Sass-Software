"use client";

import { useEffect, useState } from "react";
import { Search, Plus, ChevronLeft, ChevronRight, AlertCircle, X, Pencil } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  industry: string;
  plan: string;
  status: string;
  createdAt: string;
  _count: { users: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [createForm, setCreateForm] = useState({ name: "", slug: "", industry: "SCHOOL", plan: "TRIAL" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTenants();
  }, [page, statusFilter]);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/tenants?${params}`, { credentials: "include" });
      const data = await res.json();
      setTenants(data.tenants || []);
      setPagination(data.pagination || null);
    } catch (e) {
      setError("Failed to load tenants");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTenants();
  };

  const toggleStatus = async (tenant: Tenant) => {
    const newStatus = tenant.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      setActionLoading(tenant.id);
      await fetch("/api/admin/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: tenant.id, status: newStatus }),
      });
      setTenants((prev) =>
        prev.map((t) => (t.id === tenant.id ? { ...t, status: newStatus } : t))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const openCreate = () => {
    setEditingTenant(null);
    setCreateForm({ name: "", slug: "", industry: "SCHOOL", plan: "TRIAL" });
    setShowCreateModal(true);
  };

  const openEdit = (t: Tenant) => {
    setEditingTenant(t);
    setCreateForm({ name: t.name, slug: t.slug, industry: t.industry, plan: t.plan });
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingTenant(null);
    setCreateForm({ name: "", slug: "", industry: "SCHOOL", plan: "TRIAL" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = editingTenant
        ? await fetch("/api/admin/tenants", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ id: editingTenant.id, name: createForm.name, plan: createForm.plan }),
          })
        : await fetch("/api/admin/tenants", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(createForm),
          });
      if (res.ok) {
        closeModal();
        fetchTenants();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === "ACTIVE") return "bg-emerald-100 text-emerald-700";
    if (s === "TRIAL") return "bg-blue-100 text-blue-700";
    if (s === "SUSPENDED") return "bg-red-100 text-red-700";
    return "bg-slate-100 text-slate-600";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Tenants</h2>
          <p className="text-slate-500 text-sm">Manage all tenant organizations.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer border-none"
        >
          <Plus size={16} />
          New Tenant
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
              placeholder="Search tenants..."
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
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm cursor-pointer"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="TRIAL">Trial</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="CANCELLED">Cancelled</option>
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
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Industry</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Plan</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Users</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Created</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-slate-400 text-sm">Loading...</td>
              </tr>
            ) : tenants.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-slate-400 text-sm">No tenants found.</td>
              </tr>
            ) : (
              tenants.map((t) => (
                <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-slate-900 font-semibold text-sm">{t.name}</p>
                    <p className="text-slate-400 text-xs">{t.slug}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{t.industry}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{t.plan}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor(t.status)}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{t._count?.users || 0}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEdit(t)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors border-none bg-transparent cursor-pointer"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => toggleStatus(t)}
                        disabled={actionLoading === t.id}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border-none transition-colors ${
                          t.status === "ACTIVE"
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        }`}
                      >
                        {actionLoading === t.id ? "..." : t.status === "ACTIVE" ? "Suspend" : "Activate"}
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
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900">{editingTenant ? "Edit Tenant" : "Create New Tenant"}</h3>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer border-none bg-transparent">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Slug</label>
                <input
                  type="text"
                  required
                  disabled={!!editingTenant}
                  value={createForm.slug}
                  onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Industry</label>
                <select
                  disabled={!!editingTenant}
                  value={createForm.industry}
                  onChange={(e) => setCreateForm({ ...createForm, industry: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="SCHOOL">School</option>
                  <option value="CLINIC">Clinic</option>
                  <option value="GYM">Gym</option>
                  <option value="RESTAURANT">Restaurant</option>
                  <option value="BOOKSHOP">Bookshop</option>
                  <option value="CAR_RENTAL">Car Rental</option>
                </select>
                {editingTenant && <p className="text-[11px] text-slate-400 mt-1">Slug and industry can&apos;t be changed after creation.</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Plan</label>
                <select
                  value={createForm.plan}
                  onChange={(e) => setCreateForm({ ...createForm, plan: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="TRIAL">Trial</option>
                  <option value="STARTER">Starter</option>
                  <option value="PROFESSIONAL">Professional</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer border-none bg-transparent">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 cursor-pointer border-none disabled:opacity-50">
                  {creating ? "Saving..." : editingTenant ? "Save Changes" : "Create Tenant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
