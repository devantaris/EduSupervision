import React from "react";
import NotificationBell from "@/components/NotificationBell";
import UserBadge from "@/components/ui/UserBadge";

interface TopBarProps {
  breadcrumb: string;
  title: string;
  userName?: string;
  userRole?: string;
  userInitials?: string;
  actions?: React.ReactNode;
}

export default function TopBar({
  breadcrumb,
  title,
  userName = "Administrator",
  userRole = "School Administrator",
  userInitials = "AD",
  actions,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-40 bg-void/85 backdrop-blur-md border-b hairline">
      <div className="flex items-center gap-4 px-8 h-16">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">{breadcrumb}</p>
          <h1 className="font-cinzel text-lg text-parchment leading-tight truncate">{title}</h1>
        </div>

        <div className="ml-auto flex items-center gap-5">
          {/* Search */}
          <div className="hidden md:flex items-center gap-2 rounded-md border hairline-w bg-obsidian/80 px-3 py-2 w-72">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              placeholder="Search registry, staff, submissions…"
              className="bg-transparent outline-none text-sm w-full placeholder:text-slate-600 text-slate-200"
            />
            <kbd className="text-[10px] text-slate-500 border hairline-w rounded px-1.5 py-0.5">⌘K</kbd>
          </div>

          <NotificationBell />

          {actions}

          <div className="h-8 w-px bg-white/10 hidden sm:block" />

          <div className="text-right hidden sm:block">
            <p className="text-sm text-parchment">{userName}</p>
            <p className="text-[11px] text-slate-500">{userRole}</p>
          </div>
          <UserBadge initials={userInitials} />
        </div>
      </div>
    </header>
  );
}
