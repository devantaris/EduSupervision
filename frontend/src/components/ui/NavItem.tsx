"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  badge?: string;
  onClose?: () => void;
}

export default function NavItem({ href, label, icon, active: explicitActive, badge, onClose }: NavItemProps) {
  const pathname = usePathname();
  const active = explicitActive !== undefined ? explicitActive : (pathname === href || pathname.startsWith(href + "/"));

  return (
    <Link
      href={href}
      onClick={onClose}
      className={`nav-item flex items-center gap-3 rounded-md px-3 py-2.5 text-sm ${
        active ? "active text-parchment" : "text-slate-300"
      }`}
    >
      <span className={active ? "text-brass" : "text-slate-400"}>{icon}</span>
      {label}
      {badge && (
        <span className="ml-auto text-[10px] font-semibold bg-burgundy/60 text-brass rounded-full px-2 py-0.5 border hairline">
          {badge}
        </span>
      )}
    </Link>
  );
}
