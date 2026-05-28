"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CriterionScore {
  criterion: string;
  score_assigned: number;
  justification: string;
  evidence_quote: string;
}

interface Recommendation {
  area: string;
  action: string;
  priority: "high" | "medium" | "low";
}

interface EvaluationResult {
  id: string;
  submission_id: string;
  scores: CriterionScore[];
  overall_score: number;
  feedback: string;
  recommendations: Recommendation[];
  tokens_used: number;
  evaluated_at: string;
}

interface SubmissionDetail {
  id: string;
  assignment_id: string;
  assignment_title: string;
  teacher_id: string;
  status: "pending" | "processing" | "evaluated" | "failed";
  s3_key: string;
  file_mime: string;
  score_json: Record<string, unknown> | null;
  evaluation: EvaluationResult | null;
  created_at: string;
  updated_at: string;
}

// ─── Score Ring Component ──────────────────────────────────────────────────────

function ScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const color =
    score >= 80 ? "#22c55e" : score >= 60 ? "#dfc397" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={8}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-[#f5f2eb]">{score.toFixed(0)}</span>
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">/ 100</span>
      </div>
    </div>
  );
}

// ─── Status States ─────────────────────────────────────────────────────────────

function StatusPending() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-2 border-[#991b1b]/30 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-t-[#dfc397] border-[#dfc397]/10 animate-spin" />
        </div>
        <div className="absolute inset-0 rounded-full bg-[#991b1b]/5 animate-ping" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-[#f5f2eb] mb-2">Awaiting Upload Confirmation</h2>
        <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
          Your file has been received. The evaluation will begin once processing starts.
        </p>
      </div>
    </div>
  );
}

function StatusProcessing() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 800);
    return () => clearInterval(t);
  }, []);

  const stages = ["Extracting document text", "Generating semantic embedding", "Checking for plagiarism", "Running AI evaluation"];
  const currentStage = tick % stages.length;

  return (
    <div className="flex flex-col items-center justify-center py-32 gap-8">
      <div className="relative">
        <div className="w-24 h-24 rounded-full border border-[#dfc397]/20 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-2 border-t-[#dfc397] border-[#991b1b]/30 animate-spin" />
          <div className="absolute w-8 h-8 rounded-full bg-[#991b1b]/20 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-[#dfc397] animate-pulse" />
          </div>
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-[#f5f2eb] mb-2">AI Evaluation In Progress</h2>
        <p className="text-sm text-[#dfc397] font-semibold mb-6">{stages[currentStage]}…</p>
        <div className="flex flex-col gap-2 w-72">
          {stages.map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  i < currentStage
                    ? "bg-emerald-500"
                    : i === currentStage
                    ? "bg-[#dfc397] animate-pulse"
                    : "bg-slate-700"
                }`}
              />
              <span
                className={`text-xs ${
                  i < currentStage
                    ? "text-emerald-400"
                    : i === currentStage
                    ? "text-[#dfc397]"
                    : "text-slate-600"
                }`}
              >
                {s}
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-600">Typically completes within 30–90 seconds</p>
    </div>
  );
}

function StatusFailed() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-6">
      <div className="w-20 h-20 rounded-full bg-red-950/30 border border-red-900/40 flex items-center justify-center">
        <span className="text-3xl">⚠️</span>
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-red-400 mb-2">Evaluation Failed</h2>
        <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
          The AI pipeline could not process this submission. This may be due to an unreadable file,
          insufficient text content, or a temporary service issue. Please contact your administrator.
        </p>
      </div>
    </div>
  );
}

// ─── Priority Badge ────────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    high: "bg-red-950/50 text-red-400 border border-red-900/40",
    medium: "bg-amber-950/50 text-amber-400 border border-amber-900/40",
    low: "bg-emerald-950/50 text-emerald-400 border border-emerald-900/40",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${map[priority] ?? map.medium}`}>
      {priority}
    </span>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SubmissionResultPage() {
  const params = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSubmission = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/submissions/${params.id}`);
      if (!res.ok) {
        setError("Submission not found or access denied.");
        return;
      }
      const data: SubmissionDetail = await res.json();
      setSubmission(data);

      // If still processing, poll every 5s
      if (data.status === "processing" || data.status === "pending") {
        pollRef.current = setTimeout(fetchSubmission, 5000);
      }
    } catch {
      setError("Failed to load submission.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchSubmission();
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [fetchSubmission]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-t-[#dfc397] border-[#dfc397]/10 animate-spin" />
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-red-400 text-sm">{error || "Submission not found."}</p>
      </div>
    );
  }

  const { evaluation, status } = submission;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <header>
        <div className="flex items-center gap-2 text-xs text-slate-600 mb-3 font-mono">
          <span>Submissions</span>
          <span>/</span>
          <span className="text-[#dfc397]">{submission.id.slice(0, 8)}…</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#f5f2eb] leading-tight">
          {submission.assignment_title}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Submitted {new Date(submission.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </header>

      {/* Status-based rendering */}
      {status === "pending" && <StatusPending />}
      {status === "processing" && <StatusProcessing />}
      {status === "failed" && <StatusFailed />}

      {status === "evaluated" && evaluation && (
        <>
          {/* Score Hero */}
          <section className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-8 shadow-2xl">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="flex flex-col items-center gap-3">
                <ScoreRing score={evaluation.overall_score} size={160} />
                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                  Overall Score
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-900/40 text-emerald-400 text-xs font-black uppercase tracking-wider">
                    ✓ Evaluated
                  </span>
                  {(submission.score_json as Record<string, boolean> | null)?.has_plagiarism_flag && (
                    <span className="px-3 py-1 rounded-full bg-amber-950/60 border border-amber-900/40 text-amber-400 text-xs font-black uppercase tracking-wider">
                      ⚠ Similarity Flagged
                    </span>
                  )}
                </div>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">
                  AI Feedback
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">{evaluation.feedback}</p>
                <p className="text-[10px] text-slate-600 mt-4 font-mono">
                  Evaluated {new Date(evaluation.evaluated_at).toLocaleString()} ·{" "}
                  {evaluation.tokens_used.toLocaleString()} tokens used
                </p>
              </div>
            </div>
          </section>

          {/* Criterion Breakdown */}
          <section>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
              Criterion Breakdown · {evaluation.scores.length} criteria
            </h2>
            <div className="space-y-4">
              {evaluation.scores.map((s, i) => (
                <div
                  key={i}
                  className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-5 space-y-3"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="shrink-0 w-6 h-6 rounded-lg bg-[#991b1b]/20 border border-[#991b1b]/30 text-[#dfc397] text-[10px] font-black flex items-center justify-center">
                        {i + 1}
                      </span>
                      <h3 className="text-sm font-bold text-[#f5f2eb] truncate">{s.criterion}</h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-2xl font-black text-[#dfc397]">{s.score_assigned}</span>
                      <span className="text-xs text-slate-600">/100</span>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${s.score_assigned}%`,
                        background:
                          s.score_assigned >= 80
                            ? "#22c55e"
                            : s.score_assigned >= 60
                            ? "#dfc397"
                            : "#ef4444",
                      }}
                    />
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">{s.justification}</p>

                  {s.evidence_quote && (
                    <blockquote className="border-l-2 border-[#991b1b]/40 pl-3 mt-2">
                      <p className="text-xs text-slate-500 italic leading-relaxed">
                        &ldquo;{s.evidence_quote}&rdquo;
                      </p>
                    </blockquote>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Recommendations */}
          {evaluation.recommendations.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                Professional Development Recommendations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {evaluation.recommendations.map((r, i) => (
                  <div
                    key={i}
                    className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-5 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#dfc397]">{r.area}</span>
                      <PriorityBadge priority={r.priority} />
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{r.action}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
