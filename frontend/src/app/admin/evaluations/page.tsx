"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Submission {
  id: string;
  assignment_id: string;
  teacher_id: string;
  status: "pending" | "processing" | "evaluated" | "failed";
  s3_key: string;
  file_mime: string;
  score_json: {
    overall_score?: number;
    has_plagiarism_flag?: boolean;
  } | null;
  created_at: string;
  updated_at: string;
}

interface SubmissionListResponse {
  submissions: Submission[];
  total: number;
}

// ─── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; classes: string; dot: string }> = {
    evaluated: {
      label: "Evaluated",
      classes: "bg-emerald-950/60 text-emerald-400 border-emerald-900/40",
      dot: "bg-emerald-500",
    },
    processing: {
      label: "Processing",
      classes: "bg-blue-950/60 text-blue-400 border-blue-900/40",
      dot: "bg-blue-400 animate-pulse",
    },
    pending: {
      label: "Pending",
      classes: "bg-amber-950/60 text-amber-400 border-amber-900/40",
      dot: "bg-amber-400",
    },
    failed: {
      label: "Failed",
      classes: "bg-red-950/60 text-red-400 border-red-900/40",
      dot: "bg-red-400",
    },
  };
  const b = map[status] ?? map.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${b.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${b.dot}`} />
      {b.label}
    </span>
  );
}

// ─── Score Meter ───────────────────────────────────────────────────────────────

function ScoreMeter({ score }: { score: number }) {
  const color =
    score >= 80 ? "#22c55e" : score >= 60 ? "#dfc397" : score >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="text-sm font-black" style={{ color }}>
        {score.toFixed(0)}
      </span>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminEvaluationsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const LIMIT = 15;

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      const res = await apiFetch(`/api/submissions?${params.toString()}`);
      if (res.ok) {
        const data: SubmissionListResponse = await res.json();
        setSubmissions(data.submissions ?? []);
        setTotal(data.total ?? 0);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const filtered =
    statusFilter === "all" ? submissions : submissions.filter((s) => s.status === statusFilter);

  const statusCounts = {
    evaluated: submissions.filter((s) => s.status === "evaluated").length,
    processing: submissions.filter((s) => s.status === "processing").length,
    pending: submissions.filter((s) => s.status === "pending").length,
    failed: submissions.filter((s) => s.status === "failed").length,
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <header>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#f5f2eb]">Evaluations</h1>
        <p className="text-sm text-slate-500 mt-1.5">
          Monitor all teacher submission evaluations across your institution.
        </p>
      </header>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: total, color: "text-[#dfc397]" },
          { label: "Evaluated", value: statusCounts.evaluated, color: "text-emerald-400" },
          { label: "Processing", value: statusCounts.processing, color: "text-blue-400" },
          { label: "Failed", value: statusCounts.failed, color: "text-red-400" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4"
          >
            <p className="text-[10px] uppercase tracking-widest text-slate-600 font-bold mb-2">
              {stat.label}
            </p>
            <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {["all", "evaluated", "processing", "pending", "failed"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer
              ${
                statusFilter === s
                  ? "bg-[#991b1b] text-[#f5f2eb] border border-[#991b1b]/60"
                  : "bg-slate-900/50 text-slate-500 border border-slate-800 hover:border-slate-700 hover:text-slate-300"
              }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <section className="bg-slate-900/40 border border-slate-800/60 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-4 bg-slate-800 rounded flex-1" />
                <div className="h-4 bg-slate-800 rounded w-24" />
                <div className="h-4 bg-slate-800 rounded w-32" />
                <div className="h-4 bg-slate-800 rounded w-20" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <span className="text-4xl opacity-20">📋</span>
            <p className="text-sm text-slate-600">No submissions yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800/60">
              <tr className="text-left">
                <th className="px-5 py-3 text-[10px] uppercase tracking-widest text-slate-600 font-bold">
                  Submission ID
                </th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-widest text-slate-600 font-bold">
                  Status
                </th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-widest text-slate-600 font-bold">
                  Score
                </th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-widest text-slate-600 font-bold">
                  Flags
                </th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-widest text-slate-600 font-bold">
                  Submitted
                </th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-widest text-slate-600 font-bold">
                  View
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filtered.map((sub) => (
                <tr
                  key={sub.id}
                  className="hover:bg-slate-800/20 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs text-slate-400">
                      {sub.id.slice(0, 8)}…
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={sub.status} />
                  </td>
                  <td className="px-5 py-3.5 w-44">
                    {sub.status === "evaluated" && sub.score_json?.overall_score != null ? (
                      <ScoreMeter score={sub.score_json.overall_score} />
                    ) : (
                      <span className="text-slate-700 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {sub.score_json?.has_plagiarism_flag ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-950/50 border border-amber-900/40 text-amber-400 text-[9px] font-black uppercase tracking-wider">
                        ⚠ Similarity
                      </span>
                    ) : (
                      <span className="text-slate-700 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">
                    {new Date(sub.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/admin/evaluations/${sub.id}`}
                      className="text-xs text-[#dfc397] hover:text-[#f5f2eb] font-bold transition-colors"
                    >
                      Review →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ── Pagination ── */}
      {total > LIMIT && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-600">
            Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-40 transition-all cursor-pointer"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * LIMIT >= total}
              className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-40 transition-all cursor-pointer"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
