"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { tokenStore } from "@/lib/api";

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Invalid email or password.");
      }

      const { access_token, expires_in, user } = await res.json();
      
      // Store access token in memory
      tokenStore.set(access_token, expires_in);

      // Redirect to correct dashboard
      if (user.role === "Teacher") {
        router.push("/teacher/dashboard");
      } else {
        router.push("/admin/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-100">Welcome Back</h2>
        <p className="text-slate-400 text-sm">Sign in to your institutional account</p>
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-900 rounded-lg p-3 text-xs text-red-300">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            placeholder="name@institution.edu"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            placeholder="••••••••"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </div>
    </form>
  );
}
