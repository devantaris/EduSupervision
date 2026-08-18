import React from "react";

interface UserBadgeProps {
  initials: string;
  name?: string;
  role?: string;
  variant?: "square" | "round" | "gold" | "burgundy";
}

export default function UserBadge({ initials, name, role, variant = "square" }: UserBadgeProps) {
  const shape = variant === "round" ? "rounded-full" : "rounded-md";
  const bgStyle =
    variant === "gold"
      ? "bg-gradient-to-br from-gold/30 to-brass/10 border border-gold/40 text-gold"
      : "bg-gradient-to-br from-burgundy to-crimson border hairline text-brass";

  if (!name) {
    return (
      <div
        className={`w-10 h-10 ${shape} ${bgStyle} flex items-center justify-center font-cinzel font-bold text-sm`}
      >
        {initials}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-10 h-10 ${shape} ${bgStyle} flex items-center justify-center font-cinzel font-bold text-sm`}
      >
        {initials}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-parchment truncate">{name}</p>
        {role && <p className="text-[11px] text-slate-500 truncate">{role}</p>}
      </div>
    </div>
  );
}
