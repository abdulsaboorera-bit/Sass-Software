"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { usePermissions } from "@/lib/permissions";

interface Category { id: string; name: string }
interface Service {
  id: string;
  name: string;
  categoryId?: Category | string | null;
  duration: number;
  price: number;
  costPrice?: number;
  commissionRate?: number;
  isActive?: boolean;
}

const empty = { name: "", categoryId: "", duration: "30", price: "", costPrice: "", commissionRate: "", description: "" };

export default function SalonServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(empty);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const { can } = usePermissions();

  const load = async () => {
    try {
      const [servicesResponse, categoriesResponse] = await Promise.all([
        fetch("/api/salon/services?limit=100", { credentials: "include" }),
        fetch("/api/salon/service-categories", { credentials: "include" }),
      ]);
      const servicesData = await servicesResponse.json();
      const categoriesData = await categoriesResponse.json();
      if (!servicesResponse.ok) throw new Error(servicesData.error || "Unable to load services");
      setServices(servicesData.services || []);
      setCategories(categoriesData.categories || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to load services");
    }
  };

  useEffect(() => { void load(); }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!can("services.create")) {
      setError("You don't have permission to add services");
      return;
    }
    setError("");
    try {
      const response = await fetch("/api/salon/services", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          categoryId: form.categoryId || undefined,
          duration: Number(form.duration || 0),
          price: Number(form.price || 0),
          costPrice: Number(form.costPrice || 0),
          commissionRate: Number(form.commissionRate || 0),
          description: form.description || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save service");
      setOpen(false);
      setForm(empty);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to save service");
    }
  };

  const archive = async (service: Service) => {
    if (!can("services.edit")) {
      setError("You don't have permission to remove services");
      return;
    }
    if (!confirm(`Remove ${service.name}?`)) return;
    const response = await fetch(`/api/salon/services/${service.id}`, { method: "DELETE", credentials: "include" });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Unable to remove service");
      return;
    }
    await load();
  };

  const categoryName = (service: Service) => {
    if (service.categoryId && typeof service.categoryId === "object") return service.categoryId.name;
    const match = categories.find((c) => c.id === service.categoryId);
    return match?.name || "—";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Services</h2>
          <p className="text-slate-500 text-sm">Your treatment menu with prices, duration, and commissions.</p>
        </div>
        {can("services.create") && (
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm cursor-pointer">
            <Plus size={16} /> Add Service
          </button>
        )}
      </div>

      {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {services.length === 0 ? (
          <p className="text-slate-400 text-sm">No services yet.</p>
        ) : services.map((service) => (
          <div key={service.id} className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900">{service.name}</h3>
                <p className="text-xs text-slate-500">{categoryName(service)} · {service.duration} min</p>
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-700">{service.commissionRate || 0}% comm.</span>
            </div>
            <p className="text-lg font-bold text-slate-900 mt-3">PKR {Number(service.price).toLocaleString()}</p>
            {can("services.edit") && (
              <button onClick={() => archive(service)} className="mt-4 text-xs text-red-600 border-none bg-transparent cursor-pointer">Remove service</button>
            )}
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4">
          <form onSubmit={save} className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Add Service</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 border-none bg-transparent cursor-pointer"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <input required placeholder="Service name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="">Uncategorised</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input required type="number" placeholder="Duration (min)" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input required type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input type="number" placeholder="Cost price" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input type="number" placeholder="Commission %" value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
            </div>
            <button type="submit" className="mt-5 w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl text-sm cursor-pointer">Save Service</button>
          </form>
        </div>
      )}
    </div>
  );
}
