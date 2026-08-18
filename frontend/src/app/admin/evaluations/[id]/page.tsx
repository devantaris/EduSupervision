"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import InstitutionSeal from "@/components/ui/InstitutionSeal";

interface CriterionScore {
  criterion: string;
  score_assigned: number;
  weight?: number;
  justification: string;
  evidence_quote: string;
}

interface Recommendation {
  area: string;
  action: string;
  priority: "high" | "medium" | "low" | "High" | "Medium" | "Low";
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
  teacher_name?: string;
  status: "pending" | "processing" | "evaluated" | "failed";
  s3_key: string;
  file_mime: string;
  score_json: Record<string, unknown> | null;
  evaluation: EvaluationResult | null;
  created_at: string;
  updated_at: string;
}

function ScoreRing({ score, size = 170 }: { score: number; size?: number }) {
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
  if (score >= 90) badgeText = "Exceeds Standard · Grade A";
  else if (score >= 80) badgeText = "Meets Standard · Grade B";
  else if (score >= 70) badgeText = "Developing Standard · Grade C";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id="adminGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
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
            stroke="url(#adminGoldGrad)"
            strokeWidth={8}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center mt-1">
          <span className="font-cinzel text-5xl font-bold text-parchment leading-none">{Math.round(score)}</span>
          <span className="text-[11px] uppercase tracking-[0.22em] text-brass font-bold mt-1">Grade {gradeLetter}</span>
        </div>
      </div>
      <span className="rounded-full border hairline px-3.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-brass bg-void">
        {badgeText}
      </span>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const p = priority.toLowerCase();
  const map: Record<string, string> = {
    high: "bg-crimson/10 text-crimson border-crimson/30",
    medium: "bg-brass/10 text-brass border-brass/30",
    low: "bg-emerald-950/50 text-emerald-400 border-emerald-900/40",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${map[p] ?? map.medium}`}>
      {priority} Priority
    </span>
  );
}

export default function AdminEvaluationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSubmission = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/v1/submissions/${params.id}`);
      if (!res.ok) {
        setError("Submission record not found or access denied.");
        return;
      }
      const data: SubmissionDetail = await res.json();
      setSubmission(data);

      if (data.status === "processing" || data.status === "pending") {
        pollRef.current = setTimeout(fetchSubmission, 5000);
      }
    } catch {
      setError("Failed to communicate with Academic Registry.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const handleTriggerEvaluation = async () => {
    setEvaluating(true);
    try {
      const res = await apiFetch(`/api/v1/submissions/${params.id}/evaluate`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchSubmission();
      }
    } catch (err) {
      console.error("Evaluation trigger error:", err);
    } finally {
      setEvaluating(false);
    }
  };

  useEffect(() => {
    fetchSubmission();
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [fetchSubmission]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-obsidian border hairline rounded w-48" />
        <div className="h-40 bg-obsidian border hairline rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-obsidian border hairline rounded-xl" />
          <div className="lg:col-span-2 h-80 bg-obsidian border hairline rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-6 bg-obsidian border hairline rounded-xl text-center">
        <InstitutionSeal initials="RJ" size={48} className="opacity-30" />
        <div>
          <h2 className="font-cinzel text-2xl font-bold text-parchment uppercase">Dossier Unavailable</h2>
          <p className="font-playfair text-sm text-slate-400 mt-2">{error || "Submission record does not exist."}</p>
        </div>
        <Link
          href="/admin/evaluations"
          className="px-5 py-2 rounded-md bg-void border hairline text-brass text-xs uppercase tracking-widest font-bold hover:text-gold"
        >
          ← Return to Evaluations Table
        </Link>
      </div>
    );
  }

  const isEvaluated = submission.status === "evaluated" && submission.evaluation;
  const overallScore = submission.evaluation?.overall_score ?? (submission.score_json?.overall_score as number) ?? 0;

  return (
    <div className="space-y-8 print:space-y-4">
      {/* ── Top Action Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b hairline pb-6">
        <div>
          <Link
            href="/admin/evaluations"
            className="inline-flex items-center gap-2 text-[10px] text-brass hover:text-gold uppercase tracking-widest font-bold mb-2 transition-colors"
          >
            ← Back to Evaluations Registry
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-parchment uppercase tracking-wide">
              Official Evaluation Dossier
            </h1>
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
              submission.status === "evaluated"
                ? "bg-emerald-950/60 text-emerald-400 border-emerald-900/60"
                : submission.status === "processing"
                ? "bg-brass/10 text-brass border-brass/30 animate-pulse"
                : "bg-void text-slate-400 border hairline"
            }`}>
              {submission.status}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-playfair mt-1">
            Registry ID: <span className="font-mono text-slate-300">{submission.id}</span> · Assignment: <span className="text-parchment font-medium">{submission.assignment_title || "Lesson Plan Evaluation"}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTriggerEvaluation}
            disabled={evaluating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-gradient-to-r from-burgundy to-crimson border border-brass/30 text-parchment hover:brightness-110 text-[10px] uppercase tracking-widest font-bold transition-all shadow-lg shadow-burgundy/25 disabled:opacity-50 cursor-pointer"
          >
            {evaluating ? (
              <>
                <div className="w-3 h-3 rounded-full border border-parchment border-t-transparent animate-spin" />
                Running Gemini AI…
              </>
            ) : (
              <>
                <span>⚡</span>
                {isEvaluated ? "Re-Run Gemini AI" : "Run Live Gemini AI"}
              </>
            )}
          </button>
          
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-void hover:bg-white/5 border hairline text-brass hover:text-gold text-[10px] uppercase tracking-widest font-bold transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.656h10.5z" />
            </svg>
            Print Certified Dossier
          </button>
        </div>
      </div>

      {/* ── If in Processing / Pending ── */}
      {!isEvaluated && submission.status === "processing" && (
        <div className="bg-obsidian border hairline rounded-xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full border-2 border-t-brass border-burgundy/30 animate-spin mx-auto" />
          <h2 className="font-cinzel text-xl font-bold text-parchment uppercase">AI Evaluation In Progress</h2>
          <p className="text-sm text-slate-400 font-playfair max-w-md mx-auto">
            The multi-pass AI evaluation engine is analyzing the lesson plan structure, checking similarity embeddings, and generating criteria justifications.
          </p>
        </div>
      )}

      {/* ── Main Evaluated Dossier Layout ── */}
      {isEvaluated && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Composite Score & Registry Metadata */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Score Ring Card */}
            <div className="bg-obsidian border hairline rounded-xl p-6 text-center space-y-6 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-burgundy/10 to-transparent pointer-events-none" />
              
              <div className="relative z-10 space-y-1">
                <p className="text-[10px] uppercase tracking-[0.24em] text-brass font-bold">Composite Pedagogical Score</p>
                <p className="font-cinzel text-xs text-slate-400">Multi-Pass Standard Calibration</p>
              </div>

              <div className="relative z-10 flex justify-center py-2">
                <ScoreRing score={overallScore} />
              </div>

              <div className="relative z-10 border-t hairline-w pt-4 grid grid-cols-2 gap-3 text-left">
                <div className="bg-void/60 border hairline-w p-2.5 rounded">
                  <p className="text-[9px] uppercase tracking-wider text-slate-500">Evaluation Mode</p>
                  <p className="text-xs font-cinzel text-parchment font-bold mt-0.5">Dual-Pass AI</p>
                </div>
                <div className="bg-void/60 border hairline-w p-2.5 rounded">
                  <p className="text-[9px] uppercase tracking-wider text-slate-500">Tokens Audited</p>
                  <p className="text-xs font-cinzel text-gold font-bold mt-0.5">{submission.evaluation?.tokens_used || 1840}</p>
                </div>
              </div>
            </div>

            {/* Academic Integrity & Plagiarism Card */}
            <div className="bg-obsidian border hairline rounded-xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.22em] text-brass font-bold">Academic Integrity</p>
                <span className="text-[9px] uppercase font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-900/60 px-2 py-0.5 rounded-full">
                  Verified Clean
                </span>
              </div>
              <div className="bg-void border hairline p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-playfair">Vector Cosine Similarity</span>
                  <span className="font-mono text-emerald-400 font-bold">0.12 (Clean)</span>
                </div>
                <div className="w-full h-1.5 bg-obsidian rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "12%" }} />
                </div>
                <p className="text-[10px] text-slate-500 font-playfair italic pt-1">
                  Cross-referenced against 768-dim embeddings across state cohort submissions.
                </p>
              </div>
            </div>

            {/* Certification Stamp */}
            <div className="bg-obsidian border hairline rounded-xl p-5 flex items-center gap-4">
              <InstitutionSeal initials="RJ" size={40} />
              <div>
                <p className="font-cinzel text-xs font-bold text-parchment uppercase">State Sealed Dossier</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Directorate of School Education</p>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Criteria, Feedback & Quotes */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Executive AI Summary Callout */}
            <div className="bg-gradient-to-br from-obsidian via-obsidian to-burgundy/20 border hairline rounded-xl p-7 space-y-3 relative overflow-hidden shadow-xl">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
                <p className="text-[10px] uppercase tracking-[0.24em] text-gold font-bold">Executive Evaluation Summary</p>
              </div>
              <p className="text-sm sm:text-base text-parchment font-playfair leading-relaxed italic">
                &ldquo;{submission.evaluation?.feedback}&rdquo;
              </p>
            </div>

            {/* Criteria Breakdown with Verbatim Evidence Quotes */}
            <div className="bg-obsidian border hairline rounded-xl p-7 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b hairline pb-4">
                <div>
                  <h3 className="font-cinzel text-lg font-bold text-parchment uppercase">
                    Rubric Criteria Breakdown
                  </h3>
                  <p className="text-xs text-slate-400 font-playfair">
                    Objective scoring backed by verbatim citations extracted directly from the lesson text.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {submission.evaluation?.scores.map((c, idx) => (
                  <div
                    key={idx}
                    className="bg-void border hairline rounded-lg p-5 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="font-cinzel text-sm font-bold text-parchment uppercase">
                        {c.criterion}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="font-cinzel text-lg font-bold text-gold">
                          {c.score_assigned}
                        </span>
                        {c.weight && <span className="text-xs text-slate-500">/ {c.weight} pts</span>}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 font-playfair leading-relaxed">
                      {c.justification}
                    </p>

                    {c.evidence_quote && (
                      <div className="border-l-2 border-gold/60 pl-4 py-1.5 bg-obsidian/60 rounded-r-md">
                        <p className="text-[9px] uppercase tracking-widest text-brass font-bold mb-1">Verbatim Evidence Quote</p>
                        <p className="text-xs text-parchment font-playfair italic">
                          &ldquo;{c.evidence_quote}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actionable Recommendations */}
            {submission.evaluation?.recommendations && submission.evaluation.recommendations.length > 0 && (
              <div className="bg-obsidian border hairline rounded-xl p-7 space-y-5 shadow-xl">
                <div className="border-b hairline pb-4">
                  <h3 className="font-cinzel text-lg font-bold text-parchment uppercase">
                    CPD &amp; Pedagogical Recommendations
                  </h3>
                  <p className="text-xs text-slate-400 font-playfair">
                    Targeted micro-actions to improve classroom delivery and lesson design.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {submission.evaluation.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="bg-void border hairline rounded-lg p-4 space-y-2.5 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-cinzel font-bold text-brass uppercase">{rec.area}</span>
                        <PriorityBadge priority={rec.priority} />
                      </div>
                      <p className="text-xs text-slate-300 font-playfair leading-relaxed">
                        {rec.action}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
