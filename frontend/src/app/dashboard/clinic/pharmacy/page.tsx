"use client";

import { useEffect, useState } from "react";
import { Plus, X, Trash2, ArrowLeftRight } from "lucide-react";
import { usePermissions } from "@/lib/permissions";

interface Ref { id: string; name: string; patientNo?: string }
interface Category { id: string; name: string }
interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  brand?: string;
  form?: string;
  sku?: string;
  quantity: number;
  unit?: string;
  minStock: number;
  costPrice: number;
  sellPrice: number;
  expiryDate?: string;
  batchNumber?: string;
  supplierName?: string;
  categoryId?: Category | string | null;
}
interface SaleItem { medicineId: string; name?: string; quantity: number; unitPrice?: number; total?: number }
interface Sale {
  id: string;
  saleRef: string;
  patientId?: Ref;
  customerName?: string;
  items?: SaleItem[];
  total: number;
  paidAmount?: number;
  status: string;
  paymentMethod?: string;
  soldAt: string;
}
interface Supplier { id: string; name: string; phone?: string; email?: string; contactPerson?: string }
interface Summary { totalItems?: number; totalValue?: number; lowStockCount?: number; expiredCount?: number; expiringSoonCount?: number }

const FORMS = ["TABLET", "CAPSULE", "SYRUP", "INJECTION", "CREAM", "DROPS", "INHALER", "OTHER"];
const MOVEMENTS = ["PURCHASE", "ADJUSTMENT", "RETURN", "DAMAGED", "EXPIRED"];
const METHODS = ["CASH", "BANK_TRANSFER", "CARD", "ONLINE", "JAZZCASH", "EASYPAISA"];
const emptyMed = { name: "", genericName: "", brand: "", form: "TABLET", sku: "", quantity: "0", unit: "pcs", minStock: "10", costPrice: "", sellPrice: "", expiryDate: "", batchNumber: "", supplierName: "", categoryId: "" };
const emptyMovement = { medicineId: "", type: "PURCHASE", quantity: "1", reference: "", notes: "" };
const emptySupplier = { name: "", phone: "", email: "", address: "", contactPerson: "", notes: "" };

export default function ClinicPharmacyPage() {
  const [tab, setTab] = useState<"medicines" | "sales" | "suppliers">("medicines");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<Summary>({});
  const [patients, setPatients] = useState<Ref[]>([]);
  const [medForm, setMedForm] = useState(emptyMed);
  const [movement, setMovement] = useState(emptyMovement);
  const [supplierForm, setSupplierForm] = useState(emptySupplier);
  const [categoryName, setCategoryName] = useState("");
  const [saleForm, setSaleForm] = useState({ patientId: "", discount: "", paymentMethod: "CASH", items: [{ medicineId: "", quantity: "1" }] });
  const [medOpen, setMedOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [saleOpen, setSaleOpen] = useState(false);
  const [error, setError] = useState("");
  const { can } = usePermissions();

  const load = async () => {
    try {
      const [meds, cats, sups, salesRes, sum, pats] = await Promise.all([
        fetch("/api/clinic/pharmacy/medicines?limit=100", { credentials: "include" }).then((r) => r.json()),
        fetch("/api/clinic/pharmacy/categories", { credentials: "include" }).then((r) => r.json()),
        fetch("/api/clinic/pharmacy/suppliers", { credentials: "include" }).then((r) => r.json()),
        fetch("/api/clinic/pharmacy/sales?limit=100", { credentials: "include" }).then((r) => r.json()),
        fetch("/api/clinic/pharmacy/medicines/summary", { credentials: "include" }).then((r) => r.json()),
        fetch("/api/clinic/patients?limit=100", { credentials: "include" }).then((r) => r.json()),
      ]);
      setMedicines(meds.medicines || []);
      setCategories(cats.categories || []);
      setSuppliers(sups.suppliers || []);
      setSales(salesRes.sales || []);
      setSummary(sum || {});
      setPatients(pats.patients || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to load pharmacy data");
    }
  };

  useEffect(() => { void load(); }, []);

  const saveMedicine = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!can("pharmacy.create")) {
      setError("You don't have permission to add medicines");
      return;
    }
    setError("");
    try {
      const response = await fetch("/api/clinic/pharmacy/medicines", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: medForm.name,
          genericName: medForm.genericName || undefined,
          brand: medForm.brand || undefined,
          form: medForm.form,
          sku: medForm.sku || undefined,
          quantity: Number(medForm.quantity || 0),
          unit: medForm.unit || "pcs",
          minStock: Number(medForm.minStock || 0),
          costPrice: Number(medForm.costPrice || 0),
          sellPrice: Number(medForm.sellPrice || 0),
          expiryDate: medForm.expiryDate || undefined,
          batchNumber: medForm.batchNumber || undefined,
          supplierName: medForm.supplierName || undefined,
          categoryId: medForm.categoryId || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save medicine");
      setMedOpen(false);
      setMedForm(emptyMed);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to save medicine");
    }
  };

  const saveMovement = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!can("pharmacy.edit")) {
      setError("You don't have permission to record stock movements");
      return;
    }
    setError("");
    try {
      const response = await fetch("/api/clinic/pharmacy/medicines/movements", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicineId: movement.medicineId,
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

  const saveSupplier = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!can("pharmacy.create")) {
      setError("You don't have permission to add suppliers");
      return;
    }
    setError("");
    try {
      const response = await fetch("/api/clinic/pharmacy/suppliers", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: supplierForm.name,
          phone: supplierForm.phone || undefined,
          email: supplierForm.email || undefined,
          address: supplierForm.address || undefined,
          contactPerson: supplierForm.contactPerson || undefined,
          notes: supplierForm.notes || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save supplier");
      setSupplierOpen(false);
      setSupplierForm(emptySupplier);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to save supplier");
    }
  };

  const addCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!categoryName.trim()) return;
    if (!can("pharmacy.create")) {
      setError("You don't have permission to add categories");
      return;
    }
    setError("");
    try {
      const response = await fetch("/api/clinic/pharmacy/categories", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryName.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to add category");
      setCategoryName("");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to add category");
    }
  };

  const saveSale = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!can("pharmacy.create")) {
      setError("You don't have permission to record sales");
      return;
    }
    setError("");
    const items = saleForm.items.filter((i) => i.medicineId && Number(i.quantity) > 0).map((i) => ({ medicineId: i.medicineId, quantity: Number(i.quantity) }));
    if (items.length === 0) {
      setError("Add at least one medicine");
      return;
    }
    try {
      const response = await fetch("/api/clinic/pharmacy/sales", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: saleForm.patientId || undefined,
          items,
          discount: Number(saleForm.discount || 0),
          paymentMethod: saleForm.paymentMethod,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to record sale");
      setSaleOpen(false);
      setSaleForm({ patientId: "", discount: "", paymentMethod: "CASH", items: [{ medicineId: "", quantity: "1" }] });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to record sale");
    }
  };

  const deleteMedicine = async (medicine: Medicine) => {
    if (!can("pharmacy.edit")) {
      setError("You don't have permission to delete medicines");
      return;
    }
    if (!confirm(`Delete ${medicine.name}?`)) return;
    const response = await fetch(`/api/clinic/pharmacy/medicines/${medicine.id}`, { method: "DELETE", credentials: "include" });
    if (!response.ok) { const data = await response.json().catch(() => ({})); setError(data.error || "Unable to delete medicine"); }
    await load();
  };

  const deleteSupplier = async (supplier: Supplier) => {
    if (!can("pharmacy.edit")) {
      setError("You don't have permission to delete suppliers");
      return;
    }
    if (!confirm(`Delete ${supplier.name}?`)) return;
    const response = await fetch(`/api/clinic/pharmacy/suppliers/${supplier.id}`, { method: "DELETE", credentials: "include" });
    if (!response.ok) { const data = await response.json().catch(() => ({})); setError(data.error || "Unable to delete supplier"); }
    await load();
  };

  const cancelSale = async (sale: Sale) => {
    if (!can("pharmacy.edit")) {
      setError("You don't have permission to cancel sales");
      return;
    }
    if (!confirm(`Cancel sale ${sale.saleRef}? Stock will be restored.`)) return;
    const response = await fetch(`/api/clinic/pharmacy/sales/${sale.id}/cancel`, { method: "POST", credentials: "include" });
    if (!response.ok) { const data = await response.json().catch(() => ({})); setError(data.error || "Unable to cancel sale"); }
    await load();
  };

  const updateSaleItem = (index: number, key: "medicineId" | "quantity", value: string) => {
    setSaleForm((prev) => ({ ...prev, items: prev.items.map((it, i) => (i === index ? { ...it, [key]: value } : it)) }));
  };

  const categoryName2 = (medicine: Medicine) => {
    if (medicine.categoryId && typeof medicine.categoryId === "object") return medicine.categoryId.name;
    const match = categories.find((c) => c.id === medicine.categoryId);
    return match?.name || "—";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Pharmacy</h2>
          <p className="text-slate-500 text-sm">Medicine inventory, sales, and suppliers.</p>
        </div>
        {can("pharmacy.create") && (
          <button
            onClick={() => (tab === "medicines" ? setMedOpen(true) : tab === "suppliers" ? setSupplierOpen(true) : setSaleOpen(true))}
            className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm cursor-pointer"
          >
            <Plus size={16} /> {tab === "medicines" ? "Add Medicine" : tab === "suppliers" ? "Add Supplier" : "New Sale"}
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        {(["medicines", "sales", "suppliers"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize cursor-pointer border-none ${tab === t ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>{t}</button>
        ))}
      </div>

      {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      {tab === "medicines" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-slate-200 rounded-xl p-4"><p className="text-xs text-slate-500">Medicines</p><p className="font-bold text-slate-900 text-lg mt-1">{summary.totalItems ?? 0}</p></div>
            <div className="bg-white border border-slate-200 rounded-xl p-4"><p className="text-xs text-slate-500">Stock Value</p><p className="font-bold text-slate-900 text-lg mt-1">PKR {Number(summary.totalValue || 0).toLocaleString()}</p></div>
            <div className="bg-white border border-slate-200 rounded-xl p-4"><p className="text-xs text-slate-500">Low Stock</p><p className="font-bold text-orange-600 text-lg mt-1">{summary.lowStockCount ?? 0}</p></div>
            <div className="bg-white border border-slate-200 rounded-xl p-4"><p className="text-xs text-slate-500">Expiring (90d)</p><p className="font-bold text-amber-600 text-lg mt-1">{summary.expiringSoonCount ?? 0}</p></div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-slate-600">Categories:</span>
              {categories.length === 0 ? <span className="text-slate-400 text-sm">None</span> : categories.map((c) => <span key={c.id} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">{c.name}</span>)}
            </div>
            <form onSubmit={addCategory} className="flex gap-2 max-w-md">
              <input placeholder="New category" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              {can("pharmacy.create") && (
                <button type="submit" className="bg-slate-900 text-white font-semibold px-4 py-2 rounded-lg text-sm cursor-pointer">Add</button>
              )}
            </form>
          </div>

          <div className="flex justify-end mb-3">
            {can("pharmacy.edit") && (
              <button onClick={() => setMoveOpen(true)} className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-sm cursor-pointer">
                <ArrowLeftRight size={16} /> Stock Movement
              </button>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Medicine</th>
                  <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Category</th>
                  <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Form</th>
                  <th className="text-right px-4 py-3 text-xs uppercase text-slate-500">Qty</th>
                  <th className="text-right px-4 py-3 text-xs uppercase text-slate-500">Cost</th>
                  <th className="text-right px-4 py-3 text-xs uppercase text-slate-500">Sell</th>
                  <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Expiry</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {medicines.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-sm">No medicines yet.</td></tr>
                ) : medicines.map((medicine) => {
                  const low = medicine.quantity <= medicine.minStock;
                  const expired = medicine.expiryDate && new Date(medicine.expiryDate) < new Date();
                  return (
                    <tr key={medicine.id} className="border-b border-slate-100">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800">{medicine.name}<span className="block text-xs text-slate-400 font-normal">{medicine.genericName || medicine.brand || ""}</span></td>
                      <td className="px-4 py-3 text-sm text-slate-600">{categoryName2(medicine)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{medicine.form || "—"}</td>
                      <td className="px-4 py-3 text-sm text-right"><span className={`font-semibold ${low ? "text-orange-600" : "text-slate-700"}`}>{medicine.quantity} {medicine.unit}</span></td>
                      <td className="px-4 py-3 text-sm text-right text-slate-600">PKR {Number(medicine.costPrice).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right text-slate-600">PKR {Number(medicine.sellPrice).toLocaleString()}</td>
                      <td className={`px-4 py-3 text-sm ${expired ? "text-red-600" : "text-slate-600"}`}>{medicine.expiryDate ? new Date(medicine.expiryDate).toLocaleDateString() : "—"}</td>
                      <td className="px-4 py-3 text-right">{can("pharmacy.edit") && <button onClick={() => deleteMedicine(medicine)} className="text-xs text-red-600 border-none bg-transparent cursor-pointer">Delete</button>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "sales" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Ref</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Date</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Patient</th>
                <th className="text-right px-4 py-3 text-xs uppercase text-slate-500">Items</th>
                <th className="text-right px-4 py-3 text-xs uppercase text-slate-500">Total</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">No pharmacy sales yet.</td></tr>
              ) : sales.map((sale) => (
                <tr key={sale.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 text-sm font-medium text-slate-700">{sale.saleRef}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{new Date(sale.soldAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{sale.patientId?.name || sale.customerName || "Walk-in"}</td>
                  <td className="px-4 py-3 text-sm text-right text-slate-600">{sale.items?.length || 0}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-slate-800">PKR {Number(sale.total).toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-1 rounded-full ${sale.status === "PAID" ? "bg-green-100 text-green-700" : sale.status === "CANCELLED" ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-700"}`}>{sale.status}</span></td>
                  <td className="px-4 py-3 text-right">
                    {can("pharmacy.edit") && sale.status !== "CANCELLED" && <button onClick={() => cancelSale(sale)} className="text-xs text-red-600 border-none bg-transparent cursor-pointer">Cancel</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "suppliers" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Supplier</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Contact</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Phone</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Email</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">No suppliers yet.</td></tr>
              ) : suppliers.map((supplier) => (
                <tr key={supplier.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800">{supplier.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{supplier.contactPerson || "—"}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{supplier.phone || "—"}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{supplier.email || "—"}</td>
                  <td className="px-4 py-3 text-right">{can("pharmacy.edit") && <button onClick={() => deleteSupplier(supplier)} className="text-xs text-red-600 border-none bg-transparent cursor-pointer">Delete</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {medOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4 overflow-y-auto">
          <form onSubmit={saveMedicine} className="bg-white rounded-2xl w-full max-w-lg p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Add Medicine</h3>
              <button type="button" onClick={() => setMedOpen(false)} className="text-slate-400 border-none bg-transparent cursor-pointer"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Medicine name" value={medForm.name} onChange={(e) => setMedForm({ ...medForm, name: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input placeholder="Generic name" value={medForm.genericName} onChange={(e) => setMedForm({ ...medForm, genericName: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input placeholder="Brand" value={medForm.brand} onChange={(e) => setMedForm({ ...medForm, brand: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <select value={medForm.form} onChange={(e) => setMedForm({ ...medForm, form: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  {FORMS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
                <select value={medForm.categoryId} onChange={(e) => setMedForm({ ...medForm, categoryId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  <option value="">Uncategorised</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input placeholder="SKU" value={medForm.sku} onChange={(e) => setMedForm({ ...medForm, sku: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input required type="number" placeholder="Quantity" value={medForm.quantity} onChange={(e) => setMedForm({ ...medForm, quantity: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input placeholder="Unit" value={medForm.unit} onChange={(e) => setMedForm({ ...medForm, unit: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input type="number" placeholder="Min stock" value={medForm.minStock} onChange={(e) => setMedForm({ ...medForm, minStock: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input required type="number" placeholder="Cost price" value={medForm.costPrice} onChange={(e) => setMedForm({ ...medForm, costPrice: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input required type="number" placeholder="Sell price" value={medForm.sellPrice} onChange={(e) => setMedForm({ ...medForm, sellPrice: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input type="date" placeholder="Expiry" value={medForm.expiryDate} onChange={(e) => setMedForm({ ...medForm, expiryDate: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input placeholder="Batch number" value={medForm.batchNumber} onChange={(e) => setMedForm({ ...medForm, batchNumber: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input placeholder="Supplier name" value={medForm.supplierName} onChange={(e) => setMedForm({ ...medForm, supplierName: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
            </div>
            <button type="submit" className="mt-5 w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl text-sm cursor-pointer">Save Medicine</button>
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
              <select required value={movement.medicineId} onChange={(e) => setMovement({ ...movement, medicineId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="">Select medicine</option>
                {medicines.map((m) => <option key={m.id} value={m.id}>{m.name} (qty {m.quantity})</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <select value={movement.type} onChange={(e) => setMovement({ ...movement, type: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  {MOVEMENTS.map((t) => <option key={t} value={t}>{t}</option>)}
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

      {supplierOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4">
          <form onSubmit={saveSupplier} className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Add Supplier</h3>
              <button type="button" onClick={() => setSupplierOpen(false)} className="text-slate-400 border-none bg-transparent cursor-pointer"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <input required placeholder="Supplier name" value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <input placeholder="Contact person" value={supplierForm.contactPerson} onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <input placeholder="Phone" value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <input placeholder="Email" value={supplierForm.email} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <input placeholder="Address" value={supplierForm.address} onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <button type="submit" className="mt-5 w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl text-sm cursor-pointer">Save Supplier</button>
          </form>
        </div>
      )}

      {saleOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4 overflow-y-auto">
          <form onSubmit={saveSale} className="bg-white rounded-2xl w-full max-w-lg p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">New Pharmacy Sale</h3>
              <button type="button" onClick={() => setSaleOpen(false)} className="text-slate-400 border-none bg-transparent cursor-pointer"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <select value={saleForm.patientId} onChange={(e) => setSaleForm({ ...saleForm, patientId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="">Walk-in customer</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.name} {p.patientNo ? `(${p.patientNo})` : ""}</option>)}
              </select>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-600">Items</p>
                  <button type="button" onClick={() => setSaleForm((prev) => ({ ...prev, items: [...prev.items, { medicineId: "", quantity: "1" }] }))} className="text-xs text-blue-600 border-none bg-transparent cursor-pointer">+ Add item</button>
                </div>
                <div className="space-y-2">
                  {saleForm.items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <select value={item.medicineId} onChange={(e) => updateSaleItem(index, "medicineId", e.target.value)} className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-sm">
                        <option value="">Select medicine</option>
                        {medicines.map((m) => <option key={m.id} value={m.id}>{m.name} · PKR {Number(m.sellPrice).toLocaleString()} · qty {m.quantity}</option>)}
                      </select>
                      <input type="number" min="1" value={item.quantity} onChange={(e) => updateSaleItem(index, "quantity", e.target.value)} className="w-20 px-2 py-1.5 border border-slate-200 rounded-lg text-sm" />
                      <button type="button" onClick={() => setSaleForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }))} className="text-slate-400 hover:text-red-600 border-none bg-transparent cursor-pointer"><Trash2 size={15} /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Discount" value={saleForm.discount} onChange={(e) => setSaleForm({ ...saleForm, discount: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <select value={saleForm.paymentMethod} onChange={(e) => setSaleForm({ ...saleForm, paymentMethod: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="mt-5 w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl text-sm cursor-pointer">Complete Sale</button>
          </form>
        </div>
      )}
    </div>
  );
}
