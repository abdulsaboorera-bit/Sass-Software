"use client";

import { useEffect, useState } from "react";
import { Plus, X, ArrowLeftRight } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  sku?: string;
  quantity: number;
  unit: string;
  costPrice: number;
  sellPrice: number;
  minStock: number;
  supplierName?: string;
  isActive?: boolean;
}
interface Summary { totalItems?: number; totalValue?: number; lowStockCount?: number }

const CATEGORIES = ["HAIRCARE", "SKINCARE", "COSMETICS", "TOOLS", "CONSUMABLE", "OTHER"];
const MOVEMENTS = ["PURCHASE", "SALE", "ADJUSTMENT", "DAMAGED", "RETURN"];
const empty = { name: "", category: "HAIRCARE", sku: "", quantity: "0", unit: "pcs", costPrice: "", sellPrice: "", minStock: "5", supplierName: "" };
const emptyMovement = { itemId: "", type: "PURCHASE", quantity: "1", reference: "", notes: "" };

export default function SalonProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [summary, setSummary] = useState<Summary>({});
  const [form, setForm] = useState(empty);
  const [movement, setMovement] = useState(emptyMovement);
  const [open, setOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [productsResponse, summaryResponse] = await Promise.all([
        fetch("/api/salon/products?limit=100", { credentials: "include" }),
        fetch("/api/salon/products/summary", { credentials: "include" }),
      ]);
      const productsData = await productsResponse.json();
      const summaryData = await summaryResponse.json();
      if (!productsResponse.ok) throw new Error(productsData.error || "Unable to load products");
      setProducts(productsData.items || []);
      setSummary(summaryData || {});
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to load products");
    }
  };

  useEffect(() => { void load(); }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      const response = await fetch("/api/salon/products", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          sku: form.sku || undefined,
          quantity: Number(form.quantity || 0),
          unit: form.unit || "pcs",
          costPrice: Number(form.costPrice || 0),
          sellPrice: Number(form.sellPrice || 0),
          minStock: Number(form.minStock || 0),
          supplierName: form.supplierName || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save product");
      setOpen(false);
      setForm(empty);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to save product");
    }
  };

  const saveMovement = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      const response = await fetch("/api/salon/products/movements", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: movement.itemId,
          type: movement.type,
          quantity: Number(movement.quantity || 0),
          reference: movement.reference || undefined,
          notes: movement.notes || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to record stock movement");
      setMoveOpen(false);
      setMovement(emptyMovement);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to record stock movement");
    }
  };

  const archive = async (product: Product) => {
    if (!confirm(`Delete ${product.name}?`)) return;
    const response = await fetch(`/api/salon/products/${product.id}`, { method: "DELETE", credentials: "include" });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Unable to delete product");
      return;
    }
    await load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Products & Inventory</h2>
          <p className="text-slate-500 text-sm">Retail stock, costs, and low-stock tracking.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMoveOpen(true)} className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-sm cursor-pointer">
            <ArrowLeftRight size={16} /> Stock Movement
          </button>
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm cursor-pointer">
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Products</p>
          <p className="font-bold text-slate-900 text-lg mt-1">{summary.totalItems ?? 0}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Stock Value</p>
          <p className="font-bold text-slate-900 text-lg mt-1">PKR {Number(summary.totalValue || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Low Stock</p>
          <p className="font-bold text-orange-600 text-lg mt-1">{summary.lowStockCount ?? 0}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Product</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Category</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">SKU</th>
              <th className="text-right px-4 py-3 text-xs uppercase text-slate-500">Qty</th>
              <th className="text-right px-4 py-3 text-xs uppercase text-slate-500">Cost</th>
              <th className="text-right px-4 py-3 text-xs uppercase text-slate-500">Sell</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">No products yet.</td></tr>
            ) : products.map((product) => {
              const low = product.quantity <= product.minStock;
              return (
                <tr key={product.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800">{product.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{product.category}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{product.sku || "—"}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    <span className={`font-semibold ${low ? "text-orange-600" : "text-slate-700"}`}>{product.quantity} {product.unit}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-slate-600">PKR {Number(product.costPrice).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right text-slate-600">PKR {Number(product.sellPrice).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => archive(product)} className="text-xs text-red-600 border-none bg-transparent cursor-pointer">Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4 overflow-y-auto">
          <form onSubmit={save} className="bg-white rounded-2xl w-full max-w-md p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Add Product</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 border-none bg-transparent cursor-pointer"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <input required placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
                <input placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input type="number" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input placeholder="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input type="number" placeholder="Cost price" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input type="number" placeholder="Sell price" value={form.sellPrice} onChange={(e) => setForm({ ...form, sellPrice: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input type="number" placeholder="Min stock" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input placeholder="Supplier" value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
            </div>
            <button type="submit" className="mt-5 w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl text-sm cursor-pointer">Save Product</button>
          </form>
        </div>
      )}

      {moveOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4">
          <form onSubmit={saveMovement} className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Record Stock Movement</h3>
              <button type="button" onClick={() => setMoveOpen(false)} className="text-slate-400 border-none bg-transparent cursor-pointer"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <select required value={movement.itemId} onChange={(e) => setMovement({ ...movement, itemId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="">Select product</option>
                {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <select value={movement.type} onChange={(e) => setMovement({ ...movement, type: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  {MOVEMENTS.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                <input required type="number" min="1" placeholder="Quantity" value={movement.quantity} onChange={(e) => setMovement({ ...movement, quantity: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
              <input placeholder="Reference (optional)" value={movement.reference} onChange={(e) => setMovement({ ...movement, reference: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <input placeholder="Notes (optional)" value={movement.notes} onChange={(e) => setMovement({ ...movement, notes: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <button type="submit" className="mt-5 w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl text-sm cursor-pointer">Record Movement</button>
          </form>
        </div>
      )}
    </div>
  );
}
