"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { tokenStore } from "@/lib/api";
import InstitutionSeal from "@/components/ui/InstitutionSeal";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Invalid credentials.");
      }

      const { access_token, expires_in, user } = await res.json();
      tokenStore.set(access_token, expires_in);

      if (user.role === "Teacher") {
        router.push("/teacher/dashboard");
      } else {
        router.push("/admin/dashboard");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void text-parchment font-jakarta flex items-center justify-center relative overflow-hidden p-6">
      {/* Background Gradients */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-burgundy/10 blur-[150px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full bg-gold/5 blur-[150px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="rounded-xl border hairline bg-obsidian p-8 sm:p-10 shadow-2xl relative">
          <div className="absolute inset-0 bg-gradient-to-b from-burgundy/5 to-transparent rounded-xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center text-center space-y-6 mb-8">
            <InstitutionSeal initials="AR" className="w-16 h-16 text-gold" />
            <div className="space-y-2">
              <h1 className="font-cinzel text-2xl font-bold uppercase tracking-wider text-parchment">
                The Academic Registry
              </h1>
              <p className="text-[10px] tracking-[0.22em] uppercase text-slate-400 font-bold">
                Ministry of Education · Credential Verification
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
            {error && (
              <div className="bg-red-950/50 border border-red-900 rounded p-3 text-xs text-red-400 text-center uppercase tracking-wide">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.22em]">
                  Institutional Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  placeholder="name@institution.edu"
                  className="field w-full"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.22em]">
                  Secure Passkey
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="••••••••"
                  className="field w-full"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-burgundy to-crimson border border-brass/30 text-parchment font-cinzel tracking-wide font-bold py-3 rounded-md shadow-lg shadow-burgundy/20 hover:opacity-90 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? "Authenticating..." : "Authorize Access"}
            </button>
          </form>

          <div className="mt-8 text-center relative z-10 space-y-4">
            <div className="flex items-center justify-center gap-2">
              <div className="h-px w-12 bg-white/10" />
              <span className="text-[10px] text-slate-500 uppercase tracking-[0.22em]">Or</span>
              <div className="h-px w-12 bg-white/10" />
            </div>
            
            <Link href="/register/demo-token" className="text-[10px] uppercase tracking-[0.22em] font-bold text-brass hover:text-gold transition-colors inline-block">
              Activate New Credential
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
