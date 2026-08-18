"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { apiFetch, tokenStore } from "@/lib/api";
import NotificationBell from "@/components/NotificationBell";
import InstitutionSeal from "@/components/ui/InstitutionSeal";
import NavItem from "@/components/ui/NavItem";
import UserBadge from "@/components/ui/UserBadge";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // swallow
    } finally {
      tokenStore.clear();
      window.location.href = "/login";
    }
  };

  return (
    <div className="min-h-screen flex bg-void text-parchment font-jakarta">
      {/* Sidebar */}
      <aside className="w-72 shrink-0 border-r hairline bg-obsidian flex flex-col justify-between sticky top-0 h-screen overflow-y-auto">
        {/* TOP */}
        <div className="flex flex-col gap-8 p-6">
          <div className="flex items-center gap-3">
            <InstitutionSeal initials="EU" />
            <div className="flex flex-col">
              <h1 className="font-cinzel text-lg tracking-wider text-parchment uppercase">
                EduSupervision
              </h1>
              <span className="text-[10px] uppercase tracking-[0.22em] text-brass">
                Educator
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 border hairline px-3 py-2 rounded-md bg-obsidian/50">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
              Ministry Registry · Connected
            </span>
          </div>

          <nav className="flex flex-col gap-2">
            <div className="px-3 mb-2 text-[10px] uppercase tracking-[0.22em] text-slate-500">
              Workspace
            </div>
            <NavItem 
              href="/teacher/dashboard"
              label="Dashboard"
              active={pathname === "/teacher/dashboard"}
              icon={<svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>}
            />
            <NavItem 
              href="/teacher/training"
              label="Training Library"
              active={pathname.startsWith("/teacher/training")}
              icon={<svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" /></svg>}
            />
            <NavItem 
              href="/teacher/assignments"
              label="My Submissions"
              active={pathname.startsWith("/teacher/assignments")}
              icon={<svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.56 2.25h-3.12a2.25 2.25 0 00-2.106 1.638m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184m-3.75 3.386c.18.043.365.082.551.114C3.259 7.514 2.25 8.716 2.25 10.13v9c0 1.597 1.29 2.893 2.885 2.946A5.94 5.94 0 007.5 22.5h9a5.94 5.94 0 002.365-.486c1.595-.053 2.885-1.349 2.885-2.946v-9c0-1.415-1.009-2.617-2.45-2.83a48.14 48.14 0 00-.551-.114M15 15h.008v.008H15V15zm-3 0h.008v.008H12V15zm-3 0h.008v.008H9V15zm6-3h.008v.008H15V12zm-3 0h.008v.008H12V12zm-3 0h.008v.008H9V12z" /></svg>}
            />
            <NavItem 
              href="/teacher/analytics"
              label="My Progress"
              active={pathname.startsWith("/teacher/analytics")}
              icon={<svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>}
            />
          </nav>
        </div>

        {/* FOOTER */}
        <div className="p-6 flex flex-col gap-4 border-t hairline bg-obsidian">
          <div className="rounded-xl border hairline bg-void p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                CPD Hours
              </span>
              <span className="text-[10px] font-bold text-brass">0 / 20 hrs</span>
            </div>
            <div className="w-full h-1 bg-void rounded-full overflow-hidden border hairline">
              <div
                className="h-full bg-gradient-to-r from-burgundy to-brass rounded-full"
                style={{ width: "0%" }}
              />
            </div>
          </div>
          
          <UserBadge initials="ED" name="Welcome back!" role="Educator" variant="gold" />

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 rounded-md border hairline px-4 py-2 text-xs text-brass hover:border-brass/50 disabled:opacity-50 transition-colors"
          >
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            {loggingOut ? "SIGNING OUT..." : "LOG OUT"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-void relative">
        <div className="absolute top-6 right-6 z-50">
          <NotificationBell />
        </div>
        <div className="max-w-6xl mx-auto px-10 py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
