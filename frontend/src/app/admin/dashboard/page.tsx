"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AssignmentSummary {
  assignment_id: string;
  title: string;
  submission_count: number;
  evaluated_count: number;
  average_score: number | null;
  completion_rate: number;
  due_date: string | null;
}

interface InstitutionAnalytics {
  institution_name: string;
  total_teachers: number;
  active_teachers: number;
  total_submissions: number;
  evaluated_submissions: number;
  pending_submissions: number;
  average_score: number | null;
  plagiarism_flag_count: number;
  completion_rate: number;
  assignment_summaries: AssignmentSummary[];
}

// ─── Static quick actions ─────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: "Invite Teacher", href: "/admin/teachers", desc: "Dispatches 72h invite key" },
  { label: "Upload Content", href: "/admin/content", desc: "Ingests video or curriculum PDF" },
  { label: "New Assignment", href: "/admin/assignments", desc: "Embeds rubric JSON scoring schema" },
  { label: "View Roster", href: "/admin/teachers", desc: "Audits teacher logs & status" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function MetricSkeleton() {
  return (
    <div className="border-hairline p-6 bg-[#0c0f16]/20 relative min-h-[170px] animate-pulse">
      <div className="h-2 w-20 bg-zinc-800 rounded mb-4" />
      <div className="h-12 w-16 bg-zinc-700 rounded mt-6" />
      <div className="h-2 w-28 bg-zinc-800 rounded mt-3" />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<InstitutionAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch("/api/v1/analytics/institution");
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        } else {
          setError("Failed to load analytics.");
        }
      } catch {
        setError("Network error. Could not reach the backend.");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  const metrics = [
    {
      label: "Total Teachers",
      value: analytics?.total_teachers ?? 0,
      display: loading ? "—" : String(analytics?.total_teachers ?? 0),
      sub: analytics?.total_teachers === 0 ? "Onboarding pending activation" : `${analytics?.active_teachers ?? 0} with submissions`,
      subColor: (analytics?.total_teachers ?? 0) === 0 ? "text-flame" : "text-emerald-400",
      icon: "👥",
    },
    {
      label: "Total Submissions",
      value: analytics?.total_submissions ?? 0,
      display: loading ? "—" : String(analytics?.total_submissions ?? 0),
      sub: analytics?.total_submissions === 0 ? "No submissions yet" : `${analytics?.evaluated_submissions ?? 0} evaluated`,
      subColor: "text-slate-500",
      icon: "📋",
    },
    {
      label: "Average Score",
      value: analytics?.average_score ?? null,
      display: loading ? "—" : analytics?.average_score != null ? analytics.average_score.toFixed(1) : "N/A",
      sub: analytics?.average_score != null ? "Platform evaluation mean" : "Grades pending evaluation",
      subColor: "text-slate-500",
      icon: "🎯",
    },
    {
      label: "Plagiarism Alerts",
      value: analytics?.plagiarism_flag_count ?? 0,
      display: loading ? "—" : String(analytics?.plagiarism_flag_count ?? 0),
      sub: (analytics?.plagiarism_flag_count ?? 0) === 0 ? "All vectors verified clean" : "Pending admin review",
      subColor: (analytics?.plagiarism_flag_count ?? 0) > 0 ? "text-flame" : "text-gold",
      icon: "🛡️",
    },
  ];

  return (
    <div className="space-y-12 max-w-7xl animate-slate-reveal">

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-hairline-b pb-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 border border-flame/30 bg-amber-950/20 rounded px-2.5 py-0.5 text-[9px] tracking-widest uppercase text-flame">
            <span className="h-1.5 w-1.5 rounded-full bg-flame animate-pulse" />
            Live Audit Stream
          </div>
          <h1 className="font-serif-display text-4xl sm:text-5xl font-black uppercase text-white tracking-tight">
            Institutional <br />
            <span className="gradient-text-gold">Supervision Ledger</span>
          </h1>
          <p className="text-slate-400 text-xs font-light max-w-xl">
            Analyze professional development standards, invite academic cohorts, and manage objective AI evaluations.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase font-bold text-slate-500 border border-hairline px-4 py-2 bg-[#0c0f16]/30">
          {loading ? "Syncing..." : error ? "Sync Error" : "Last Synced: Just Now"}
        </div>
      </div>

      {/* ── Error State ── */}
      {error && !loading && (
        <div className="border border-red-900/40 bg-red-950/20 rounded px-5 py-3 text-xs text-red-400 font-bold">
          ⚠ {error}
        </div>
      )}

      {/* ── Metric Dossiers ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {loading
          ? [0, 1, 2, 3].map((i) => <MetricSkeleton key={i} />)
          : metrics.map((m) => (
              <div
                key={m.label}
                className="border-hairline p-6 bg-[#0c0f16]/20 relative flex flex-col justify-between group overflow-hidden min-h-[170px]"
              >
                <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold/30" />
                <div className="flex items-start justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{m.label}</span>
                  <span className="text-base opacity-40 group-hover:opacity-100 transition-opacity">{m.icon}</span>
                </div>
                <div className="space-y-1 mt-4">
                  <div className="font-serif text-5xl font-black text-white tracking-tighter">{m.display}</div>
                  <span className={`text-[9px] tracking-wider uppercase font-bold ${m.subColor}`}>{m.sub}</span>
                </div>
              </div>
            ))}
      </div>

      {/* ── Double Column Workspaces ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left: Quick Actions */}
        <div className="lg:col-span-4 border-hairline p-8 bg-[#0c0f16]/20 relative flex flex-col justify-between">
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
                  className="group flex flex-col gap-1 p-4 border border-hairline hover:border-gold/40 bg-background/50 hover:bg-[#121620]/50 transition-all duration-300"
                >
                  <div className="flex justify-between items-center text-xs font-black tracking-widest uppercase text-slate-300 group-hover:text-gold transition-colors">
                    <span>{action.label}</span>
                    <span>→</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-light leading-relaxed">{action.desc}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live Assignment Overview */}
        <div className="lg:col-span-8 border border-hairline bg-[#0c0f16]/10 p-8 relative flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold/30" />

          <div className="space-y-8">
            <div className="flex items-center justify-between border-hairline-b pb-4">
              <h2 className="font-serif text-lg font-bold text-white uppercase tracking-widest">
                Live Assignment Overview
              </h2>
              <Link
                href="/admin/assignments"
                className="text-[9px] tracking-widest uppercase font-bold text-gold hover:text-white transition-colors"
              >
                Manage All →
              </Link>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="w-3 h-3 rounded-full bg-zinc-700 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-3/4 bg-zinc-800 rounded" />
                      <div className="h-2 w-1/3 bg-zinc-900 rounded" />
                    </div>
                    <div className="h-3 w-12 bg-zinc-800 rounded" />
                  </div>
                ))}
              </div>
            ) : analytics?.assignment_summaries?.length ? (
              <div className="relative pl-6 border-l border-hairline space-y-6 my-2">
                {analytics.assignment_summaries.slice(0, 6).map((a) => {
                  const hasSubmissions = a.submission_count > 0;
                  return (
                    <div key={a.assignment_id} className="relative group">
                      <span
                        className={`absolute -left-[30px] top-1 h-3.5 w-3.5 rounded-full border border-background flex items-center justify-center
                          ${hasSubmissions ? "bg-gold" : "bg-background border-hairline"}
                        `}
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-xs font-bold text-slate-200 group-hover:text-gold transition-colors duration-300">
                            {a.title}
                          </span>
                          <span className="text-[8px] uppercase tracking-widest text-slate-500 font-bold">
                            {a.submission_count} submission{a.submission_count !== 1 ? "s" : ""}
                          </span>
                          {a.average_score != null && (
                            <span className="text-[8px] uppercase tracking-widest text-gold font-bold">
                              Avg {a.average_score.toFixed(1)}
                            </span>
                          )}
                          {a.due_date && (
                            <span className="text-[8px] uppercase tracking-widest text-slate-600 font-bold">
                              Due {formatDate(a.due_date)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                <span className="text-3xl opacity-20">📋</span>
                <p className="text-xs text-slate-500">No assignments created yet.</p>
                <Link
                  href="/admin/assignments"
                  className="text-[10px] tracking-widest uppercase font-bold text-gold hover:text-white transition-colors"
                >
                  Create First Assignment →
                </Link>
              </div>
            )}
          </div>

          <p className="text-[10px] text-slate-500 font-light border-t border-hairline pt-6 mt-8">
            FastAPI integration pipelines and Celery queues are active. All supervision interactions are tracked and logged in audit trails.
          </p>
        </div>
      </div>
    </div>
  );
}
