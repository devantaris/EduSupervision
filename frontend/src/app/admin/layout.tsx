"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, tokenStore } from "@/lib/api";
import NotificationBell from "@/components/NotificationBell";
import InstitutionSeal from "@/components/ui/InstitutionSeal";
import NavItem from "@/components/ui/NavItem";
import UserBadge from "@/components/ui/UserBadge";

const ICONS = {
  dashboard: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  ),
  assignments: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  ),
  evaluations: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
    </svg>
  ),
  analytics: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  teachers: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  content: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
};

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
    <aside className="w-72 shrink-0 h-screen sticky top-0 bg-obsidian border-r hairline flex flex-col overflow-hidden select-none">
      
      {/* ── Logo / Seal ── */}
      <div className="px-6 pt-8 pb-6 border-b hairline">
        <Link href="/admin/dashboard" className="flex flex-col gap-2" onClick={onClose}>
          <div className="flex items-center gap-3">
            <InstitutionSeal initials="RJ" />
            <div className="flex flex-col">
              <span className="font-cinzel text-base tracking-[0.05em] font-bold uppercase text-gold leading-tight">
                Rajasthan Directorate
              </span>
              <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                Academic Registry
              </span>
            </div>
          </div>
        </Link>
        <div className="mt-4 flex items-center justify-between px-3 py-1.5 rounded-md border hairline bg-void">
          <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Ministry Registry · Connected
          </span>
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>

      {/* ── Nav Feed ── */}
      <nav className="flex-1 px-4 py-8 space-y-6 overflow-y-auto">
        
        <div>
          <p className="px-3 mb-2 text-[10px] uppercase tracking-[0.22em] text-slate-500 font-bold">
            Supervision
          </p>
          <div className="space-y-1">
            <NavItem href="/admin/dashboard" label="Command Deck" icon={ICONS.dashboard} active={pathname === "/admin/dashboard"} />
            <NavItem href="/admin/assignments" label="Rubric Builder" icon={ICONS.assignments} active={pathname === "/admin/assignments"} />
            <NavItem href="/admin/evaluations" label="AI Evaluations" icon={ICONS.evaluations} active={pathname === "/admin/evaluations"} badge="3 new" />
            <NavItem href="/admin/analytics" label="Analytics & CPD" icon={ICONS.analytics} active={pathname === "/admin/analytics"} />
          </div>
        </div>

        <div>
          <p className="px-3 mb-2 text-[10px] uppercase tracking-[0.22em] text-slate-500 font-bold">
            Administration
          </p>
          <div className="space-y-1">
            <NavItem href="/admin/teachers" label="Teacher Roster" icon={ICONS.teachers} active={pathname === "/admin/teachers"} />
            <NavItem href="/admin/content" label="Content Library" icon={ICONS.content} active={pathname === "/admin/content"} />
          </div>
        </div>
      </nav>

      {/* ── Footer Metadata ── */}
      <div className="px-5 pb-8 pt-4 border-t hairline space-y-4">
        <UserBadge initials="AD" name="Admin User" role="Administrator" variant="gold" />

        {/* Exit Portal Trigger */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2.5 px-3 py-2.5 rounded-md
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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
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
    <div className="min-h-screen flex bg-void text-parchment relative font-jakarta">
      
      {/* Desktop sidebar */}
      <div className="hidden lg:flex relative z-10">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="absolute inset-0 bg-void/90 backdrop-blur-sm"
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
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-obsidian border-b hairline sticky top-0 z-30">
          <button
            onClick={() => setMenuOpen(true)}
            className="p-2 border hairline rounded bg-void text-slate-300 transition-all cursor-pointer"
            aria-label="Open menu"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-cinzel text-lg tracking-widest font-bold uppercase text-gold">
            EduSupervision
          </span>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </header>

        <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
