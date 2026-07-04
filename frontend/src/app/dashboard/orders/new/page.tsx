"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

interface MenuItem { id: string; name: string; price: string; categoryId: string }
interface Table { id: string; number: number; capacity: number; status: string }
interface Category { id: string; name: string; menuItems: MenuItem[] }

export default function NewOrderPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [orderType, setOrderType] = useState("DINE_IN");
  const [tableId, setTableId] = useState("");
  const [items, setItems] = useState<{ menuItemId: string; quantity: number; notes: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/restaurant/menu").then(r => r.json()),
      fetch("/api/restaurant/tables").then(r => r.json()),
    ]).then(([menuData, tablesData]) => {
      if (menuData.categories) setCategories(menuData.categories);
      if (tablesData.tables) setTables(tablesData.tables.filter((t: Table) => t.status === "AVAILABLE"));
    });
  }, []);

  const allItems = categories.flatMap(c => c.menuItems);

  const addItem = () => setItems([...items, { menuItemId: allItems[0]?.id || "", quantity: 1, notes: "" }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string | number) => {
    const next = [...items];
    (next[i] as Record<string, unknown>)[field] = value;
    setItems(next);
  };

  const total = items.reduce((sum, item) => {
    const mi = allItems.find(m => m.id === item.menuItemId);
    return sum + (mi ? Number(mi.price) * item.quantity : 0);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { setError("Add at least one item"); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/restaurant/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId: tableId || undefined, type: orderType, items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      router.push("/dashboard/orders");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <Link href="/dashboard/orders" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm mb-4 no-underline">
        <ArrowLeft size={14} /> Back to Orders
      </Link>
      <h2 className="text-2xl font-extrabold text-slate-900 mb-1">New Order</h2>
      <p className="text-slate-500 text-sm mb-6">Create a new restaurant order.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Order Type</label>
            <select value={orderType} onChange={e => setOrderType(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
              <option value="DINE_IN">Dine In</option>
              <option value="TAKEAWAY">Takeaway</option>
              <option value="DELIVERY">Delivery</option>
            </select>
          </div>
          {orderType === "DINE_IN" && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Table</label>
              <select value={tableId} onChange={e => setTableId(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                <option value="">Select table</option>
                {tables.map(t => <option key={t.id} value={t.id}>Table {t.number} ({t.capacity} seats)</option>)}
              </select>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-slate-700">Items</label>
            <button type="button" onClick={addItem} className="inline-flex items-center gap-1 text-blue-600 text-sm font-semibold hover:text-blue-700 bg-transparent border-none cursor-pointer">
              <Plus size={14} /> Add Item
            </button>
          </div>
          {items.length === 0 ? (
            <p className="text-slate-400 text-sm py-4 text-center border border-dashed border-slate-200 rounded-xl">No items added. Click &quot;Add Item&quot; to start.</p>
          ) : (
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-start bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <select value={item.menuItemId} onChange={e => updateItem(i, "menuItemId", e.target.value)} className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    {categories.map(c => (
                      <optgroup key={c.id} label={c.name}>
                        {c.menuItems.map(mi => <option key={mi.id} value={mi.id}>{mi.name} — PKR {Number(mi.price).toLocaleString()}</option>)}
                      </optgroup>
                    ))}
                  </select>
                  <input type="number" min="1" value={item.quantity} onChange={e => updateItem(i, "quantity", parseInt(e.target.value) || 1)} className="w-16 px-2 py-2 bg-white border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  <button type="button" onClick={() => removeItem(i)} className="p-2 text-slate-400 hover:text-red-500 bg-transparent border-none cursor-pointer">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-right">
            <span className="text-slate-500 text-sm">Total: </span>
            <span className="text-xl font-black text-slate-900">PKR {total.toLocaleString()}</span>
          </div>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button type="submit" disabled={submitting || items.length === 0} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm border-none cursor-pointer">
          {submitting ? "Creating..." : "Create Order"}
        </button>
      </form>
    </div>
  );
}
