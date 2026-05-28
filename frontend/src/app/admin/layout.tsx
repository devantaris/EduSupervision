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
      <span className="text-base">📊</span>
    ),
  },
  {
    href: "/admin/teachers",
    label: "Teacher Roster",
    icon: (
      <span className="text-base">👥</span>
    ),
  },
  {
    href: "/admin/content",
    label: "Content Library",
    icon: (
      <span className="text-base">📚</span>
    ),
  },
  {
    href: "/admin/assignments",
    label: "Assignments",
    icon: (
      <span className="text-base">📝</span>
    ),
  },
  {
    href: "/admin/evaluations",
    label: "Evaluations",
    icon: (
      <span className="text-base">🧠</span>
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
    <aside className="w-64 shrink-0 h-screen sticky top-0 bg-[#070a10] border-hairline-r flex flex-col overflow-hidden select-none">
      
      {/* ── Logo / Seal ── */}
      <div className="px-6 pt-8 pb-6 border-hairline-b">
        <Link href="/admin/dashboard" className="flex flex-col gap-2" onClick={onClose}>
          <span className="font-serif-display text-lg tracking-widest font-black uppercase text-gold">
            EduSupervision
          </span>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center px-2 py-0.5 rounded border border-flame/30 text-[8px] font-bold tracking-widest text-flame uppercase">
              Admin Console
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-flame animate-pulse-ring" />
          </div>
        </Link>
      </div>

      {/* ── Nav Feed ── */}
      <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto">
        <p className="px-3 mb-4 text-[9px] uppercase tracking-widest text-slate-500 font-black">
          Operations Dossier
        </p>
        
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`
                flex items-center gap-3 px-4 py-3 rounded border transition-all duration-300 group
                ${
                  active
                    ? "bg-[#140e0e] text-gold border-gold/30 shadow-lg shadow-amber-950/5"
                    : "text-slate-400 hover:text-white border-transparent hover:bg-[#121214]/50"
                }
              `}
            >
              <span className={`transition-transform duration-300 group-hover:scale-110 ${active ? 'scale-105' : ''}`}>
                {icon}
              </span>
              <span className="text-xs font-bold tracking-wide uppercase">{label}</span>
              
              {active && (
                <span className="ml-auto w-1 h-1 rounded-full bg-flame animate-pulse-ring" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer Metadata ── */}
      <div className="px-5 pb-8 pt-4 border-hairline-t space-y-4">
        {/* Institution Metadata Plate */}
        <div className="flex items-center gap-3 px-3 py-3 border border-hairline bg-[#0c0f16]/40 relative">
          <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold/30" />
          <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-gold/30" />
          <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-950/30 to-background border border-hairline flex items-center justify-center shrink-0 text-sm">
            🏫
          </div>
          <div className="min-w-0">
            <p className="text-xs font-serif font-black text-slate-200 truncate">Oakridge Academy</p>
            <span className="inline-flex items-center mt-0.5 text-[8px] font-black tracking-widest text-gold uppercase">
              Administrator
            </span>
          </div>
        </div>

        {/* Exit Portal Trigger */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2.5 px-3 py-2.5 rounded
            bg-[#150a0a] hover:bg-[#200f0f] border border-red-900/35
            text-red-400 text-[10px] tracking-widest uppercase font-black
            transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loggingOut ? (
            <>
              <svg className="w-3 h-3 animate-spin text-red-400" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
              </svg>
              Exiting...
            </>
          ) : (
            <>
              <span className="text-xs">🚪</span>
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
    <div className="min-h-screen flex bg-background text-foreground relative">
      
      {/* Background low-density grid lines */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none opacity-[0.015] bg-[linear-gradient(to_right,var(--accent-gold)_1px,transparent_1px),linear-gradient(to_bottom,var(--accent-gold)_1px,transparent_1px)] bg-[size:4rem_4rem] z-0" />
      
      {/* Desktop sidebar */}
      <div className="hidden lg:flex relative z-10">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="absolute inset-0 bg-background/90 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className="relative z-50 animate-slate-reveal">
            <Sidebar onClose={() => setMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content viewport */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-[#070a10] border-hairline-b sticky top-0 z-30">
          <button
            onClick={() => setMenuOpen(true)}
            className="p-2 border border-hairline bg-background text-slate-300 transition-all cursor-pointer"
            aria-label="Open menu"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-serif-display text-lg tracking-widest font-black uppercase text-gold">
            EduSupervision
          </span>
          <div className="h-1.5 w-1.5 rounded-full bg-flame animate-pulse-ring" />
        </header>

        <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
