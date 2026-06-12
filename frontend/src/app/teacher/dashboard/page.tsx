"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
  max_score: number;
  status: "active" | "draft" | "closed";
  created_at: string;
}

interface PersonalAnalytics {
  total_submissions: number;
  evaluated_submissions: number;
  average_score: number | null;
  cpd_stage: string;
  cpd_stage_progress: number;
  training_completion: number;
  recommendations: string[];
}

// ─── CPD Stage config ─────────────────────────────────────────────────────────

const CPD_STAGES = ["Foundation", "Practice", "Advanced", "Expert"] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function urgencyStyles(daysLeft: number | null): string {
  if (daysLeft === null) return "text-slate-400 bg-[#0c0f16] border-hairline";
  if (daysLeft <= 0) return "text-red-400 bg-[#150a0a] border-red-950/40";
  if (daysLeft <= 3) return "text-red-400 bg-[#150a0a] border-red-950/40";
  if (daysLeft <= 7) return "text-amber-400 bg-[#1e150c] border-amber-950/40";
  return "text-emerald-400 bg-[#081711] border-emerald-950/40";
}

function urgencyLabel(daysLeft: number | null): string {
  if (daysLeft === null) return "No due date";
  if (daysLeft < 0) return "Overdue";
  if (daysLeft === 0) return "Due today";
  if (daysLeft <= 3) return "Urgent";
  if (daysLeft <= 7) return "Due soon";
  return `${daysLeft} days`;
}

const MOTIVATIONAL_QUOTES = [
  { quote: "Education is not the filling of a pail, but the lighting of a fire.", author: "W.B. Yeats" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function TeacherDashboard() {
  const [analytics, setAnalytics] = useState<PersonalAnalytics | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const quote = MOTIVATIONAL_QUOTES[0];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, assignmentsRes] = await Promise.all([
        apiFetch("/api/v1/analytics/teacher/me"),
        apiFetch("/api/v1/assignments?limit=10"),
      ]);

      if (analyticsRes.ok) {
        setAnalytics(await analyticsRes.json());
      }

      if (assignmentsRes.ok) {
        const data = await assignmentsRes.json();
        const list: Assignment[] = (data.assignments ?? data ?? [])
          .filter((a: Assignment) => a.status !== "closed")
          .slice(0, 5);
        setAssignments(list);
      }
    } catch {
      // fail silently — UI shows zeroes/empty gracefully
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived values
  const trainingPct = analytics?.training_completion ?? 0;
  const pendingAssignments = assignments.length - (analytics?.total_submissions ?? 0);
  const pendingCount = Math.max(0, pendingAssignments);
  const avgScore = analytics?.average_score;
  const cpdStage = analytics?.cpd_stage ?? "Foundation";
  const cpdStageIndex = CPD_STAGES.indexOf(cpdStage as typeof CPD_STAGES[number]);

  return (
    <div className="space-y-12 max-w-7xl animate-slate-reveal select-none">

      {/* ── Hero Greeting ── */}
      <section className="border-hairline-b pb-8 space-y-3">
        <div className="inline-flex items-center gap-2 border border-gold/30 bg-amber-950/10 rounded px-2.5 py-0.5 text-[9px] tracking-widest uppercase text-gold animate-float-elastic">
          <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
          Professional Development
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-black uppercase text-white tracking-tight leading-tight">
          Welcome back, <br />
          <span className="gradient-text-gold">Educator Portfolio</span>
        </h1>
        <p className="text-slate-400 text-xs font-light max-w-xl">
          Your professional training track is currently underway. Audit module progression, track watch hours, and submit rubric evaluations.
        </p>
      </section>

      {/* ── Stat Plates ── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Training Progress */}
        <article className="border-hairline p-6 bg-[#0c0f16]/20 relative flex flex-col justify-between group overflow-hidden min-h-[160px]">
          <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold/30" />
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Training Progress</span>
            <span className="text-sm opacity-40 group-hover:opacity-100 transition-opacity">🎓</span>
          </div>
          <div className="space-y-2 mt-4">
            <div className="flex items-baseline gap-2">
              <span className={`font-serif text-5xl font-black text-white tracking-tighter ${loading ? "animate-pulse text-zinc-700" : ""}`}>
                {loading ? "—" : `${trainingPct.toFixed(0)}%`}
              </span>
            </div>
            <div className="w-full h-1 bg-zinc-900 overflow-hidden rounded">
              <div
                className="h-full bg-gradient-to-r from-gold to-flame transition-all duration-700"
                style={{ width: `${trainingPct}%` }}
              />
            </div>
            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">
              {loading ? "Loading..." : trainingPct === 0 ? "No materials completed yet" : `${trainingPct.toFixed(0)}% curriculum completed`}
            </p>
          </div>
        </article>

        {/* Pending Assignments */}
        <article className="border-hairline p-6 bg-[#0c0f16]/20 relative flex flex-col justify-between group overflow-hidden min-h-[160px]">
          <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold/30" />
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Awaiting Action</span>
            <span className="text-sm opacity-40 group-hover:opacity-100 transition-opacity">📋</span>
          </div>
          <div className="space-y-2 mt-4">
            <div className="flex items-baseline gap-2">
              <span className={`font-serif text-5xl font-black text-white tracking-tighter ${loading ? "animate-pulse text-zinc-700" : ""}`}>
                {loading ? "—" : pendingCount}
              </span>
              {!loading && pendingCount > 0 && (
                <span className="text-[10px] uppercase tracking-widest text-flame font-black animate-pulse">Pending</span>
              )}
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: Math.min(pendingCount, 5) }).map((_, i) => (
                <div key={i} className="flex-1 h-1 bg-flame/60 rounded" />
              ))}
              {pendingCount === 0 && <div className="flex-1 h-1 bg-zinc-800 rounded" />}
            </div>
            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">
              {loading ? "Loading..." : pendingCount === 0 ? "All assignments submitted" : "Assignments awaiting submission"}
            </p>
          </div>
        </article>

        {/* Mean Evaluation */}
        <article className="border-hairline p-6 bg-[#0c0f16]/20 relative flex flex-col justify-between group overflow-hidden min-h-[160px]">
          <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold/30" />
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Mean Evaluation</span>
            <span className="text-sm opacity-40 group-hover:opacity-100 transition-opacity">⭐</span>
          </div>
          <div className="space-y-2 mt-4">
            <div className="flex items-baseline gap-2">
              <span className={`font-serif text-5xl font-black tracking-tighter ${loading ? "animate-pulse text-zinc-700" : avgScore != null ? "text-white" : "text-slate-400"}`}>
                {loading ? "—" : avgScore != null ? avgScore.toFixed(1) : "—"}
              </span>
              {!loading && avgScore != null && (
                <span className="text-[10px] uppercase tracking-widest text-gold font-black">/ 100</span>
              )}
            </div>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`flex-1 h-1 rounded transition-all ${
                    avgScore != null && i < Math.round((avgScore / 100) * 5)
                      ? "bg-gold"
                      : "bg-zinc-900"
                  }`}
                />
              ))}
            </div>
            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">
              {loading ? "Loading..." : avgScore != null ? `Based on ${analytics?.evaluated_submissions ?? 0} evaluation${analytics?.evaluated_submissions !== 1 ? "s" : ""}` : "Requires first evaluated grade"}
            </p>
          </div>
        </article>
      </section>

      {/* ── CPD Stage Timeline ── */}
      <section className="border border-hairline p-8 bg-[#0c0f16]/10 relative flex flex-col gap-6">
        <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold/30" />
        <div className="flex items-center justify-between border-hairline-b pb-4">
          <div>
            <h2 className="font-serif text-lg font-bold text-white uppercase tracking-widest">My Learning Pathway</h2>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">District Certifications Sequence</p>
          </div>
          <span className={`text-[9px] tracking-widest uppercase bg-amber-950/10 text-gold border border-gold/30 px-3 py-1 font-bold ${loading ? "animate-pulse" : ""}`}>
            {loading ? "Loading..." : `Stage ${cpdStageIndex + 1} of ${CPD_STAGES.length}`}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-4">
          {CPD_STAGES.map((stage, idx) => {
            const isActive = stage === cpdStage;
            const isDone = idx < cpdStageIndex;
            return (
              <div
                key={stage}
                className={`p-4 border relative flex flex-col justify-between group min-h-[110px]
                  ${isActive ? "border-gold bg-[#140f0e] text-gold" : isDone ? "border-emerald-900/40 bg-emerald-950/10" : "border-hairline bg-[#0c0f16]/20 opacity-40"}
                `}
              >
                <div className="flex justify-between items-start">
                  <span className="font-serif text-[10px] tracking-widest uppercase font-bold text-slate-400">Step 0{idx + 1}</span>
                  {isActive && <span className="h-1.5 w-1.5 rounded-full bg-flame animate-pulse-ring" />}
                  {isDone && <span className="text-emerald-400 text-xs">✓</span>}
                </div>
                <span className="text-xs font-serif uppercase tracking-widest font-black text-white group-hover:text-gold transition-colors duration-300">
                  {stage}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-slate-400 leading-relaxed font-light">
          You are currently active in the{" "}
          <span className="text-gold font-bold">{loading ? "..." : cpdStage}</span> stage of your institution&apos;s professional curriculum.
          {analytics?.recommendations?.[0] && (
            <> Next action: <span className="text-slate-300">{analytics.recommendations[0]}</span></>
          )}
        </p>
      </section>

      {/* ── Assignments & Continue Learning ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Upcoming Assignments Feed */}
        <section className="lg:col-span-8 border-hairline p-8 bg-[#0c0f16]/20 relative flex flex-col gap-6">
          <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold/30" />
          <div className="flex items-center justify-between border-hairline-b pb-4">
            <h2 className="font-serif text-lg font-bold text-white uppercase tracking-widest">Upcoming Submissions</h2>
            <Link href="/teacher/assignments" className="text-[10px] tracking-widest uppercase font-bold text-gold hover:text-white transition-colors">
              View Dossier →
            </Link>
          </div>

          <div className="space-y-4">
            {loading ? (
              [0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border border-hairline bg-background/50 animate-pulse">
                  <div className="w-8 h-8 rounded border border-hairline bg-zinc-900 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-3/5 bg-zinc-800 rounded" />
                    <div className="h-2 w-2/5 bg-zinc-900 rounded" />
                  </div>
                  <div className="h-6 w-14 bg-zinc-800 rounded" />
                </div>
              ))
            ) : assignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
                <span className="text-3xl opacity-20">📋</span>
                <p className="text-xs text-slate-500">No active assignments yet. Check back soon.</p>
              </div>
            ) : (
              assignments.map((assignment) => {
                const days = daysUntil(assignment.due_date);
                return (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-4 border border-hairline bg-background/50 hover:bg-[#121620]/50 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded border border-hairline bg-background flex items-center justify-center shrink-0 text-sm">
                        📝
                      </div>
                      <div>
                        <p className="text-xs font-serif font-black text-white group-hover:text-gold transition-colors duration-300">
                          {assignment.title}
                        </p>
                        <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mt-0.5">
                          Max {assignment.max_score} pts
                        </p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 text-[8px] tracking-widest uppercase font-bold border ${urgencyStyles(days)}`}>
                      {urgencyLabel(days)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Continue Learning CTA */}
        <section className="lg:col-span-4 flex flex-col">
          <div className="flex-1 border border-hairline bg-[#0c0f16]/20 p-8 flex flex-col justify-between min-h-[220px] relative">
            <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold/30" />
            <div className="space-y-4">
              <span className="text-2xl">🚀</span>
              <h3 className="font-serif text-base font-bold uppercase tracking-widest text-white">Resume Curriculum</h3>
              <p className="text-[10px] text-slate-400 font-light leading-relaxed">
                Continue precisely where you left off. The training catalog has telemetry progress tracking active.
              </p>
            </div>
            <Link
              href="/teacher/training"
              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-gold hover:bg-[#ebd5b5] text-black text-xs tracking-widest uppercase font-black transition-all duration-300"
            >
              Open Catalogue
            </Link>
          </div>
        </section>
      </div>

      {/* ── Inspiration Quote ── */}
      <section className="border border-hairline p-8 bg-[#0c0f16]/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold/30" />
        <div className="absolute top-1/2 right-[10%] w-64 h-64 bg-amber-950/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="flex items-start gap-4 max-w-2xl relative z-10">
          <div className="text-2xl mt-0.5 shrink-0 opacity-40">💡</div>
          <div className="space-y-2">
            <p className="text-[8px] uppercase tracking-widest text-gold font-black">Educational Focus</p>
            <blockquote className="font-serif text-lg text-white font-medium italic leading-relaxed">
              &ldquo;{quote.quote}&rdquo;
            </blockquote>
            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">— {quote.author}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
