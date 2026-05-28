import React from "react";

const METRICS = [
  {
    label: "Active Teachers",
    value: "0",
    sub: "Onboarding pending setup",
    subColor: "text-emerald-400",
    icon: "👥",
    accent: "indigo",
  },
  {
    label: "Total Submissions",
    value: "0",
    sub: "No active assignments",
    subColor: "text-slate-500",
    icon: "📋",
    accent: "purple",
  },
  {
    label: "Average Score",
    value: "N/A",
    sub: "Grades pending AI eval",
    subColor: "text-slate-500",
    icon: "🎯",
    accent: "emerald",
  },
  {
    label: "Plagiarism Alerts",
    value: "0",
    sub: "All submissions verified",
    subColor: "text-emerald-400",
    icon: "🛡️",
    accent: "amber",
  },
];

const QUICK_ACTIONS = [
  { label: "Invite Educator", href: "/admin/teachers", icon: "➕", color: "indigo" },
  { label: "Upload Content", href: "/admin/content", icon: "📤", color: "purple" },
  { label: "New Assignment", href: "/admin/assignments", icon: "📝", color: "emerald" },
  { label: "View Roster", href: "/admin/teachers", icon: "👥", color: "amber" },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-10 max-w-7xl">
      {/* ── Page header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-950/40 border border-indigo-900/50 rounded-full px-3 py-1 text-xs text-indigo-300 font-semibold mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Supervision View
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight">
            Supervision Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1.5">
            Monitor educational standards, teacher activations, and submission reviews.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2.5">
          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          Last updated: just now
        </div>
      </div>

      {/* ── Metric cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {METRICS.map((m) => (
          <div
            key={m.label}
            className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-200 relative overflow-hidden"
          >
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-24 h-24 opacity-20 pointer-events-none">
              <div
                className={`w-full h-full rounded-full blur-2xl ${
                  m.accent === "indigo"
                    ? "bg-indigo-500"
                    : m.accent === "purple"
                    ? "bg-purple-500"
                    : m.accent === "emerald"
                    ? "bg-emerald-500"
                    : "bg-amber-500"
                }`}
              />
            </div>
            <div className="flex items-start justify-between relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {m.label}
              </span>
              <span className="text-xl">{m.icon}</span>
            </div>
            <div className="relative z-10">
              <div className="text-4xl font-black text-slate-100">{m.value}</div>
              <span className={`text-[11px] mt-1 block font-medium ${m.subColor}`}>
                {m.sub}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick actions + setup notice ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-200">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:border-slate-700 hover:bg-slate-800/30 transition-all duration-200 text-center group"
              >
                <span className="text-2xl">{action.icon}</span>
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-200 transition-colors">
                  {action.label}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Setup / system status */}
        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-950/30 via-slate-900/40 to-slate-900/30 border border-indigo-800/30 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200">Platform Setup Status</h2>
            <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-950/60 text-emerald-400 border border-emerald-900/60 px-2.5 py-1 rounded-full font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Phase 1 Complete
            </span>
          </div>

          <div className="space-y-3">
            {[
              { label: "Database schemas provisioned", done: true },
              { label: "Authentication & RBAC configured", done: true },
              { label: "Multi-tenant isolation active", done: true },
              { label: "Teacher onboarding flows live", done: true },
              { label: "AI evaluation pipeline connected", done: false },
              { label: "Advanced analytics dashboard", done: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black ${
                    item.done
                      ? "bg-emerald-950/60 text-emerald-400 border border-emerald-900/60"
                      : "bg-slate-800/60 text-slate-600 border border-slate-700/60"
                  }`}
                >
                  {item.done ? "✓" : "○"}
                </div>
                <span
                  className={`text-xs font-medium ${
                    item.done ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-500 border-t border-slate-800/50 pt-4">
            Connect to API services to visualize educational audits and enable AI grading workflows.
          </p>
        </div>
      </div>
    </div>
  );
}
