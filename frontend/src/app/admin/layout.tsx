"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, tokenStore } from "@/lib/api";

const NAV_ITEMS = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: "/admin/teachers",
    label: "Teacher Roster",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    href: "/admin/content",
    label: "Content Library",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
  },
  {
    href: "/admin/assignments",
    label: "Assignments",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
  },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // swallow — always redirect
    } finally {
      tokenStore.clear();
      router.push("/login");
    }
  }

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden">
      {/* ── Logo ── */}
      <div className="px-5 pt-6 pb-5 border-b border-slate-800/70">
        <Link href="/admin/dashboard" className="flex items-center gap-3" onClick={onClose}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
            <span className="text-white font-black text-base leading-none">E</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-[15px] font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent leading-tight truncate">
              EduSupervision
            </h1>
            <span className="inline-flex items-center mt-0.5 px-2 py-0.5 rounded-full bg-indigo-950/70 border border-indigo-800/60 text-[9px] font-bold tracking-widest text-indigo-300 uppercase">
              Admin Console
            </span>
          </div>
        </Link>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-3 text-[9px] uppercase tracking-widest text-slate-600 font-bold">
          Management
        </p>
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold
                transition-all duration-150
                ${
                  active
                    ? "bg-indigo-950/50 text-indigo-300 border-l-2 border-indigo-500 pl-[10px] shadow-sm shadow-indigo-900/30"
                    : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/40 border-l-2 border-transparent pl-[10px]"
                }
              `}
            >
              <span className={active ? "text-indigo-400" : "text-slate-600 group-hover:text-slate-400"}>
                {icon}
              </span>
              <span>{label}</span>
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400/50 animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer / User ── */}
      <div className="px-4 pb-5 pt-4 border-t border-slate-800/70 space-y-3">
        {/* Institution card */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/30 border border-slate-800/50">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center shrink-0 text-sm">
            🏫
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-200 truncate">Oakridge Academy</p>
            <span className="inline-flex items-center mt-0.5 px-1.5 py-px rounded-full bg-purple-950/60 border border-purple-800/50 text-[9px] font-bold tracking-wider text-purple-300 uppercase">
              Administrator
            </span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl
            bg-red-950/40 hover:bg-red-900/40 border border-red-900/40
            text-red-400 text-xs font-bold tracking-wide
            transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loggingOut ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
              </svg>
              Signing out…
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
              </svg>
              Sign Out
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className="relative z-50">
            <Sidebar onClose={() => setMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-4 px-4 py-3 bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
          <button
            onClick={() => setMenuOpen(true)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
            EduSupervision
          </span>
        </header>

        <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
