"use client";

import React, { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ScoreTrendPoint {
  date: string;
  score: number;
  assignment_id: string;
}

interface CriterionEntry {
  criterion: string;
  average: number;
  count: number;
}

interface PersonalAnalytics {
  teacher_id: string;
  total_submissions: number;
  evaluated_submissions: number;
  average_score: number | null;
  score_trend: ScoreTrendPoint[];
  cpd_stage: "Foundation" | "Practice" | "Advanced" | "Expert";
  cpd_stage_progress: number;
  criterion_breakdown: CriterionEntry[];
  training_completion: number;
  recommendations: string[];
  generated_at: string;
}

// ─── CPD Progression Visual ────────────────────────────────────────────────────

const STAGES = ["Foundation", "Practice", "Advanced", "Expert"] as const;
const STAGE_THRESHOLDS = { Foundation: 0, Practice: 70, Advanced: 80, Expert: 90 };

function CPDPathway({
  stage,
  progress,
}: {
  stage: string;
  progress: number;
}) {
  const stageIdx = STAGES.indexOf(stage as typeof STAGES[number]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-slate-500 font-bold relative">
        <div className="absolute top-4 left-0 w-full h-px bg-void border-t hairline -z-10" />
        {STAGES.map((s, i) => (
          <div
            key={s}
            className={`flex flex-col items-center gap-3 bg-obsidian px-2 ${
              i <= stageIdx ? "opacity-100" : "opacity-40"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-cinzel text-sm border hairline ${
                i < stageIdx
                  ? "bg-void text-brass border-brass/50"
                  : i === stageIdx
                  ? "bg-gradient-to-r from-burgundy to-crimson text-parchment border-brass shadow-[0_0_10px_rgba(197,163,103,0.3)]"
                  : "bg-void text-slate-600"
              }`}
            >
              {i < stageIdx ? "✓" : i === stageIdx ? "●" : "○"}
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className={i === stageIdx ? "text-brass font-bold" : ""}>{s}</span>
              <span className="text-[8px] tracking-widest opacity-60">≥{STAGE_THRESHOLDS[s]} PTS</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-void border hairline p-4 rounded-xl space-y-2">
        <div className="flex justify-between text-[10px] uppercase tracking-[0.22em] text-slate-400">
          <span>Stage Progress</span>
          <span className="text-brass font-bold">{Math.round(progress * 100)}%</span>
        </div>
        <div className="h-1.5 bg-obsidian rounded-full overflow-hidden border hairline">
          <div
            className="h-full rounded-full bg-gradient-to-r from-burgundy to-brass transition-all duration-1000"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Score Trend Sparkline ──────────────────────────────────────────────────────

function ScoreTrend({ points }: { points: ScoreTrendPoint[] }) {
  if (!points.length) {
    return <p className="text-xs font-jakarta text-slate-500 py-8 text-center italic">Submit assignments to generate trend telemetry.</p>;
  }

  const width = 500;
  const height = 120;
  const pad = 15;
  const min = Math.max(0, Math.min(...points.map((p) => p.score)) - 10);
  const max = Math.min(100, Math.max(...points.map((p) => p.score)) + 10);

  const toX = (i: number) => pad + (i / Math.max(1, points.length - 1)) * (width - pad * 2);
  const toY = (v: number) => height - pad - ((v - min) / Math.max(1, max - min)) * (height - pad * 2);

  const pathD =
    points
      .map((p, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(p.score)}`)
      .join(" ") || "";

  const areaD =
    pathD +
    ` L${toX(points.length - 1)},${height} L${toX(0)},${height} Z`;

  return (
    <div className="w-full overflow-hidden rounded-xl bg-void border hairline p-4 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-brass/5 to-transparent pointer-events-none" />
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full relative z-10" preserveAspectRatio="none">
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c5a367" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#991b1b" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#trendGrad)" />
        <path d={pathD} fill="none" stroke="#dfc397" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={toX(i)}
            cy={toY(p.score)}
            r="4"
            fill="#0c0f16"
            stroke="#dfc397"
            strokeWidth="2"
            className="transition-transform hover:scale-150 cursor-pointer"
          />
        ))}
      </svg>
      <div className="flex justify-between px-2 mt-3 font-jakarta text-[9px] uppercase tracking-widest text-slate-500">
        <span>
          {points[0] && new Date(points[0].date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
        <span>
          {points[points.length - 1] &&
            new Date(points[points.length - 1].date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
        </span>
      </div>
    </div>
  );
}

// ─── Criterion Radar-style List ────────────────────────────────────────────────

function CriterionBreakdown({ data }: { data: CriterionEntry[] }) {
  if (!data.length)
    return <p className="text-xs font-jakarta text-slate-500 py-6 text-center italic">No evaluation data available.</p>;

  return (
    <div className="space-y-4">
      {data.map((c) => {
        const color =
          c.average >= 80 ? "#c5a367" : c.average >= 60 ? "#dfc397" : "#991b1b";
        return (
          <div key={c.criterion} className="bg-void border hairline p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-playfair font-semibold text-parchment truncate pr-4">{c.criterion}</span>
              <span className="text-sm font-cinzel font-black" style={{ color }}>
                {c.average.toFixed(1)}
              </span>
            </div>
            <div className="h-1 bg-obsidian rounded-full overflow-hidden border hairline">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${c.average}%`, background: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function TeacherAnalyticsPage() {
  const [data, setData] = useState<PersonalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/analytics/teacher/me");
      if (!res.ok) {
        setError("Failed to load your analytics");
        return;
      }
      setData(await res.json());
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-t-brass border-brass/10 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-obsidian border hairline rounded-xl">
        <p className="text-crimson font-jakarta text-sm">{error}</p>
      </div>
    );
  }

  const scoreColor =
    (data.average_score ?? 0) >= 80
      ? "text-brass"
      : (data.average_score ?? 0) >= 60
      ? "text-parchment"
      : "text-crimson";

  const trend =
    data.score_trend.length >= 2
      ? data.score_trend[data.score_trend.length - 1].score -
        data.score_trend[data.score_trend.length - 2].score
      : null;

  return (
    <div className="space-y-8 max-w-5xl">
      <header className="border-b hairline pb-6">
        <h1 className="font-cinzel text-3xl uppercase tracking-widest text-parchment">My Progress</h1>
        <p className="font-jakarta text-slate-400 text-sm mt-2">
          Your professional development analytics and CPD certification pathway.
        </p>
      </header>

      {/* ── Top KPI strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-obsidian border hairline rounded-xl p-6 col-span-2 md:col-span-1 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-brass/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-bold mb-3 relative z-10">
            Average Score
          </p>
          <p className={`font-cinzel text-5xl tracking-tight ${scoreColor} relative z-10`}>
            {data.average_score !== null ? data.average_score.toFixed(1) : "—"}
          </p>
          {trend !== null && (
            <p
              className={`text-[10px] uppercase tracking-widest mt-2 font-semibold relative z-10 ${
                trend > 0 ? "text-emerald-400" : trend < 0 ? "text-crimson" : "text-slate-500"
              }`}
            >
              {trend > 0 ? "↑" : trend < 0 ? "↓" : "→"} {Math.abs(trend).toFixed(1)} PTS VS LAST
            </p>
          )}
        </div>
        <div className="bg-obsidian border hairline rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-brass/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-bold mb-3 relative z-10">
            Evaluated
          </p>
          <p className="font-cinzel text-5xl tracking-tight text-parchment relative z-10">{data.evaluated_submissions}</p>
        </div>
        <div className="bg-obsidian border hairline rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-brass/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-bold mb-3 relative z-10">
            Training
          </p>
          <p className="font-cinzel text-5xl tracking-tight text-parchment relative z-10">{data.training_completion.toFixed(0)}%</p>
        </div>
        <div className="bg-obsidian border hairline rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-brass/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-bold mb-3 relative z-10">
            CPD Stage
          </p>
          <p className="font-cinzel text-3xl tracking-wider text-brass mt-2 relative z-10">{data.cpd_stage}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* ── CPD Pathway ── */}
          <section className="bg-obsidian border hairline rounded-xl p-8">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.22em] mb-8 pl-2 border-l-2 border-brass">
              CPD Certification Pathway
            </h2>
            <CPDPathway stage={data.cpd_stage} progress={data.cpd_stage_progress} />
          </section>

          {/* ── Score Trend ── */}
          <section className="bg-obsidian border hairline rounded-xl p-8">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.22em] mb-6 pl-2 border-l-2 border-brass">
              Score Trend Over Time
            </h2>
            <ScoreTrend points={data.score_trend} />
          </section>
        </div>

        <div className="space-y-8">
          {/* ── Criterion Breakdown ── */}
          <section className="bg-obsidian border hairline rounded-xl p-8 h-full">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.22em] mb-2 pl-2 border-l-2 border-brass">
              Criterion Performance
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-6 pl-3">
              Sorted weakest first — focus areas
            </p>
            <CriterionBreakdown data={data.criterion_breakdown} />
          </section>
        </div>
      </div>

      {/* ── AI Recommendations ── */}
      {data.recommendations.filter(Boolean).length > 0 && (
        <section className="bg-obsidian border hairline rounded-xl p-8">
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.22em] mb-6 pl-2 border-l-2 border-brass">
            Strategic Recommendations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.recommendations.filter(Boolean).map((r, i) => (
              <div key={i} className="flex gap-4 p-5 bg-void border hairline rounded-xl">
                <div className="w-8 h-8 rounded-full bg-obsidian border hairline flex items-center justify-center shrink-0 mt-0.5">
                  <span className="font-cinzel text-sm font-bold text-brass">{i + 1}</span>
                </div>
                <p className="font-jakarta text-sm text-parchment leading-relaxed">{r}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
