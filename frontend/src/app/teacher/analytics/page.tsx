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
    <div className="space-y-4">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-slate-600 font-bold">
        {STAGES.map((s, i) => (
          <div
            key={s}
            className={`flex flex-col items-center gap-1.5 ${
              i <= stageIdx ? "opacity-100" : "opacity-30"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 ${
                i < stageIdx
                  ? "bg-emerald-900/60 border-emerald-700 text-emerald-400"
                  : i === stageIdx
                  ? "bg-[#991b1b]/30 border-[#991b1b] text-[#dfc397] shadow-lg shadow-[#991b1b]/30"
                  : "bg-slate-900 border-slate-700 text-slate-600"
              }`}
            >
              {i < stageIdx ? "✓" : i === stageIdx ? "●" : "○"}
            </div>
            <span className={i === stageIdx ? "text-[#dfc397]" : ""}>{s}</span>
            <span className="text-[8px] opacity-60">≥{STAGE_THRESHOLDS[s]}</span>
          </div>
        ))}
      </div>

      {/* Progress bar within current stage */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-slate-600">
          <span>Progress within {stage}</span>
          <span>{Math.round(progress * 100)}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#991b1b] to-[#dfc397] transition-all duration-1000"
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
    return <p className="text-xs text-slate-600 py-8 text-center">Submit assignments to see your trend</p>;
  }

  const width = 500;
  const height = 100;
  const pad = 10;
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
    <div className="w-full overflow-hidden rounded-xl bg-slate-950/40 p-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dfc397" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#dfc397" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#trendGrad)" />
        <path d={pathD} fill="none" stroke="#dfc397" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={toX(i)}
            cy={toY(p.score)}
            r="3"
            fill="#dfc397"
            stroke="#070a10"
            strokeWidth="1.5"
          />
        ))}
      </svg>
      <div className="flex justify-between px-1 mt-1">
        <span className="text-[9px] text-slate-700">
          {points[0] && new Date(points[0].date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
        <span className="text-[9px] text-slate-700">
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
    return <p className="text-xs text-slate-600 py-4 text-center">No evaluations yet</p>;

  return (
    <div className="space-y-3">
      {data.map((c) => {
        const color =
          c.average >= 80 ? "#22c55e" : c.average >= 60 ? "#dfc397" : "#ef4444";
        return (
          <div key={c.criterion}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400 truncate max-w-[220px]">{c.criterion}</span>
              <span className="text-xs font-black ml-2" style={{ color }}>
                {c.average.toFixed(1)}
              </span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
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
        <div className="w-8 h-8 rounded-full border-2 border-t-[#dfc397] border-[#dfc397]/10 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  const scoreColor =
    (data.average_score ?? 0) >= 80
      ? "text-emerald-400"
      : (data.average_score ?? 0) >= 60
      ? "text-[#dfc397]"
      : "text-red-400";

  const trend =
    data.score_trend.length >= 2
      ? data.score_trend[data.score_trend.length - 1].score -
        data.score_trend[data.score_trend.length - 2].score
      : null;

  return (
    <div className="space-y-8 max-w-4xl">
      <header>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#f5f2eb]">My Progress</h1>
        <p className="text-slate-500 text-sm mt-1">
          Your professional development analytics and CPD certification pathway
        </p>
      </header>

      {/* ── Top KPI strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 col-span-2 sm:col-span-1">
          <p className="text-[10px] uppercase tracking-widest text-slate-600 font-bold mb-2">
            Average Score
          </p>
          <p className={`text-4xl font-black ${scoreColor}`}>
            {data.average_score !== null ? data.average_score.toFixed(1) : "—"}
          </p>
          {trend !== null && (
            <p
              className={`text-xs mt-1 font-semibold ${
                trend > 0 ? "text-emerald-400" : trend < 0 ? "text-red-400" : "text-slate-500"
              }`}
            >
              {trend > 0 ? "↑" : trend < 0 ? "↓" : "→"} {Math.abs(trend).toFixed(1)} vs last
            </p>
          )}
        </div>
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-slate-600 font-bold mb-2">
            Evaluated
          </p>
          <p className="text-4xl font-black text-emerald-400">{data.evaluated_submissions}</p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-slate-600 font-bold mb-2">
            Training
          </p>
          <p className="text-4xl font-black text-blue-400">{data.training_completion.toFixed(0)}%</p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-slate-600 font-bold mb-2">
            CPD Stage
          </p>
          <p className="text-2xl font-black text-[#dfc397]">{data.cpd_stage}</p>
        </div>
      </div>

      {/* ── CPD Pathway ── */}
      <section className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">
          CPD Certification Pathway
        </h2>
        <CPDPathway stage={data.cpd_stage} progress={data.cpd_stage_progress} />
      </section>

      {/* ── Score Trend ── */}
      <section className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
          Score Trend Over Time
        </h2>
        <ScoreTrend points={data.score_trend} />
      </section>

      {/* ── Criterion Breakdown ── */}
      <section className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
          Criterion Performance
        </h2>
        <p className="text-[10px] text-slate-700 mb-5">
          Sorted weakest first — focus areas for your next submission
        </p>
        <CriterionBreakdown data={data.criterion_breakdown} />
      </section>

      {/* ── AI Recommendations ── */}
      {data.recommendations.filter(Boolean).length > 0 && (
        <section className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
            Latest Recommendations
          </h2>
          <div className="space-y-3">
            {data.recommendations.filter(Boolean).map((r, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-[#991b1b]/20 border border-[#991b1b]/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[9px] font-black text-[#dfc397]">{i + 1}</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{r}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
