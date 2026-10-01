"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Zap, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/dashboard";

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      // Redirect based on whether user belongs to a tenant
      if (data.tenant?.slug) {
        // Tenant user → dashboard
        router.push(from && !from.startsWith("/admin") ? from : "/dashboard");
      } else if (data.user.role === "SUPER_ADMIN") {
        // Platform super admin (no tenant) → admin panel
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }

      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 bg-white">
        <div className="w-full max-w-sm">
          <Link href="/" className="flex items-center gap-2 mb-8 sm:mb-10 no-underline">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <Zap size={16} fill="white" className="text-white" />
            </div>
            <span className="text-slate-900 font-bold text-lg">
              Orbitrix<span className="text-blue-600"> ERP</span>
            </span>
          </Link>

          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-1">Welcome back</h1>
          <p className="text-slate-500 text-sm mb-6 sm:mb-8">Sign in to your account to continue.</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Email</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@company.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Password</label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer border-none bg-transparent"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer text-sm"
            >
              {loading ? "Signing in..." : "Sign In"} {!loading && <ArrowRight size={15} />}
            </button>
          </form>

          <p className="text-slate-500 text-sm text-center mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-blue-600 font-semibold hover:text-blue-700 no-underline">
              Sign up free
            </Link>
          </p>
        </div>
      </div>

      {/* Right — Branding */}
      <div className="hidden lg:flex flex-1 bg-[#0d3b3f] items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-6">
            <Zap size={28} fill="white" className="text-white" />
          </div>
          <h2 className="text-white font-extrabold text-2xl mb-3">Orbitrix ERP Platform</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Industry-specific management software for Schools, Clinics, Restaurants, Gyms, and Book Shops. Built for businesses in Pakistan.
          </p>
        </div>
      </div>
    </div>
  );
}
