"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Phone, MapPin, Building2, BedDouble, Bath, Ruler, Layers } from "lucide-react";

interface Unit {
  id: string;
  unitNo: string;
  floor?: string;
  type?: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqft?: number;
  rentAmount: number;
}
interface Property {
  id: string;
  name: string;
  address?: string;
  city?: string;
  type?: string;
  description?: string;
  pictures?: string[];
  availableUnits: Unit[];
}
interface Tenant { name: string; slug: string; logo?: string }

export default function PublicListingsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug as string;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/public/${slug}/listings`)
      .then(async (r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((d) => {
        setTenant(d.tenant);
        setProperties(d.properties || []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const money = (n: number) => `PKR ${Number(n || 0).toLocaleString()}`;

  if (loading) {
    return <div className="min-h-screen grid place-items-center bg-slate-50"><Loader2 className="animate-spin text-slate-400" /></div>;
  }

  if (notFound) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 px-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-900">Listings not found</h1>
          <p className="text-slate-500 text-sm mt-1">These listings are unavailable.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide"><Building2 size={13} /> Available Listings</span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-2">{tenant?.name}</h1>
          <p className="text-slate-500 text-sm mt-1">Vacant units ready for rent.</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {properties.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-16">No vacancies right now.</p>
        ) : (
          properties.map((property) => (
            <section key={property.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              {property.pictures?.[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={property.pictures[0]} alt={property.name} className="w-full h-48 object-cover" />
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{property.name}</h2>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                      {property.type && <span>{property.type.replace(/_/g, " ")}</span>}
                      {(property.city || property.address) && <span className="inline-flex items-center gap-1"><MapPin size={12} /> {[property.address, property.city].filter(Boolean).join(", ")}</span>}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">{property.availableUnits.length} vacant</span>
                </div>
                {property.description && <p className="text-slate-500 text-sm mt-2">{property.description}</p>}

                <div className="mt-4 space-y-2">
                  {property.availableUnits.map((unit) => (
                    <div key={unit.id} className="flex flex-wrap items-center justify-between gap-3 border border-slate-100 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Unit {unit.unitNo}{unit.type ? ` · ${unit.type}` : ""}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                          {unit.floor && <span className="inline-flex items-center gap-1"><Layers size={11} /> Floor {unit.floor}</span>}
                          {unit.bedrooms ? <span className="inline-flex items-center gap-1"><BedDouble size={11} /> {unit.bedrooms} bed</span> : null}
                          {unit.bathrooms ? <span className="inline-flex items-center gap-1"><Bath size={11} /> {unit.bathrooms} bath</span> : null}
                          {unit.areaSqft ? <span className="inline-flex items-center gap-1"><Ruler size={11} /> {unit.areaSqft} sqft</span> : null}
                        </div>
                      </div>
                      <p className="text-sm font-bold text-slate-900">{money(unit.rentAmount)}<span className="text-xs font-normal text-slate-400">/mo</span></p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))
        )}
      </main>

      <footer className="max-w-4xl mx-auto px-4 text-center">
        <p className="text-xs text-slate-400 inline-flex items-center gap-1"><Phone size={12} /> Contact {tenant?.name} to schedule a viewing.</p>
      </footer>
    </div>
  );
}
