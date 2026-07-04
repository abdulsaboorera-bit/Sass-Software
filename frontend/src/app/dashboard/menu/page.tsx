"use client";

import { useEffect, useState } from "react";

interface MenuItem { id: string; name: string; price: string; costPrice: string | null; description: string | null; isActive: boolean }
interface Category { id: string; name: string; menuItems: MenuItem[] }

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [catForm, setCatForm] = useState({ name: "" });
  const [itemForm, setItemForm] = useState({ name: "", categoryId: "", price: "", costPrice: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchMenu = () => {
    fetch("/api/restaurant/menu").then(r => r.json()).then(data => { if (data.categories) setCategories(data.categories); }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchMenu(); }, []);

  const resetCatForm = () => { setCatForm({ name: "" }); setEditingCategory(null); setShowCategoryForm(false); setError(""); };
  const resetItemForm = () => { setItemForm({ name: "", categoryId: "", price: "", costPrice: "", description: "" }); setEditingItem(null); setShowItemForm(false); setError(""); };

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name) { setError("Name is required"); return; }
    setSubmitting(true);
    setError("");
    try {
      if (editingCategory) {
        const res = await fetch("/api/restaurant/menu", {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingCategory.id, type: "category", name: catForm.name }),
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      } else {
        const res = await fetch("/api/restaurant/menu", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "category", name: catForm.name }),
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      }
      resetCatForm();
      fetchMenu();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setSubmitting(false); }
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name || !itemForm.categoryId || !itemForm.price) { setError("Name, category, and price are required"); return; }
    setSubmitting(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        type: "item", name: itemForm.name, categoryId: itemForm.categoryId,
        price: parseFloat(itemForm.price), costPrice: itemForm.costPrice ? parseFloat(itemForm.costPrice) : undefined,
        description: itemForm.description || undefined,
      };
      if (editingItem) {
        body.id = editingItem.id;
        const res = await fetch("/api/restaurant/menu", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      } else {
        const res = await fetch("/api/restaurant/menu", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      }
      resetItemForm();
      fetchMenu();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setSubmitting(false); }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this category and all its items?")) return;
    await fetch(`/api/restaurant/menu?id=${id}&type=category`, { method: "DELETE" });
    fetchMenu();
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this menu item?")) return;
    await fetch(`/api/restaurant/menu?id=${id}&type=item`, { method: "DELETE" });
    fetchMenu();
  };

  const inputCls = "px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500";

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Menu</h2>
          <p className="text-slate-500 text-sm">Manage your menu categories and items.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { resetItemForm(); setShowItemForm(!showItemForm); setShowCategoryForm(false); }} className="bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm border-none cursor-pointer">
            {showItemForm ? "Cancel" : "Add Item"}
          </button>
          <button onClick={() => { resetCatForm(); setShowCategoryForm(!showCategoryForm); setShowItemForm(false); }} className="bg-slate-100 text-slate-700 font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-200 transition-colors text-sm border-none cursor-pointer">
            {showCategoryForm ? "Cancel" : "Add Category"}
          </button>
        </div>
      </div>

      {showCategoryForm && (
        <form onSubmit={handleCatSubmit} className="bg-white border border-slate-200 rounded-xl p-5 mb-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-700">{editingCategory ? "Edit Category" : "New Category"}</h3>
          <input type="text" placeholder="Category name *" value={catForm.name} onChange={e => setCatForm({ name: e.target.value })} className={inputCls} />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={submitting} className="bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 border-none cursor-pointer">
            {submitting ? "Saving..." : editingCategory ? "Update Category" : "Add Category"}
          </button>
        </form>
      )}

      {showItemForm && (
        <form onSubmit={handleItemSubmit} className="bg-white border border-slate-200 rounded-xl p-5 mb-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-700">{editingItem ? "Edit Menu Item" : "New Menu Item"}</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <input type="text" placeholder="Item name *" value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} className={inputCls} />
            <select value={itemForm.categoryId} onChange={e => setItemForm({ ...itemForm, categoryId: e.target.value })} className={inputCls}>
              <option value="">Select category *</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="number" step="0.01" placeholder="Price *" value={itemForm.price} onChange={e => setItemForm({ ...itemForm, price: e.target.value })} className={inputCls} />
            <input type="number" step="0.01" placeholder="Cost price" value={itemForm.costPrice} onChange={e => setItemForm({ ...itemForm, costPrice: e.target.value })} className={inputCls} />
          </div>
          <textarea placeholder="Description" value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} className={`${inputCls} w-full`} rows={2} />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={submitting} className="bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 border-none cursor-pointer">
            {submitting ? "Saving..." : editingItem ? "Update Item" : "Add Item"}
          </button>
        </form>
      )}

      {loading ? <div className="text-center py-12 text-slate-400 text-sm">Loading...</div>
      : categories.length === 0 ? <div className="text-center py-12 text-slate-400 text-sm">No menu categories yet.</div>
      : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-slate-900 font-bold text-sm">{cat.name}</h3>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingCategory(cat); setCatForm({ name: cat.name }); setShowCategoryForm(true); setShowItemForm(false); }} className="text-xs text-blue-600 font-semibold hover:text-blue-700 border-none bg-transparent cursor-pointer">Edit</button>
                  <button onClick={() => deleteCategory(cat.id)} className="text-xs text-red-500 font-semibold hover:text-red-600 border-none bg-transparent cursor-pointer">Del</button>
                </div>
              </div>
              {cat.menuItems.length === 0 ? (
                <p className="text-slate-400 text-xs">No items</p>
              ) : (
                <div className="space-y-2">
                  {cat.menuItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-slate-700">{item.name}</span>
                        {item.description && <p className="text-[10px] text-slate-400 truncate">{item.description}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">PKR {Number(item.price).toLocaleString()}</span>
                        <button onClick={() => { setEditingItem(item); setItemForm({ name: item.name, categoryId: cat.id, price: item.price, costPrice: item.costPrice || "", description: item.description || "" }); setShowItemForm(true); setShowCategoryForm(false); }} className="text-[10px] text-blue-600 font-semibold hover:text-blue-700 border-none bg-transparent cursor-pointer">Edit</button>
                        <button onClick={() => deleteItem(item.id)} className="text-[10px] text-red-500 font-semibold hover:text-red-600 border-none bg-transparent cursor-pointer">Del</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
