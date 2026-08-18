"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import InstitutionSeal from "@/components/ui/InstitutionSeal";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !employeeId || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          first_name: firstName,
          last_name: lastName,
          employee_id: employeeId,
          password,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to activate account.");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
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

      <div className="w-full max-w-lg relative z-10">
        <div className="rounded-xl border hairline bg-obsidian p-8 sm:p-10 shadow-2xl relative">
          <div className="absolute inset-0 bg-gradient-to-b from-burgundy/5 to-transparent rounded-xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center text-center space-y-6 mb-8">
            <InstitutionSeal initials="AR" className="w-16 h-16 text-gold" />
            <div className="space-y-2">
              <h1 className="font-cinzel text-2xl font-bold uppercase tracking-wider text-parchment">
                Educator Registration
              </h1>
              <p className="text-[10px] tracking-[0.22em] uppercase text-slate-400 font-bold">
                Activate Your Professional Credential
              </p>
            </div>
          </div>

          {success ? (
            <div className="relative z-10 space-y-4 text-center py-8">
              <h2 className="font-cinzel text-xl font-bold text-brass uppercase">Credential Activated</h2>
              <p className="text-slate-400 text-sm font-playfair">
                Your professional educator profile has been provisioned successfully.
              </p>
              <p className="text-[10px] uppercase tracking-[0.22em] text-burgundy font-bold animate-pulse pt-4">
                Routing to Central Registry...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
              {token && (
                <div className="bg-obsidian/50 border hairline rounded p-3 text-center">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500 block mb-1">Authorization Token</span>
                  <code className="text-xs text-brass truncate block">{token}</code>
                </div>
              )}

              {error && (
                <div className="bg-red-950/50 border border-red-900 rounded p-3 text-xs text-red-400 text-center uppercase tracking-wide">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.22em]">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={loading}
                      placeholder="Jane"
                      className="field w-full"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.22em]">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={loading}
                      placeholder="Doe"
                      className="field w-full"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.22em]">
                    Institutional Identifier
                  </label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    disabled={loading}
                    placeholder="EMP-12345"
                    className="field w-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.22em]">
                    Establish Passkey
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
                className="w-full bg-gradient-to-r from-burgundy to-crimson border border-brass/30 text-parchment font-cinzel tracking-wide font-bold py-3 rounded-md shadow-lg shadow-burgundy/20 hover:opacity-90 transition-all duration-300 disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? "Provisioning..." : "Finalize Registration"}
              </button>
            </form>
          )}

          {!success && (
            <div className="mt-8 text-center relative z-10">
              <Link href="/login" className="text-[10px] uppercase tracking-[0.22em] font-bold text-slate-500 hover:text-brass transition-colors">
                Return to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
