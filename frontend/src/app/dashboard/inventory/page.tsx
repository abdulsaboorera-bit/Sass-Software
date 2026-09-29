"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, X, Package, AlertTriangle, ArrowUp, ArrowDown } from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  sku?: string;
  category: string;
  quantity: number;
  unit: string;
  costPrice: number;
  sellPrice?: number;
  minStock: number;
  supplierName?: string;
  isActive: boolean;
}

const CATEGORIES = [
  { value: "SUPPLEMENT", label: "Supplements" },
  { value: "DRINK", label: "Drinks" },
  { value: "MERCHANDISE", label: "Merchandise" },
  { value: "EQUIPMENT", label: "Equipment" },
  { value: "OTHER", label: "Other" },
];

interface InventorySummary {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  byCategory?: { category: string; count: number; value: number }[];
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState({ name: "", sku: "", category: "SUPPLEMENT", quantity: "", unit: "pcs", minStock: "5", costPrice: "", sellPrice: "", supplierName: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [movementModal, setMovementModal] = useState<{ item: InventoryItem; type: "PURCHASE" | "SALE" } | null>(null);
  const [movementForm, setMovementForm] = useState({ quantity: "", unitPrice: "", notes: "" });
  const [movementSubmitting, setMovementSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const fetchItems = () => {
    setLoading(true);
    setFetchError("");
    const params = new URLSearchParams({ limit: "200" });
    if (search) params.set("search", search);
    if (categoryFilter) params.set("category", categoryFilter);
    if (showLowStock) params.set("lowStock", "true");
    fetch(`/api/gym/inventory?${params}`, { credentials: "include" })
      .then(r => r.json())
      .then(data => { if (data.items) setItems(data.items); })
      .catch(() => setFetchError("Failed to load inventory items"))
      .finally(() => setLoading(false));
  };

  const fetchSummary = () => {
    fetch("/api/gym/inventory/summary", { credentials: "include" })
      .then(r => r.json())
      .then(data => setSummary(data));
  };

  useEffect(() => {
    const timer = setTimeout(fetchItems, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [search, categoryFilter, showLowStock]);
  useEffect(() => { fetchSummary(); }, []);

  const resetForm = () => { setForm({ name: "", sku: "", category: "SUPPLEMENT", quantity: "", unit: "pcs", minStock: "5", costPrice: "", sellPrice: "", supplierName: "" }); setEditingItem(null); setShowForm(false); setError(""); };

  const startEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setForm({ name: item.name, sku: item.sku || "", category: item.category, quantity: String(item.quantity), unit: item.unit, minStock: String(item.minStock), costPrice: String(item.costPrice), sellPrice: String(item.sellPrice || ""), supplierName: item.supplierName || "" });
    setShowForm(true); setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || form.quantity === "" || form.costPrice === "") { setError("Name, quantity, and cost price are required"); return; }
    setSubmitting(true); setError("");
    try {
      const body: Record<string, unknown> = {
        name: form.name, sku: form.sku || undefined, category: form.category,
         quantity: parseInt(form.quantity, 10), unit: form.unit,
         minStock: parseInt(form.minStock, 10) || 0, costPrice: parseFloat(form.costPrice),
         sellPrice: form.sellPrice ? parseFloat(form.sellPrice) : undefined,
         supplierName: form.supplierName || undefined,
      };
      if (editingItem) {
        body.id = editingItem.id;
        const res = await fetch("/api/gym/inventory", { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
      } else {
        const res = await fetch("/api/gym/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
      }
      resetForm(); fetchItems(); fetchSummary();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setSubmitting(false); }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this inventory item?")) return;
    await fetch(`/api/gym/inventory?id=${id}`, { method: "DELETE", credentials: "include" });
    fetchItems(); fetchSummary();
  };

  const openMovement = (item: InventoryItem, type: "PURCHASE" | "SALE") => {
    setMovementModal({ item, type });
    setMovementForm({ quantity: "", unitPrice: String(item.costPrice), notes: "" });
  };

  const handleMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementModal || !movementForm.quantity) return;
    setMovementSubmitting(true);
    try {
      const res = await fetch("/api/gym/inventory/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          itemId: movementModal.item.id,
          type: movementModal.type,
           quantity: parseInt(movementForm.quantity, 10),
          unitPrice: movementForm.unitPrice ? parseFloat(movementForm.unitPrice) : undefined,
          notes: movementForm.notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMovementModal(null); fetchItems(); fetchSummary();
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Failed"); }
    setMovementSubmitting(false);
  };

  const inputCls = "px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500";

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Gym Inventory</h2>
          <p className="text-slate-500 text-sm">{items.length} items tracked</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm border-none cursor-pointer">
          {showForm ? "Cancel" : "+ Add Item"}
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><Package size={18} className="text-blue-600" /></div>
            <div><p className="text-xl font-black text-slate-900">{summary.totalItems}</p><p className="text-xs text-slate-500">Total Items</p></div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center"><Package size={18} className="text-green-600" /></div>
            <div><p className="text-xl font-black text-slate-900">PKR {Number(summary.totalValue || 0).toLocaleString()}</p><p className="text-xs text-slate-500">Total Value</p></div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center"><AlertTriangle size={18} className="text-red-600" /></div>
            <div><p className="text-xl font-black text-red-600">{summary.lowStockCount}</p><p className="text-xs text-slate-500">Low Stock</p></div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center"><Package size={18} className="text-purple-600" /></div>
            <div><p className="text-xl font-black text-slate-900">{summary.byCategory?.length || 0}</p><p className="text-xs text-slate-500">Categories</p></div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..."
            className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
          <option value="">All Categories</option>
           {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <button onClick={() => setShowLowStock(!showLowStock)}
          className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${showLowStock ? "bg-red-50 border-red-200 text-red-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
          <AlertTriangle size={14} className="inline mr-1" /> Low Stock
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 mb-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-700">{editingItem ? "Edit Item" : "New Item"}</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            <input type="text" placeholder="Item name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
            <input type="text" placeholder="SKU (optional)" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className={inputCls} />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inputCls}>
               {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <input type="number" placeholder="Quantity *" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className={inputCls} />
            <input type="text" placeholder="Unit" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className={inputCls} />
            <input type="number" placeholder="Min stock" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} className={inputCls} />
            <input type="number" placeholder="Cost price *" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })} className={inputCls} />
            <input type="number" placeholder="Sell price" value={form.sellPrice} onChange={e => setForm({ ...form, sellPrice: e.target.value })} className={inputCls} />
             <input type="text" placeholder="Supplier" value={form.supplierName} onChange={e => setForm({ ...form, supplierName: e.target.value })} className={inputCls} />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={submitting} className="bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 border-none cursor-pointer">
            {submitting ? "Saving..." : editingItem ? "Update Item" : "Add Item"}
          </button>
        </form>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-slate-200 bg-slate-50">
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Item</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase hidden md:table-cell">Category</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Stock</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase hidden lg:table-cell">Min</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase hidden lg:table-cell">Cost</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Actions</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">Loading...</td></tr>
            : fetchError ? <tr><td colSpan={6} className="px-4 py-12 text-center text-red-500 text-sm">{fetchError}</td></tr>
            : items.length === 0 ? <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">No inventory items.</td></tr>
            : items.map(item => {
              const isLow = item.quantity <= item.minStock;
              return (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                    {item.sku && <p className="text-xs text-slate-400 font-mono">{item.sku}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell">
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600">{item.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-bold ${isLow ? "text-red-600" : "text-slate-900"}`}>
                      {item.quantity} {item.unit}
                    </span>
                    {isLow && <span className="ml-1.5 text-xs text-red-500">LOW</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 hidden lg:table-cell">{item.minStock}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900 hidden lg:table-cell">PKR {item.costPrice.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                       <button onClick={() => openMovement(item, "PURCHASE")} className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 border-none bg-transparent cursor-pointer" title="Stock In">
                        <ArrowDown size={14} />
                      </button>
                       <button onClick={() => openMovement(item, "SALE")} className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-600 border-none bg-transparent cursor-pointer" title="Stock Out">
                        <ArrowUp size={14} />
                      </button>
                      <button onClick={() => startEdit(item)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 border-none bg-transparent cursor-pointer">Edit</button>
                      <button onClick={() => deleteItem(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 border-none bg-transparent cursor-pointer">Del</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Movement Modal */}
      {movementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setMovementModal(null)}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">
                 {movementModal.type === "PURCHASE" ? "Stock In" : "Stock Out"} — {movementModal.item.name}
              </h3>
              <button onClick={() => setMovementModal(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 border-none bg-transparent cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleMovement} className="p-6 space-y-4">
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Quantity *</label>
                 <input type="number" required min="1" step="1" value={movementForm.quantity} onChange={e => setMovementForm({ ...movementForm, quantity: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Unit Price</label>
                <input type="number" min="0" step="any" value={movementForm.unitPrice} onChange={e => setMovementForm({ ...movementForm, unitPrice: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Notes</label>
                <input type="text" value={movementForm.notes} onChange={e => setMovementForm({ ...movementForm, notes: e.target.value })} placeholder="Optional notes"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setMovementModal(null)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 bg-white cursor-pointer">Cancel</button>
                <button type="submit" disabled={movementSubmitting} className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 border-none cursor-pointer">
                  {movementSubmitting ? "Saving..." : "Confirm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
