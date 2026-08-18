"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ScoreDistribution {
  range_label: string;
  count: number;
  percentage: number;
}

interface CriterionPerformance {
  criterion: string;
  avg_score: number;
  submission_count: number;
}

interface TeacherSummary {
  teacher_id: string;
  display_name: string;
  email: string;
  total_submissions: number;
  evaluated_submissions: number;
  average_score: number | null;
  latest_score: number | null;
  cpd_stage: "Foundation" | "Practice" | "Advanced" | "Expert";
  has_plagiarism_flag: boolean;
}

interface AssignmentSummary {
  assignment_id: string;
  title: string;
  submission_count: number;
  evaluated_count: number;
  average_score: number | null;
  completion_rate: number;
}

interface Analytics {
  institution_name: string;
  total_teachers: number;
  active_teachers: number;
  total_submissions: number;
  evaluated_submissions: number;
  pending_submissions: number;
  failed_submissions: number;
  average_score: number | null;
  score_distribution: ScoreDistribution[];
  top_criterion_gaps: CriterionPerformance[];
  plagiarism_flag_count: number;
  completion_rate: number;
  teacher_summaries: TeacherSummary[];
  assignment_summaries: AssignmentSummary[];
  generated_at: string;
}

// ─── CPD Stage Config ─────────────────────────────────────────────────────────

const CPD_STAGE = {
  Foundation: { color: "text-slate-400", bg: "bg-slate-800/60 border-slate-700/50", icon: "🏫" },
  Practice: { color: "text-amber-400", bg: "bg-amber-950/40 border-amber-900/50", icon: "📖" },
  Advanced: { color: "text-blue-400", bg: "bg-blue-950/40 border-blue-900/50", icon: "🎓" },
  Expert: { color: "text-[#dfc397]", bg: "bg-[#1a150c]/60 border-[#dfc397]/20", icon: "⭐" },
};

// ─── Mini Components ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color = "text-brass",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-obsidian border hairline rounded-xl p-6 shadow-xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brass/5 via-transparent to-transparent pointer-events-none" />
      <div className="relative z-10">
        <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-bold mb-4">{label}</p>
        <p className={`text-4xl font-cinzel font-bold tracking-wider ${color}`}>{value}</p>
        {sub && <p className="text-[10px] uppercase tracking-widest text-slate-600 mt-2 font-semibold">{sub}</p>}
      </div>
    </div>
  );
}

function MiniBar({ value, max = 100, color = "#dfc397" }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden w-full">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

function ScoreChip({ score }: { score: number | null }) {
  if (score === null) return <span className="text-slate-700 text-xs">—</span>;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#dfc397" : "#ef4444";
  return (
    <span className="font-black text-sm" style={{ color }}>
      {score.toFixed(0)}
    </span>
  );
}

// ─── Score Distribution Bar Chart ─────────────────────────────────────────────

function ScoreHistogram({ data }: { data: ScoreDistribution[] }) {
  const maxPct = Math.max(...data.map((d) => d.percentage), 1);
  return (
    <div className="space-y-4">
      {data.map((d) => (
        <div key={d.range_label} className="flex items-center gap-4">
          <span className="text-[10px] font-mono font-bold text-slate-400 w-12 shrink-0">{d.range_label}</span>
          <div className="flex-1 h-6 bg-void border hairline rounded-md overflow-hidden relative">
            <div
              className="h-full transition-all duration-1000 bg-gradient-to-r from-burgundy to-crimson"
              style={{ width: `${(d.percentage / maxPct) * 100}%` }}
            />
            {d.count > 0 && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-parchment tracking-widest">
                {d.count}
              </span>
            )}
          </div>
          <span className="text-[10px] font-cinzel text-brass w-10 text-right font-bold">{d.percentage.toFixed(0)}%</span>
        </div>
      ))}
    </div>
  );
}

// ─── Criterion Gap Chart ───────────────────────────────────────────────────────

function CriterionGapChart({ data }: { data: CriterionPerformance[] }) {
  if (!data.length) {
    return <p className="text-xs text-slate-600 py-4 text-center">No criterion data yet</p>;
  }
  return (
    <div className="space-y-3">
      {data.map((c) => (
        <div key={c.criterion}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400 truncate max-w-[200px]">{c.criterion}</span>
            <span className="text-xs font-black text-[#dfc397] ml-2">{c.avg_score.toFixed(1)}</span>
          </div>
          <MiniBar
            value={c.avg_score}
            max={100}
            color={c.avg_score >= 70 ? "#dfc397" : "#ef4444"}
          />
          <p className="text-[9px] text-slate-700 mt-0.5">{c.submission_count} submissions</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");
  const [tab, setTab] = useState<"overview" | "teachers" | "assignments">("overview");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/analytics/institution");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err?.detail ?? "Failed to load analytics");
        return;
      }
      setData(await res.json());
    } catch {
      setError("Network error while loading analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const filteredTeachers = (data?.teacher_summaries ?? []).filter(
    (t) =>
      !teacherSearch ||
      t.display_name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      t.email.toLowerCase().includes(teacherSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="h-8 bg-slate-800 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-5 animate-pulse">
              <div className="h-3 bg-slate-800 rounded w-16 mb-3" />
              <div className="h-8 bg-slate-800 rounded w-12" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <span className="text-4xl">📊</span>
        <p className="text-red-400 text-sm">{error || "No data available"}</p>
        <button
          onClick={fetchAnalytics}
          className="text-xs text-[#dfc397] border border-[#dfc397]/30 px-4 py-2 rounded-lg hover:bg-[#dfc397]/10 transition-all cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const scoreColor =
    (data.average_score ?? 0) >= 80
      ? "text-emerald-400"
      : (data.average_score ?? 0) >= 60
      ? "text-[#dfc397]"
      : "text-red-400";

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-b hairline-w pb-6">
        <div>
          <h1 className="text-3xl font-cinzel font-bold text-parchment tracking-[0.1em] uppercase">Analytics</h1>
          <p className="text-sm text-slate-500 mt-1.5 font-playfair italic">{data.institution_name}</p>
        </div>
        <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest border hairline bg-obsidian px-3 py-1.5 rounded-md">
          Generated {new Date(data.generated_at).toLocaleString()}
        </p>
      </header>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Institution Average"
          value={data.average_score !== null ? `${data.average_score.toFixed(1)}` : "—"}
          sub="out of 100"
          color={scoreColor}
        />
        <StatCard
          label="Evaluated"
          value={data.evaluated_submissions}
          sub={`of ${data.total_submissions} total`}
          color="text-emerald-400"
        />
        <StatCard
          label="Active Teachers"
          value={data.active_teachers}
          sub={`of ${data.total_teachers} total`}
          color="text-blue-400"
        />
        <StatCard
          label="Completion Rate"
          value={`${data.completion_rate.toFixed(0)}%`}
          sub="submissions evaluated"
          color="text-[#dfc397]"
        />
      </div>

      {/* ── Alert bar ── */}
      {(data.plagiarism_flag_count > 0 || data.failed_submissions > 0) && (
        <div className="flex flex-wrap gap-3">
          {data.plagiarism_flag_count > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-950/40 border border-amber-900/40 text-amber-400 text-xs font-bold">
              ⚠️ {data.plagiarism_flag_count} similarity flag{data.plagiarism_flag_count !== 1 ? "s" : ""} awaiting review
              <Link href="/admin/evaluations" className="underline underline-offset-2 ml-1">
                Review →
              </Link>
            </div>
          )}
          {data.failed_submissions > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-950/40 border border-red-900/40 text-red-400 text-xs font-bold">
              ❌ {data.failed_submissions} failed submission{data.failed_submissions !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-slate-900/40 border border-slate-800/60 rounded-xl p-1 w-fit">
        {(["overview", "teachers", "assignments"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
              tab === t
                ? "bg-[#991b1b] text-[#f5f2eb]"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Tab: Overview ── */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Score Distribution */}
          <div className="bg-obsidian border hairline rounded-xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brass/5 via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.22em] mb-6">
                Score Distribution
              </h2>
              {data.evaluated_submissions === 0 ? (
                <p className="text-xs text-slate-600 py-8 text-center font-playfair italic">No evaluations yet</p>
              ) : (
                <ScoreHistogram data={data.score_distribution} />
              )}
            </div>
          </div>

          {/* Criterion Gap Analysis */}
          <div className="bg-obsidian border hairline rounded-xl p-6 shadow-md relative">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.22em] mb-1">
              Lowest Scoring Criteria
            </h2>
            <p className="text-[10px] text-slate-500 mb-6 font-playfair italic">
              Focus areas for institution-wide professional development
            </p>
            <CriterionGapChart data={data.top_criterion_gaps} />
          </div>

          {/* CPD Stepper */}
          <div className="bg-obsidian border hairline rounded-xl p-6 shadow-md lg:col-span-2 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-brass/5 via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.22em] mb-6">
                CPD Certification Pathway
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {(["Foundation", "Practice", "Advanced", "Expert"] as const).map((stage, idx) => {
                  const count = data.teacher_summaries.filter(
                    (t) => t.cpd_stage === stage
                  ).length;
                  const isLocked = count === 0;
                  
                  return (
                    <div
                      key={stage}
                      className={`relative flex flex-col p-5 rounded-md border hairline ${isLocked ? 'bg-void' : 'bg-void/50'} transition-all`}
                    >
                      {idx < 3 && (
                        <div className="hidden md:block absolute top-1/2 -right-4 w-4 h-px bg-slate-800" />
                      )}
                      <div className="flex items-center justify-between mb-4">
                        <span className={`text-[10px] font-bold uppercase tracking-[0.22em] ${isLocked ? 'text-slate-600' : 'text-brass'}`}>
                          {stage}
                        </span>
                        {isLocked ? (
                          <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                          </svg>
                        ) : (
                          <span className="text-2xl font-cinzel font-bold text-parchment">{count}</span>
                        )}
                      </div>
                      <div className="w-full h-1 bg-obsidian rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-500 ${isLocked ? 'w-0' : 'w-full bg-brass'}`} />
                      </div>
                      <p className="text-[10px] font-playfair italic text-slate-500 mt-3">
                        {isLocked ? 'No teachers at this stage' : `${count} teachers certified`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Teachers ── */}
      {tab === "teachers" && (
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Search teachers…"
            value={teacherSearch}
            onChange={(e) => setTeacherSearch(e.target.value)}
            className="w-full max-w-sm bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-[#f5f2eb] placeholder-slate-600 focus:outline-none focus:border-[#991b1b]/60 transition-colors"
          />

          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-800/60">
                <tr className="text-left">
                  {["Teacher", "CPD Stage", "Avg Score", "Latest", "Submissions", "Flag", "Detail"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-[10px] uppercase tracking-widest text-slate-600 font-bold"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-600 text-xs">
                      No teachers found
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map((t) => {
                    const cfg = CPD_STAGE[t.cpd_stage] ?? CPD_STAGE.Foundation;
                    return (
                      <tr key={t.teacher_id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold text-[#f5f2eb]">{t.display_name}</p>
                          <p className="text-[10px] text-slate-600">{t.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-black ${cfg.color}`}>
                            {cfg.icon} {t.cpd_stage}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <ScoreChip score={t.average_score} />
                        </td>
                        <td className="px-4 py-3">
                          <ScoreChip score={t.latest_score} />
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {t.evaluated_submissions}/{t.total_submissions}
                        </td>
                        <td className="px-4 py-3">
                          {t.has_plagiarism_flag ? (
                            <span className="text-amber-400 text-xs font-bold">⚠</span>
                          ) : (
                            <span className="text-slate-700 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/analytics/teacher/${t.teacher_id}`}
                            className="text-[10px] text-[#dfc397] hover:text-[#f5f2eb] font-bold transition-colors"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: Assignments ── */}
      {tab === "assignments" && (
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800/60">
              <tr className="text-left">
                {["Assignment", "Submissions", "Evaluated", "Avg Score", "Completion"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-[10px] uppercase tracking-widest text-slate-600 font-bold"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {data.assignment_summaries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-600 text-xs">
                    No assignments yet
                  </td>
                </tr>
              ) : (
                data.assignment_summaries.map((a) => (
                  <tr key={a.assignment_id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-xs font-semibold text-[#f5f2eb]">{a.title}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">{a.submission_count}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">{a.evaluated_count}</td>
                    <td className="px-5 py-3.5">
                      <ScoreChip score={a.average_score} />
                    </td>
                    <td className="px-5 py-3.5 w-40">
                      <div className="flex items-center gap-2">
                        <MiniBar value={a.completion_rate} max={100} color="#dfc397" />
                        <span className="text-[10px] text-slate-600 shrink-0 w-10 text-right">
                          {a.completion_rate.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
