"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, CheckCircle2, Building2, Calendar, Clock, Users, Phone, Mail, User, MessageSquare } from "lucide-react";

interface TenantInfo {
  name: string;
  slug: string;
  industry: string;
  logo?: string;
}

const SERVICE_LABELS: Record<string, string> = {
  GYM: "What are you interested in?",
  CLINIC: "Which service do you need?",
  RESTAURANT: "What can we help you with?",
  BOOKSHOP: "What are you looking for?",
  CAR_RENTAL: "Which vehicle?",
  REAL_ESTATE: "What are you looking for?",
  SALON: "Which service?",
  SCHOOL: "What are you enquiring about?",
};

export default function BookPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug as string;

  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    service: "",
    preferredDate: "",
    preferredTime: "",
    partySize: "",
    message: "",
  });

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/public/${slug}/info`)
      .then(async (r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((d) => setTenant(d.tenant))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/public/${slug}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          partySize: form.partySize ? Number(form.partySize) : undefined,
          type: "BOOKING",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send your request");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={28} />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center max-w-sm w-full">
          <Building2 className="mx-auto text-slate-300 mb-3" size={40} />
          <h1 className="text-lg font-bold text-slate-900 mb-1">Business not found</h1>
          <p className="text-sm text-slate-500">This booking page doesn’t exist or is no longer available.</p>
        </div>
      </div>
    );
  }

  const showDate = ["CLINIC", "SALON", "GYM", "CAR_RENTAL", "REAL_ESTATE", "SCHOOL"].includes(tenant?.industry || "");
  const showTime = ["CLINIC", "SALON", "GYM"].includes(tenant?.industry || "");
  const showParty = tenant?.industry === "RESTAURANT";

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-6">
          {tenant?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.logo} alt={tenant.name} className="h-12 mx-auto mb-3 object-contain" />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-3">
              <Building2 size={22} />
            </div>
          )}
          <h1 className="text-2xl font-extrabold text-slate-900">{tenant?.name}</h1>
          <p className="text-slate-500 text-sm mt-1">Request a booking — we’ll confirm by phone or email.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
          {done ? (
            <div className="text-center py-6">
              <CheckCircle2 className="mx-auto text-green-500 mb-3" size={44} />
              <h2 className="text-lg font-bold text-slate-900 mb-1">Request sent!</h2>
              <p className="text-sm text-slate-500">Thanks {form.name.split(" ")[0]}, {tenant?.name} will contact you shortly to confirm.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

              <Field icon={<User size={15} />} label="Your name" required>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className={inputCls} />
              </Field>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field icon={<Phone size={15} />} label="Phone" required>
                  <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="03xx xxxxxxx" className={inputCls} />
                </Field>
                <Field icon={<Mail size={15} />} label="Email">
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@email.com" className={inputCls} />
                </Field>
              </div>

              <Field icon={<MessageSquare size={15} />} label={SERVICE_LABELS[tenant?.industry || ""] || "Service / interest"}>
                <input value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} placeholder="Optional" className={inputCls} />
              </Field>

              <div className="grid sm:grid-cols-2 gap-4">
                {showDate && (
                  <Field icon={<Calendar size={15} />} label="Preferred date">
                    <input type="date" value={form.preferredDate} onChange={(e) => setForm({ ...form, preferredDate: e.target.value })} className={inputCls} />
                  </Field>
                )}
                {showTime && (
                  <Field icon={<Clock size={15} />} label="Preferred time">
                    <input type="time" value={form.preferredTime} onChange={(e) => setForm({ ...form, preferredTime: e.target.value })} className={inputCls} />
                  </Field>
                )}
                {showParty && (
                  <Field icon={<Users size={15} />} label="Party size">
                    <input type="number" min="1" value={form.partySize} onChange={(e) => setForm({ ...form, partySize: e.target.value })} placeholder="2" className={inputCls} />
                  </Field>
                )}
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Message</label>
                <textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Anything else we should know?" className={`${inputCls} resize-none`} />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 border-none cursor-pointer text-sm"
              >
                {submitting ? <><Loader2 size={15} className="animate-spin" /> Sending…</> : "Send Request"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Powered by NexusSoft ERP
        </p>
      </div>
    </div>
  );
}

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all";

function Field({ icon, label, required, children }: { icon: React.ReactNode; label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">
        <span className="text-slate-400">{icon}</span>
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}
