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
  if (daysLeft === null) return "text-slate-400 bg-obsidian border-hairline";
  if (daysLeft <= 0) return "text-red-400 bg-red-950/20 border-red-900/40";
  if (daysLeft <= 3) return "text-red-400 bg-red-950/20 border-red-900/40";
  if (daysLeft <= 7) return "text-amber-400 bg-amber-950/20 border-amber-900/40";
  return "text-emerald-400 bg-emerald-950/20 border-emerald-900/40";
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
    <div className="space-y-12 max-w-7xl">

      {/* ── Hero Greeting ── */}
      <section className="border-b hairline pb-8 space-y-3">
        <div className="inline-flex items-center gap-2 border hairline bg-obsidian rounded px-2.5 py-0.5 text-[9px] tracking-[0.22em] uppercase text-brass">
          <span className="h-1.5 w-1.5 rounded-full bg-brass animate-pulse" />
          Professional Development
        </div>
        <h1 className="font-cinzel text-4xl sm:text-5xl uppercase text-parchment tracking-widest leading-tight">
          Welcome back, <br />
          <span className="text-brass">Educator Portfolio</span>
        </h1>
        <p className="text-slate-400 font-jakarta text-xs font-light max-w-xl">
          Your professional training track is currently underway. Audit module progression, track watch hours, and submit rubric evaluations.
        </p>
      </section>

      {/* ── Stat Plates ── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Training Progress */}
        <article className="rounded-xl border hairline p-6 bg-obsidian relative flex flex-col justify-between group overflow-hidden min-h-[160px]">
          <div className="absolute inset-0 bg-gradient-to-br from-brass/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex items-center justify-between z-10">
            <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Training Progress</span>
            <span className="text-sm opacity-40 group-hover:opacity-100 transition-opacity">🎓</span>
          </div>
          <div className="space-y-2 mt-4 z-10">
            <div className="flex items-baseline gap-2">
              <span className={`font-cinzel text-5xl text-parchment ${loading ? "animate-pulse text-slate-700" : ""}`}>
                {loading ? "—" : `${trainingPct.toFixed(0)}%`}
              </span>
            </div>
            <div className="w-full h-1 bg-void overflow-hidden rounded border hairline">
              <div
                className="h-full bg-gradient-to-r from-burgundy to-brass transition-all duration-700"
                style={{ width: `${trainingPct}%` }}
              />
            </div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
              {loading ? "Loading..." : trainingPct === 0 ? "No materials completed yet" : `${trainingPct.toFixed(0)}% curriculum completed`}
            </p>
          </div>
        </article>

        {/* Pending Assignments */}
        <article className="rounded-xl border hairline p-6 bg-obsidian relative flex flex-col justify-between group overflow-hidden min-h-[160px]">
          <div className="absolute inset-0 bg-gradient-to-br from-crimson/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex items-center justify-between z-10">
            <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Awaiting Action</span>
            <span className="text-sm opacity-40 group-hover:opacity-100 transition-opacity">📋</span>
          </div>
          <div className="space-y-2 mt-4 z-10">
            <div className="flex items-baseline gap-2">
              <span className={`font-cinzel text-5xl text-parchment ${loading ? "animate-pulse text-slate-700" : ""}`}>
                {loading ? "—" : pendingCount}
              </span>
              {!loading && pendingCount > 0 && (
                <span className="text-[10px] uppercase tracking-[0.22em] text-crimson animate-pulse">Pending</span>
              )}
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: Math.min(pendingCount, 5) }).map((_, i) => (
                <div key={i} className="flex-1 h-1 bg-crimson/60 rounded" />
              ))}
              {pendingCount === 0 && <div className="flex-1 h-1 bg-slate-800 rounded" />}
            </div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
              {loading ? "Loading..." : pendingCount === 0 ? "All assignments submitted" : "Assignments awaiting submission"}
            </p>
          </div>
        </article>

        {/* Mean Evaluation */}
        <article className="rounded-xl border hairline p-6 bg-obsidian relative flex flex-col justify-between group overflow-hidden min-h-[160px]">
          <div className="absolute inset-0 bg-gradient-to-br from-brass/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex items-center justify-between z-10">
            <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Mean Evaluation</span>
            <span className="text-sm opacity-40 group-hover:opacity-100 transition-opacity">⭐</span>
          </div>
          <div className="space-y-2 mt-4 z-10">
            <div className="flex items-baseline gap-2">
              <span className={`font-cinzel text-5xl ${loading ? "animate-pulse text-slate-700" : avgScore != null ? "text-parchment" : "text-slate-500"}`}>
                {loading ? "—" : avgScore != null ? avgScore.toFixed(1) : "—"}
              </span>
              {!loading && avgScore != null && (
                <span className="text-[10px] uppercase tracking-[0.22em] text-brass">/ 100</span>
              )}
            </div>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`flex-1 h-1 rounded transition-all ${
                    avgScore != null && i < Math.round((avgScore / 100) * 5)
                      ? "bg-brass"
                      : "bg-void border hairline"
                  }`}
                />
              ))}
            </div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
              {loading ? "Loading..." : avgScore != null ? `Based on ${analytics?.evaluated_submissions ?? 0} evaluation${analytics?.evaluated_submissions !== 1 ? "s" : ""}` : "Requires first evaluated grade"}
            </p>
          </div>
        </article>
      </section>

      {/* ── CPD Stage Timeline ── */}
      <section className="rounded-xl border hairline p-8 bg-obsidian relative flex flex-col gap-6">
        <div className="flex items-center justify-between border-b hairline pb-4">
          <div>
            <h2 className="font-cinzel text-lg text-parchment tracking-wider uppercase">My Learning Pathway</h2>
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 mt-1">District Certifications Sequence</p>
          </div>
          <span className={`text-[10px] tracking-[0.22em] uppercase bg-void text-brass border hairline px-3 py-1 rounded-md ${loading ? "animate-pulse" : ""}`}>
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
                className={`p-4 rounded-xl border relative flex flex-col justify-between group min-h-[110px]
                  ${isActive ? "border-brass/50 bg-void text-brass shadow-[0_0_15px_rgba(197,163,103,0.1)]" : isDone ? "border-emerald-900/40 bg-emerald-950/10" : "hairline bg-void/50 opacity-40"}
                `}
              >
                <div className="flex justify-between items-start">
                  <span className="font-cinzel text-[10px] tracking-[0.22em] uppercase text-slate-500">Step 0{idx + 1}</span>
                  {isActive && <span className="h-1.5 w-1.5 rounded-full bg-crimson animate-pulse" />}
                  {isDone && <span className="text-emerald-400 text-xs">✓</span>}
                </div>
                <span className="text-xs font-cinzel tracking-wider uppercase text-parchment group-hover:text-brass transition-colors duration-300">
                  {stage}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-slate-400 leading-relaxed font-playfair italic">
          You are currently active in the{" "}
          <span className="text-brass not-italic font-semibold">{loading ? "..." : cpdStage}</span> stage of your institution&apos;s professional curriculum.
          {analytics?.recommendations?.[0] && (
            <> Next action: <span className="text-parchment not-italic">{analytics.recommendations[0]}</span></>
          )}
        </p>
      </section>

      {/* ── Assignments & Continue Learning ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Upcoming Assignments Feed */}
        <section className="lg:col-span-8 rounded-xl border hairline p-8 bg-obsidian relative flex flex-col gap-6">
          <div className="flex items-center justify-between border-b hairline pb-4">
            <h2 className="font-cinzel text-lg text-parchment tracking-wider uppercase">Upcoming Submissions</h2>
            <Link href="/teacher/assignments" className="text-[10px] tracking-[0.22em] uppercase text-brass hover:text-parchment transition-colors">
              View Dossier →
            </Link>
          </div>

          <div className="space-y-4">
            {loading ? (
              [0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border hairline bg-void animate-pulse">
                  <div className="w-8 h-8 rounded border hairline bg-obsidian shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-3/5 bg-obsidian rounded" />
                    <div className="h-2 w-2/5 bg-obsidian rounded" />
                  </div>
                  <div className="h-6 w-14 bg-obsidian rounded" />
                </div>
              ))
            ) : assignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-2 rounded-xl border hairline bg-void">
                <span className="text-3xl opacity-20">📋</span>
                <p className="text-xs text-slate-500">No active assignments yet. Check back soon.</p>
              </div>
            ) : (
               assignments.map((assignment) => {
                const days = daysUntil(assignment.due_date);
                return (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-4 rounded-xl border hairline bg-void hover:bg-obsidian/50 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded border hairline bg-obsidian flex items-center justify-center shrink-0 text-sm">
                        📝
                      </div>
                      <div>
                        <p className="text-sm font-playfair font-semibold text-parchment group-hover:text-brass transition-colors duration-300">
                          {assignment.title}
                        </p>
                        <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 mt-0.5">
                          Max {assignment.max_score} pts
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] tracking-[0.22em] uppercase border ${urgencyStyles(days)}`}>
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
          <div className="flex-1 rounded-xl border hairline bg-obsidian p-8 flex flex-col justify-between min-h-[220px] relative overflow-hidden">
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-burgundy/10 rounded-full blur-3xl pointer-events-none" />
            <div className="space-y-4 relative z-10">
              <span className="text-2xl opacity-80">🚀</span>
              <h3 className="font-cinzel text-base tracking-wider uppercase text-parchment">Resume Curriculum</h3>
              <p className="text-xs text-slate-400 font-playfair italic leading-relaxed">
                Continue precisely where you left off. The training catalog has telemetry progress tracking active.
              </p>
            </div>
            <Link
              href="/teacher/training"
              className="mt-6 relative z-10 inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-burgundy to-crimson border border-brass/30 px-4 py-3 text-parchment text-[10px] tracking-[0.22em] uppercase font-semibold transition-all hover:brightness-110"
            >
              Open Catalogue
            </Link>
          </div>
        </section>
      </div>

      {/* ── Inspiration Quote ── */}
      <section className="rounded-xl border hairline p-8 bg-obsidian relative overflow-hidden">
        <div className="absolute top-1/2 right-[10%] w-64 h-64 bg-brass/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="flex items-start gap-4 max-w-2xl relative z-10">
          <div className="text-2xl mt-0.5 shrink-0 opacity-40">💡</div>
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.22em] text-brass">Educational Focus</p>
            <blockquote className="font-playfair text-lg text-parchment italic leading-relaxed quote-paper border-l-4 border-gold pl-4 py-1">
              &ldquo;{quote.quote}&rdquo;
            </blockquote>
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">— {quote.author}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
