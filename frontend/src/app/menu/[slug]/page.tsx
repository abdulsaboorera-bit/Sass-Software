"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Leaf, Flame, Clock, Phone, MapPin } from "lucide-react";

interface Modifier { name: string; price?: number }
interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  preparationTime?: number;
  tags?: string[];
  isVegetarian?: boolean;
  isVegan?: boolean;
  isSpicy?: boolean;
  allergens?: string[];
  modifiers?: Modifier[];
}
interface Category { id: string; name: string; menuItems: MenuItem[] }
interface Tenant { name: string; slug: string; logo?: string }
interface Settings { restaurantName?: string; tagline?: string; phone?: string; address?: string; currency?: string }

export default function PublicMenuPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug as string;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [settings, setSettings] = useState<Settings>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/public/${slug}/menu`)
      .then(async (r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((d) => {
        setTenant(d.tenant);
        setSettings(d.settings || {});
        setCategories(d.categories || []);
        setActive(d.categories?.[0]?.id || "");
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const currency = settings.currency || "PKR";
  const money = (n: number) => `${currency} ${Number(n || 0).toLocaleString()}`;
  const visible = categories.find((c) => c.id === active) || categories[0];

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <Loader2 className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 px-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-900">Menu not found</h1>
          <p className="text-slate-500 text-sm mt-1">This restaurant menu is unavailable.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-6 text-center">
          <h1 className="text-2xl font-extrabold text-slate-900">{settings.restaurantName || tenant?.name}</h1>
          {settings.tagline && <p className="text-slate-500 text-sm mt-1">{settings.tagline}</p>}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
            {settings.phone && <span className="inline-flex items-center gap-1"><Phone size={13} /> {settings.phone}</span>}
            {settings.address && <span className="inline-flex items-center gap-1"><MapPin size={13} /> {settings.address}</span>}
          </div>
        </div>
        {categories.length > 1 && (
          <div className="max-w-3xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold border cursor-pointer ${active === c.id ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {!visible ? (
          <p className="text-center text-slate-400 text-sm py-16">No menu items available.</p>
        ) : (
          <div className="space-y-3">
            {visible.menuItems.map((item) => (
              <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-4">
                {item.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.name} loading="lazy" decoding="async" className="w-20 h-20 rounded-xl object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-slate-900">{item.name}</h3>
                    <span className="font-semibold text-slate-900 shrink-0">{money(item.price)}</span>
                  </div>
                  {item.description && <p className="text-slate-500 text-sm mt-1">{item.description}</p>}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {item.isVegetarian && <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full"><Leaf size={11} /> Veg</span>}
                    {item.isVegan && <span className="text-[11px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Vegan</span>}
                    {item.isSpicy && <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full"><Flame size={11} /> Spicy</span>}
                    {item.preparationTime ? <span className="inline-flex items-center gap-1 text-[11px] text-slate-500"><Clock size={11} /> {item.preparationTime} min</span> : null}
                    {item.tags?.map((tag) => <span key={tag} className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">{tag}</span>)}
                  </div>
                  {!!item.allergens?.length && <p className="text-[11px] text-slate-400 mt-2">Allergens: {item.allergens.join(", ")}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
