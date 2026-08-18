"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import InstitutionSeal from "@/components/ui/InstitutionSeal";

interface TeacherAnalytics {
  teacher_id: string;
  total_submissions: number;
  evaluated_submissions: number;
  average_score: number | null;
  score_trend: Array<{ date: string; score: number; assignment_id: string }>;
  cpd_stage: string;
  cpd_stage_progress: number;
  criterion_breakdown: Array<{ criterion: string; average: number; count: number }>;
  training_completion: number;
  recommendations: string[];
}

export default function AdminTeacherAnalyticsPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<TeacherAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/v1/analytics/teacher/${params.id}`);
      if (!res.ok) {
        setError("Teacher performance records not found.");
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      setError("Failed to fetch teacher analytics.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-obsidian border hairline rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-obsidian border hairline rounded-xl" />
          ))}
        </div>
        <div className="h-72 bg-obsidian border hairline rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-6 bg-obsidian border hairline rounded-xl text-center">
        <InstitutionSeal initials="RJ" size={48} className="opacity-30" />
        <div>
          <h2 className="font-cinzel text-2xl font-bold text-parchment uppercase">Record Unavailable</h2>
          <p className="font-playfair text-sm text-slate-400 mt-2">{error || "Teacher profile has no submission history yet."}</p>
        </div>
        <Link
          href="/admin/analytics"
          className="px-5 py-2 rounded-md bg-void border hairline text-brass text-xs uppercase tracking-widest font-bold hover:text-gold"
        >
          ← Return to Analytics
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b hairline pb-6">
        <div>
          <Link
            href="/admin/analytics"
            className="inline-flex items-center gap-2 text-[10px] text-brass hover:text-gold uppercase tracking-widest font-bold mb-2 transition-colors"
          >
            ← Back to Institutional Analytics
          </Link>
          <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-parchment uppercase tracking-wide">
            Teacher CPD &amp; Performance Audit
          </h1>
          <p className="text-xs text-slate-400 font-playfair mt-1">
            Teacher ID: <span className="font-mono text-slate-300">{data.teacher_id}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gold/10 border border-gold/30 text-gold">
            CPD Stage: {data.cpd_stage}
          </span>
        </div>
      </div>

      {/* ── Key Metrics Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-obsidian border hairline rounded-xl p-5 space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Average Score</p>
          <p className="font-cinzel text-3xl font-bold text-gold">
            {data.average_score != null ? `${data.average_score}/100` : "—"}
          </p>
        </div>

        <div className="bg-obsidian border hairline rounded-xl p-5 space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Submissions Evaluated</p>
          <p className="font-cinzel text-3xl font-bold text-parchment">
            {data.evaluated_submissions} <span className="text-xs text-slate-500 font-normal">/ {data.total_submissions}</span>
          </p>
        </div>

        <div className="bg-obsidian border hairline rounded-xl p-5 space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">CPD Stage Progress</p>
          <p className="font-cinzel text-3xl font-bold text-emerald-400">
            {Math.round(data.cpd_stage_progress * 100)}%
          </p>
        </div>

        <div className="bg-obsidian border hairline rounded-xl p-5 space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Training Modules</p>
          <p className="font-cinzel text-3xl font-bold text-brass">
            {data.training_completion}%
          </p>
        </div>
      </div>

      {/* ── Criterion Breakdown & Growth Areas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Criterion Scores */}
        <div className="lg:col-span-7 bg-obsidian border hairline rounded-xl p-7 space-y-6 shadow-xl">
          <div className="border-b hairline pb-4">
            <h3 className="font-cinzel text-lg font-bold text-parchment uppercase">
              Competency Breakdown
            </h3>
            <p className="text-xs text-slate-400 font-playfair">
              Averaged performance across evaluated rubric criteria.
            </p>
          </div>

          <div className="space-y-4">
            {data.criterion_breakdown.length === 0 ? (
              <p className="text-xs text-slate-500 font-playfair italic">No criterion data recorded yet.</p>
            ) : (
              data.criterion_breakdown.map((c, idx) => (
                <div key={idx} className="bg-void border hairline p-4 rounded-lg space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-cinzel text-parchment font-bold uppercase">{c.criterion}</span>
                    <span className="text-gold font-bold">{c.average} pts avg</span>
                  </div>
                  <div className="w-full h-1.5 bg-obsidian rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-burgundy to-gold rounded-full"
                      style={{ width: `${Math.min(100, (c.average / 35) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Growth Recommendations */}
        <div className="lg:col-span-5 bg-obsidian border hairline rounded-xl p-7 space-y-6 shadow-xl">
          <div className="border-b hairline pb-4">
            <h3 className="font-cinzel text-lg font-bold text-parchment uppercase">
              Assigned CPD Directives
            </h3>
            <p className="text-xs text-slate-400 font-playfair">
              Targeted recommendations from latest AI evaluations.
            </p>
          </div>

          <div className="space-y-3">
            {data.recommendations.length === 0 ? (
              <p className="text-xs text-slate-500 font-playfair italic">No active intervention required.</p>
            ) : (
              data.recommendations.map((rec, idx) => (
                <div key={idx} className="bg-void border hairline p-3.5 rounded-lg flex items-start gap-2.5">
                  <span className="text-gold text-xs mt-0.5">✦</span>
                  <p className="text-xs text-slate-300 font-playfair leading-relaxed">{rec}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
