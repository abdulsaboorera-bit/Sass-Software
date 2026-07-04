"use client";

import { useEffect, useState } from "react";

interface Order { id: string; orderNumber: number; type: string; status: string; total: string; createdAt: string; table: { number: number } | null; orderItems: { quantity: number; menuItem: { name: string } }[] }
interface TableOption { id: string; number: number; capacity: number; status: string }
interface MenuItemOption { id: string; name: string; price: string }
interface OrderItemForm { menuItemId: string; quantity: string }

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [tables, setTables] = useState<TableOption[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemOption[]>([]);
  const [form, setForm] = useState({ tableId: "", type: "DINE_IN" });
  const [orderItems, setOrderItems] = useState<OrderItemForm[]>([{ menuItemId: "", quantity: "1" }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchOrders = () => {
    fetch("/api/restaurant/orders?limit=50").then(r => r.json()).then(data => { if (data.orders) setOrders(data.orders); }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const openForm = async () => {
    setShowForm(true);
    setError("");
    const [tRes, mRes] = await Promise.all([
      fetch("/api/restaurant/tables").then(r => r.json()),
      fetch("/api/restaurant/menu").then(r => r.json()),
    ]);
    if (tRes.tables) setTables(tRes.tables);
    if (mRes.categories) setMenuItems(mRes.categories.flatMap((c: { menuItems: MenuItemOption[] }) => c.menuItems));
  };

  const resetForm = () => { setForm({ tableId: "", type: "DINE_IN" }); setOrderItems([{ menuItemId: "", quantity: "1" }]); setShowForm(false); setError(""); };

  const addOrderItem = () => setOrderItems([...orderItems, { menuItemId: "", quantity: "1" }]);
  const removeOrderItem = (i: number) => setOrderItems(orderItems.filter((_, idx) => idx !== i));
  const updateOrderItem = (i: number, field: string, value: string) => {
    const updated = [...orderItems];
    updated[i] = { ...updated[i], [field]: value };
    setOrderItems(updated);
  };

  const calculatedTotal = orderItems.reduce((sum, item) => {
    const mi = menuItems.find(m => m.id === item.menuItemId);
    return sum + (mi ? Number(mi.price) * (parseInt(item.quantity) || 0) : 0);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = orderItems.filter(i => i.menuItemId && parseInt(i.quantity) > 0);
    if (validItems.length === 0) { setError("Add at least one item"); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/restaurant/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId: form.tableId || undefined,
          type: form.type,
          items: validItems.map(i => ({ menuItemId: i.menuItemId, quantity: parseInt(i.quantity) })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      resetForm();
      fetchOrders();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setSubmitting(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/restaurant/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    fetchOrders();
  };

  const deleteOrder = async (id: string) => {
    if (!confirm("Cancel this order?")) return;
    await fetch(`/api/restaurant/orders?id=${id}`, { method: "DELETE" });
    fetchOrders();
  };

  const statusColors: Record<string, string> = {
    OPEN: "bg-blue-100 text-blue-700", PREPARING: "bg-amber-100 text-amber-700",
    SERVED: "bg-green-100 text-green-700", COMPLETED: "bg-slate-100 text-slate-600",
    CANCELLED: "bg-red-100 text-red-700",
  };

  const inputCls = "px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500";

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Orders</h2>
          <p className="text-slate-500 text-sm">Manage restaurant orders.</p>
        </div>
        <button onClick={() => { resetForm(); openForm(); }} className="bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm border-none cursor-pointer">
          {showForm ? "Cancel" : "New Order"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 mb-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-700">New Order</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <select value={form.tableId} onChange={e => setForm({ ...form, tableId: e.target.value })} className={inputCls}>
              <option value="">Walk-in (no table)</option>
              {tables.filter(t => t.status === "AVAILABLE").map(t => <option key={t.id} value={t.id}>Table {t.number} ({t.capacity} seats)</option>)}
            </select>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className={inputCls}>
              <option value="DINE_IN">Dine In</option>
              <option value="TAKEAWAY">Takeaway</option>
              <option value="DELIVERY">Delivery</option>
            </select>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase">Items</p>
            {orderItems.map((item, i) => (
              <div key={i} className="flex gap-2 items-center">
                <select value={item.menuItemId} onChange={e => updateOrderItem(i, "menuItemId", e.target.value)} className={`${inputCls} flex-1`}>
                  <option value="">Select item *</option>
                  {menuItems.map(m => <option key={m.id} value={m.id}>{m.name} — PKR {Number(m.price).toLocaleString()}</option>)}
                </select>
                <input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={e => updateOrderItem(i, "quantity", e.target.value)} className={`${inputCls} w-20`} />
                {orderItems.length > 1 && <button type="button" onClick={() => removeOrderItem(i)} className="text-red-500 text-xs font-semibold border-none bg-transparent cursor-pointer">✕</button>}
              </div>
            ))}
            <button type="button" onClick={addOrderItem} className="text-blue-600 text-xs font-semibold border-none bg-transparent cursor-pointer hover:text-blue-700">+ Add item</button>
          </div>
          <p className="text-sm font-bold text-slate-900">Total: PKR {calculatedTotal.toLocaleString()}</p>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={submitting} className="bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 border-none cursor-pointer">
            {submitting ? "Creating..." : "Create Order"}
          </button>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-slate-200 bg-slate-50">
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">#</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Table</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Items</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Type</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Total</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Action</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">Loading...</td></tr>
            : orders.length === 0 ? <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">No orders yet.</td></tr>
            : orders.map(o => (
              <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-mono text-slate-600">#{o.orderNumber}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{o.table ? `Table ${o.table.number}` : "—"}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{o.orderItems.map(i => `${i.menuItem.name} x${i.quantity}`).join(", ")}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{o.type.replace("_", " ")}</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">PKR {Number(o.total).toLocaleString()}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusColors[o.status] || ""}`}>{o.status}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {o.status === "OPEN" && <button onClick={() => updateStatus(o.id, "PREPARING")} className="text-xs text-blue-600 font-semibold hover:text-blue-700 border-none bg-transparent cursor-pointer">Start</button>}
                    {o.status === "PREPARING" && <button onClick={() => updateStatus(o.id, "SERVED")} className="text-xs text-green-600 font-semibold hover:text-green-700 border-none bg-transparent cursor-pointer">Serve</button>}
                    {o.status === "SERVED" && <button onClick={() => updateStatus(o.id, "COMPLETED")} className="text-xs text-slate-600 font-semibold hover:text-slate-700 border-none bg-transparent cursor-pointer">Complete</button>}
                    {o.status === "OPEN" && <button onClick={() => deleteOrder(o.id)} className="text-xs text-red-500 font-semibold hover:text-red-600 border-none bg-transparent cursor-pointer">Cancel</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
