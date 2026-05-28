"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { apiFetch, tokenStore } from "@/lib/api";
import NotificationBell from "@/components/NotificationBell";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/teacher/dashboard", emoji: "🏠" },
  { label: "Training Library", href: "/teacher/training", emoji: "🎓" },
  { label: "My Submissions", href: "/teacher/assignments", emoji: "📋" },
  { label: "My Progress", href: "/teacher/analytics", emoji: "📈" },
];

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // swallow errors — always clear and redirect
    } finally {
      tokenStore.clear();
      window.location.href = "/login";
    }
  };

  const isActive = (href: string) => {
    if (href === "/teacher/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* ── Sidebar ── */}
      <aside className="w-64 shrink-0 border-r border-slate-800/70 bg-slate-900/60 backdrop-blur-md flex flex-col justify-between sticky top-0 h-screen overflow-y-auto">
        {/* Top: Logo + Nav */}
        <div className="flex flex-col gap-8 p-5">
          {/* Logo block */}
          <div className="flex flex-col gap-1.5 pt-2">
            <div className="flex items-center gap-2.5">
              {/* Gradient icon mark */}
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
                <span className="text-white text-sm font-black leading-none">E</span>
              </div>
              <span className="text-[15px] font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent tracking-tight">
                EduSupervision
              </span>
              <div className="ml-auto">
                <NotificationBell />
              </div>
            </div>
            {/* Badge */}
            <span className="ml-10 inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-indigo-950/70 text-indigo-400 border border-indigo-800/60 rounded-full w-fit">
              Educator Portal
            </span>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-1">
            <div className="px-2 mb-1 text-[9px] font-bold uppercase tracking-widest text-slate-600">
              Workspace
            </div>
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    active
                      ? "bg-indigo-950/50 text-indigo-300 border-l-2 border-indigo-500 pl-[10px] shadow-sm"
                      : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/50 border-l-2 border-transparent"
                  }`}
                >
                  <span className="text-base leading-none">{item.emoji}</span>
                  <span>{item.label}</span>
                  {active && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shadow shadow-indigo-400/60" />
                  )}
                </a>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Welcome + CPD + Logout */}
        <div className="p-4 flex flex-col gap-3">
          {/* CPD Progress card */}
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                CPD Hours
              </span>
              <span className="text-[10px] font-bold text-emerald-400">0 / 20 hrs</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-700"
                style={{ width: "0%" }}
              />
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Complete training modules to earn CPD hours.
            </p>
          </div>

          {/* Welcome message */}
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow shadow-indigo-500/30">
              <span className="text-white text-[10px] font-black">👤</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-200 truncate">Welcome back!</span>
              <span className="text-[10px] text-slate-500 truncate">Educator</span>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-400 bg-red-950/30 hover:bg-red-900/40 border border-red-900/40 hover:border-red-700/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>🚪</span>
            <span>{loggingOut ? "Signing out…" : "Log Out"}</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-y-auto min-h-screen bg-slate-950">
        <div className="max-w-6xl mx-auto px-8 py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
