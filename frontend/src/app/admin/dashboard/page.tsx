import React from "react";
import Link from "next/link";

const METRICS = [
  {
    label: "Active Teachers",
    value: "0",
    sub: "Onboarding pending activation",
    subColor: "text-flame",
    icon: "👥",
  },
  {
    label: "Total Submissions",
    value: "0",
    sub: "No active assignments parsed",
    subColor: "text-slate-500",
    icon: "📋",
  },
  {
    label: "Average Score",
    value: "N/A",
    sub: "Grades pending evaluation",
    subColor: "text-slate-500",
    icon: "🎯",
  },
  {
    label: "Plagiarism Alerts",
    value: "0",
    sub: "All vectors verified clean",
    subColor: "text-gold",
    icon: "🛡️",
  },
];

const QUICK_ACTIONS = [
  { label: "Invite Teacher", href: "/admin/teachers", desc: "Dispatches 72h invite key" },
  { label: "Upload Content", href: "/admin/content", desc: "Ingests video or curriculum PDF" },
  { label: "New Assignment", href: "/admin/assignments", desc: "Embeds rubric JSON scoring schema" },
  { label: "View Roster", href: "/admin/teachers", desc: "Audits teacher logs & status" },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-12 max-w-7xl animate-slate-reveal">
      
      {/* ── Page Header (Editorial) ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-hairline-b pb-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 border border-flame/30 bg-amber-950/20 rounded px-2.5 py-0.5 text-[9px] tracking-widest uppercase text-flame">
            <span className="h-1.5 w-1.5 rounded-full bg-flame animate-pulse" />
            Live Audit Stream
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-black uppercase text-white tracking-tight">
            Institutional <br />
            <span className="gradient-text-gold">Supervision Ledger</span>
          </h1>
          <p className="text-slate-400 text-xs font-light max-w-xl">
            Analyze professional development standards, invite academic cohorts, and manage objective AI evaluations.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase font-bold text-slate-500 border border-hairline px-4 py-2 bg-[#0c0c0e]/30">
          Last Synced: Just Now
        </div>
      </div>

      {/* ── Metric Dossiers (Asymmetrical plates) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {METRICS.map((m) => (
          <div
            key={m.label}
            className="border-hairline p-6 bg-[#0d0d0f]/20 relative flex flex-col justify-between group overflow-hidden min-h-[170px]"
          >
            {/* Fine decoration */}
            <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold/30" />
            
            <div className="flex items-start justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                {m.label}
              </span>
              <span className="text-base opacity-40 group-hover:opacity-100 transition-opacity">{m.icon}</span>
            </div>
            
            <div className="space-y-1 mt-4">
              <div className="font-serif text-5xl font-black text-white tracking-tighter">{m.value}</div>
              <span className={`text-[9px] tracking-wider uppercase font-bold ${m.subColor}`}>
                {m.sub}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Double Column Asymmetrical Workspaces ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Action Box (col-span-4) */}
        <div className="lg:col-span-4 border-hairline p-8 bg-[#0d0d0f]/20 relative flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold/30" />
          
          <div className="space-y-6">
            <h2 className="font-serif text-lg font-bold text-white uppercase tracking-widest border-hairline-b pb-4">
              Supervision Tools
            </h2>
            <div className="space-y-4">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="group flex flex-col gap-1 p-4 border border-hairline hover:border-gold/40 bg-background/50 hover:bg-[#121214]/50 transition-all duration-300"
                >
                  <div className="flex justify-between items-center text-xs font-black tracking-widest uppercase text-slate-300 group-hover:text-gold transition-colors">
                    <span>{action.label}</span>
                    <span>→</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-light leading-relaxed">
                    {action.desc}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Status Timeline (col-span-8) */}
        <div className="lg:col-span-8 border border-hairline bg-[#0c0c0e]/30 p-8 relative flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold/30" />
          
          <div className="space-y-8">
            <div className="flex items-center justify-between border-hairline-b pb-4">
              <h2 className="font-serif text-lg font-bold text-white uppercase tracking-widest">
                Platform Build Phase Status
              </h2>
              <span className="inline-flex items-center gap-1.5 text-[9px] tracking-widest uppercase bg-amber-950/20 text-gold border border-gold/30 px-3 py-1 font-bold">
                Phase 1 Active
              </span>
            </div>

            {/* Micro Asymmetrical Vertical Line Timeline */}
            <div className="relative pl-6 border-l border-hairline space-y-6 my-2">
              {[
                { label: "Database Core Schemas & Migration Provisioning", done: true, phase: "Phase 1" },
                { label: "Stateless Asymmetric RS256 Auth & Cross-tenant Security", done: true, phase: "Phase 2" },
                { label: "Bulk Cohort Inviter & Register Verification Links", done: true, phase: "Phase 3" },
                { label: "Presigning Material Ingestion & Debounced Telemetry", done: true, phase: "Phase 4" },
                { label: "Asynchronous Gemini Evaluator & Vector Plagiarism Index", done: false, phase: "Phase 5" },
                { label: "Longitudinal Analytics ledger & supervision dashboards", done: false, phase: "Phase 6" },
              ].map((item) => (
                <div key={item.label} className="relative group">
                  {/* Point Indicator */}
                  <span className={`absolute -left-[30px] top-1 h-3.5 w-3.5 rounded-full border border-background flex items-center justify-center
                    ${item.done ? 'bg-gold' : 'bg-background border-hairline'}
                  `} />
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-200 group-hover:text-gold transition-colors duration-300">
                        {item.label}
                      </span>
                      <span className="text-[8px] uppercase tracking-widest text-slate-500 font-bold">
                        {item.phase}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-slate-500 font-light border-t border-hairline pt-6 mt-8">
            FastAPI integration pipelines and Celery queues are active. All supervision interactions are tracked and logged in audit trails.
          </p>
        </div>
      </div>
    </div>
  );
}
