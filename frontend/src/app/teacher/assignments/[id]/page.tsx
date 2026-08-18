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

function ScoreRing({ score, size = 180 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  let gradeLetter = "F";
  if (score >= 90) gradeLetter = "A";
  else if (score >= 80) gradeLetter = "B";
  else if (score >= 70) gradeLetter = "C";
  else if (score >= 60) gradeLetter = "D";

  let badgeText = "Needs Improvement";
  if (score >= 90) badgeText = "Exceeds Standard";
  else if (score >= 80) badgeText = "Meets Standard";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#991b1b" />
              <stop offset="50%" stopColor="#c5a367" />
              <stop offset="100%" stopColor="#dfc397" />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className="stroke-void"
            strokeWidth={8}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#goldGrad)"
            strokeWidth={8}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="ring-fill transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center mt-2">
          <span className="font-cinzel text-6xl text-parchment leading-none">{score.toFixed(0)}</span>
          <span className="text-[12px] uppercase tracking-[0.22em] text-brass font-bold mt-1">Grade {gradeLetter}</span>
        </div>
      </div>
      <span className="rounded-full border hairline px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-brass bg-void">
        {badgeText}
      </span>
    </div>
  );
}

// ─── Status States ─────────────────────────────────────────────────────────────

function StatusPending() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-6 bg-obsidian border hairline rounded-xl">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-2 border-brass/30 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-t-brass border-brass/10 animate-spin" />
        </div>
        <div className="absolute inset-0 rounded-full bg-brass/5 animate-ping" />
      </div>
      <div className="text-center">
        <h2 className="font-cinzel text-xl font-bold text-parchment mb-2 tracking-wider">Awaiting Confirmation</h2>
        <p className="font-jakarta text-sm text-slate-500 max-w-xs leading-relaxed">
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
    <div className="flex flex-col items-center justify-center py-32 gap-8 bg-obsidian border hairline rounded-xl">
      <div className="relative">
        <div className="w-24 h-24 rounded-full border border-brass/20 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-2 border-t-brass border-burgundy/30 animate-spin" />
          <div className="absolute w-8 h-8 rounded-full bg-burgundy/20 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-brass animate-pulse" />
          </div>
        </div>
      </div>
      <div className="text-center">
        <h2 className="font-cinzel text-xl font-bold text-parchment mb-2 tracking-wider">AI Evaluation In Progress</h2>
        <p className="font-jakarta text-sm text-brass font-semibold mb-6">{stages[currentStage]}…</p>
        <div className="flex flex-col gap-2 w-72 text-left mx-auto">
          {stages.map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  i < currentStage
                    ? "bg-emerald-500"
                    : i === currentStage
                    ? "bg-brass animate-pulse"
                    : "bg-void border hairline"
                }`}
              />
              <span
                className={`text-xs uppercase tracking-widest ${
                  i < currentStage
                    ? "text-emerald-400"
                    : i === currentStage
                    ? "text-brass font-bold"
                    : "text-slate-600"
                }`}
              >
                {s}
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="font-jakarta text-xs text-slate-600">Typically completes within 30–90 seconds</p>
    </div>
  );
}

function StatusFailed() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-6 bg-obsidian border hairline rounded-xl">
      <div className="w-20 h-20 rounded-full bg-crimson/10 border border-crimson/30 flex items-center justify-center">
        <span className="text-3xl">⚠️</span>
      </div>
      <div className="text-center">
        <h2 className="font-cinzel text-xl font-bold text-crimson mb-2 tracking-wider">Evaluation Failed</h2>
        <p className="font-jakarta text-sm text-slate-500 max-w-sm leading-relaxed">
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
    high: "bg-crimson/10 text-crimson border-crimson/30",
    medium: "bg-brass/10 text-brass border-brass/30",
    low: "bg-emerald-950/50 text-emerald-400 border-emerald-900/40",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${map[priority] ?? map.medium}`}>
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
        <div className="w-8 h-8 rounded-full border-2 border-t-brass border-brass/10 animate-spin" />
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-crimson text-sm font-jakarta">{error || "Submission not found."}</p>
      </div>
    );
  }

  const { evaluation, status } = submission;
  const scoreJson = submission.score_json as any;
  const plagiarismScore = scoreJson?.plagiarism_score ?? 0;
  const hasPlagiarismFlag = scoreJson?.has_plagiarism_flag ?? (plagiarismScore > 15);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <header className="border-b hairline pb-6">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-500 mb-3 font-jakarta">
          <span>Submissions</span>
          <span>/</span>
          <span className="text-brass">{submission.id.slice(0, 8)}…</span>
        </div>
        <h1 className="font-cinzel text-3xl md:text-4xl uppercase tracking-widest text-parchment leading-tight">
          {submission.assignment_title}
        </h1>
        <p className="font-jakarta text-sm text-slate-500 mt-2">
          Submitted {new Date(submission.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </header>

      {status === "pending" && <StatusPending />}
      {status === "processing" && <StatusProcessing />}
      {status === "failed" && <StatusFailed />}

      {status === "evaluated" && evaluation && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Score Ring Card */}
            <section className="md:col-span-8 bg-obsidian border hairline rounded-xl p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brass/5 to-transparent pointer-events-none" />
              <div className="flex flex-col md:flex-row items-center md:items-start gap-10 relative z-10">
                <ScoreRing score={evaluation.overall_score} size={180} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="px-3 py-1 rounded-full bg-void border hairline text-emerald-400 text-[10px] font-black uppercase tracking-[0.22em]">
                      ✓ Evaluated
                    </span>
                  </div>
                  <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.22em] mb-3">
                    AI Feedback
                  </h2>
                  <p className="font-playfair text-base text-parchment leading-relaxed">{evaluation.feedback}</p>
                  <p className="text-[10px] uppercase tracking-widest text-slate-600 mt-5 font-jakarta">
                    Evaluated {new Date(evaluation.evaluated_at).toLocaleString()} ·{" "}
                    {evaluation.tokens_used.toLocaleString()} tokens used
                  </p>
                </div>
              </div>
            </section>

            {/* Plagiarism Index Card */}
            <section className="md:col-span-4 bg-obsidian border hairline rounded-xl p-8 flex flex-col justify-center items-center text-center relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1 ${hasPlagiarismFlag ? "bg-crimson" : "bg-emerald-500"}`} />
              <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.22em] mb-4">
                Similarity Index
              </h2>
              <div className="font-cinzel text-5xl text-parchment mb-2">
                {plagiarismScore}%
              </div>
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border hairline ${hasPlagiarismFlag ? "bg-crimson/10 text-crimson" : "bg-void text-emerald-400"}`}>
                {hasPlagiarismFlag ? "Flagged for Review" : "Clean"}
              </span>
              <div className="w-full mt-6 space-y-2">
                <div className="flex justify-between text-[8px] uppercase tracking-widest text-slate-500">
                  <span>0%</span>
                  <span>15%</span>
                  <span>100%</span>
                </div>
                <div className="h-1.5 bg-void rounded-full overflow-hidden border hairline relative">
                  <div className="absolute left-[15%] top-0 bottom-0 w-px bg-slate-600 z-10" />
                  <div 
                    className={`h-full rounded-full ${hasPlagiarismFlag ? "bg-crimson" : "bg-emerald-500"}`}
                    style={{ width: `${plagiarismScore}%` }}
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Criterion Breakdown */}
          <section>
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.22em] mb-6 pl-2 border-l-2 border-brass">
              Criterion Breakdown · {evaluation.scores.length} criteria
            </h2>
            <div className="space-y-6">
              {evaluation.scores.map((s, i) => (
                <article
                  key={i}
                  className="bg-obsidian border hairline rounded-xl p-6 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-burgundy to-brass opacity-50" />
                  <div className="pl-4">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="shrink-0 text-[10px] uppercase tracking-widest text-brass font-bold">
                          Crit {i + 1}
                        </span>
                        <h3 className="text-lg font-playfair font-semibold text-parchment truncate">{s.criterion}</h3>
                      </div>
                      <div className="flex items-baseline gap-1 shrink-0">
                        <span className="font-cinzel text-3xl font-black text-brass">{s.score_assigned}</span>
                        <span className="text-[10px] uppercase tracking-widest text-slate-600">/ 100</span>
                      </div>
                    </div>

                    <div className="h-1 bg-void rounded-full overflow-hidden border hairline mb-5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-burgundy to-brass"
                        style={{ width: `${s.score_assigned}%` }}
                      />
                    </div>

                    <p className="font-jakarta text-sm text-slate-300 leading-relaxed mb-4">{s.justification}</p>

                    {s.evidence_quote && (
                      <div className="quote-paper bg-void border hairline border-l-4 border-l-gold p-4 rounded-r-lg">
                        <p className="font-playfair text-sm text-brass italic leading-relaxed">
                          &ldquo;{s.evidence_quote}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Recommendations */}
          {evaluation.recommendations.length > 0 && (
            <section>
              <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.22em] mb-6 pl-2 border-l-2 border-brass">
                Professional Development Recommendations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {evaluation.recommendations.map((r, i) => (
                  <div
                    key={i}
                    className="bg-obsidian border hairline rounded-xl p-6 space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-cinzel font-bold tracking-wider text-brass uppercase">{r.area}</span>
                        <PriorityBadge priority={r.priority} />
                      </div>
                      <p className="font-jakarta text-sm text-parchment leading-relaxed">{r.action}</p>
                    </div>
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
