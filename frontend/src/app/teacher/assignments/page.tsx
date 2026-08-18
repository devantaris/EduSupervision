"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface RubricCriterion {
  id: string;
  label: string;
  weight: number;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
  max_score: number;
  rubric_criteria: RubricCriterion[];
  status: "active" | "closed";
}

interface Submission {
  id: string;
  assignment_id: string;
  status: "pending" | "processing" | "evaluated" | "failed";
  score_json: { overall_score?: number } | null;
  created_at: string;
}

// ─── Status Config ─────────────────────────────────────────────────────────────

const SUBMISSION_STATUS: Record<string, { label: string; color: string; dot: string }> = {
  pending: { label: "Queued", color: "text-amber-400", dot: "bg-amber-400" },
  processing: { label: "AI Processing", color: "text-blue-400", dot: "bg-blue-400 animate-pulse" },
  evaluated: { label: "Evaluated", color: "text-emerald-400", dot: "bg-emerald-500" },
  failed: { label: "Failed", color: "text-red-400", dot: "bg-red-400" },
};

// ─── Upload + Submit Component ─────────────────────────────────────────────────

function SubmitArea({
  assignment,
  onSubmitted,
}: {
  assignment: Assignment;
  onSubmitted: (sub: Submission) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setError("");
    setUploading(true);
    setUploadProgress(0);

    try {
      const presignRes = await apiFetch("/api/submissions/presign", {
        method: "POST",
        body: JSON.stringify({
          filename: file.name,
          content_type: file.type || "application/octet-stream",
          assignment_id: assignment.id,
        }),
      });
      if (!presignRes.ok) {
        const err = await presignRes.json().catch(() => ({}));
        throw new Error(err?.detail ?? "Failed to get upload URL");
      }
      const { upload_url, s3_key } = await presignRes.json();
      setUploadProgress(20);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", upload_url, true);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            const pct = Math.round((ev.loaded / ev.total) * 70);
            setUploadProgress(20 + pct);
          }
        };
        xhr.onload = () => (xhr.status < 400 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(file);
      });
      setUploadProgress(90);

      const confirmRes = await apiFetch("/api/submissions/confirm", {
        method: "POST",
        body: JSON.stringify({
          s3_key,
          file_mime: file.type || "application/octet-stream",
          assignment_id: assignment.id,
        }),
      });
      if (!confirmRes.ok) {
        const err = await confirmRes.json().catch(() => ({}));
        throw new Error(err?.detail ?? "Confirmation failed");
      }
      const submission: Submission = await confirmRes.json();
      setUploadProgress(100);
      onSubmitted(submission);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4 border-t hairline pt-5">
      <p className="text-[10px] text-slate-500 uppercase tracking-[0.22em]">Submit Your Work</p>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 flex items-center justify-center flex-col text-center gap-3 cursor-pointer transition-all duration-200 ${
          isDragging
            ? "border-brass bg-brass/5"
            : file
            ? "border-emerald-700 bg-emerald-950/10"
            : "border-slate-700 hover:border-brass/50 bg-void"
        }`}
      >
        {file ? (
          <>
            <div className="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-900/40 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-400 truncate max-w-xs">{file.name}</p>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB · click to change</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-lg bg-obsidian border hairline flex items-center justify-center shrink-0">
              <span className="text-xl">📄</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-parchment">Drop file here or click to browse</p>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">PDF, DOCX accepted · max 50 MB</p>
            </div>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
          className="hidden"
        />
      </div>

      {/* Upload progress bar */}
      {uploading && (
        <div className="h-1.5 bg-void border hairline rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-burgundy to-brass transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/40 rounded-lg p-3">{error}</p>
      )}

      <button
        type="submit"
        disabled={!file || uploading}
        className={`w-full py-3 rounded-md text-[10px] uppercase tracking-[0.22em] font-semibold transition-all duration-200 ${
          !file || uploading
            ? "bg-obsidian border hairline text-slate-600 cursor-not-allowed"
            : "bg-gradient-to-r from-burgundy to-crimson border border-brass/30 text-parchment shadow-[0_0_15px_rgba(153,27,27,0.4)] cursor-pointer hover:brightness-110"
        }`}
      >
        {uploading ? `UPLOADING… ${uploadProgress}%` : "SUBMIT FOR AI EVALUATION"}
      </button>
    </form>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [mySubmissions, setMySubmissions] = useState<Record<string, Submission>>({});
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [assignRes, subRes] = await Promise.all([
        apiFetch("/api/assignments"),
        apiFetch("/api/submissions"),
      ]);

      if (assignRes.ok) {
        const data = await assignRes.json();
        setAssignments(Array.isArray(data) ? data : data.assignments ?? []);
      }
      if (subRes.ok) {
        const data = await subRes.json();
        const subs: Submission[] = Array.isArray(data) ? data : data.submissions ?? [];
        const subMap: Record<string, Submission> = {};
        for (const s of subs) subMap[s.assignment_id] = s;
        setMySubmissions(subMap);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleSubmitted(submission: Submission) {
    setMySubmissions((prev) => ({ ...prev, [submission.assignment_id]: submission }));
    setExpandedId(null);
  }

  function formatDue(due: string | null) {
    if (!due) return "No due date";
    const d = new Date(due);
    const now = Date.now();
    const diff = d.getTime() - now;
    const days = Math.ceil(diff / 86400000);
    if (days < 0) return `${Math.abs(days)}d overdue`;
    if (days === 0) return "Due today";
    return `Due in ${days} day${days !== 1 ? "s" : ""}`;
  }

  const stats = {
    total: assignments.length,
    pending: assignments.filter((a) => !mySubmissions[a.id]).length,
    submitted: Object.keys(mySubmissions).length,
    evaluated: Object.values(mySubmissions).filter((s) => s.status === "evaluated").length,
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <header className="border-b hairline pb-6">
        <h1 className="font-cinzel text-3xl uppercase tracking-widest text-parchment">My Submissions</h1>
        <p className="font-jakarta text-slate-400 text-sm mt-2">
          Submit your work and view detailed AI evaluations across all rubric criteria.
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-brass" },
          { label: "Pending", value: stats.pending, color: "text-amber-400" },
          { label: "Submitted", value: stats.submitted, color: "text-blue-400" },
          { label: "Evaluated", value: stats.evaluated, color: "text-emerald-400" },
        ].map((s) => (
          <div key={s.label} className="bg-obsidian border hairline rounded-xl p-5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-brass/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className={`font-cinzel text-3xl ${s.color}`}>{s.value}</p>
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 mt-2 relative z-10">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-obsidian border hairline rounded-xl p-6 animate-pulse space-y-4">
              <div className="h-5 bg-void border hairline rounded w-3/5" />
              <div className="h-4 bg-void border hairline rounded w-full" />
              <div className="h-4 bg-void border hairline rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-obsidian border hairline rounded-xl">
          <span className="text-4xl opacity-20 mb-4">📋</span>
          <p className="text-parchment font-semibold text-sm">No assignments yet</p>
          <p className="text-slate-500 text-xs mt-1">Your administrator will assign tasks soon.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((a) => {
            const mySub = mySubmissions[a.id];
            const hasSubmitted = !!mySub;
            const isEvaluated = mySub?.status === "evaluated";
            const isExpanded = expandedId === a.id;
            const canSubmit = !hasSubmitted && a.status === "active";
            const dueColor =
              a.due_date && new Date(a.due_date).getTime() < Date.now()
                ? "text-red-400"
                : a.due_date &&
                  new Date(a.due_date).getTime() - Date.now() < 3 * 86400000
                ? "text-amber-400"
                : "text-slate-500";

            return (
              <article
                key={a.id}
                className="bg-obsidian border hairline rounded-xl overflow-hidden hover:border-brass/30 transition-all duration-300 shadow-lg"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-playfair font-semibold text-parchment leading-snug">{a.title}</h3>
                      <p className="text-sm font-jakarta text-slate-400 mt-2 leading-relaxed">{a.description}</p>
                    </div>

                    {isEvaluated && mySub.score_json?.overall_score != null && (
                      <div className="shrink-0 text-right bg-void border hairline p-3 rounded-lg flex flex-col items-center min-w-[80px]">
                        <div className="font-cinzel text-3xl text-emerald-400 leading-none">
                          {mySub.score_json.overall_score.toFixed(0)}
                        </div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">/ 100 pts</div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-6 flex-wrap pt-4 border-t hairline border-dashed">
                    <span className={`text-[10px] uppercase tracking-widest font-semibold ${dueColor}`}>
                      🕒 {formatDue(a.due_date)}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-slate-500">
                      📑 {a.rubric_criteria.length} criteria
                    </span>

                    {/* Submission status badge */}
                    {mySub && (
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border hairline bg-void text-[9px] font-bold uppercase tracking-wider ${
                          SUBMISSION_STATUS[mySub.status]?.color ?? "text-slate-400"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            SUBMISSION_STATUS[mySub.status]?.dot ?? "bg-slate-400"
                          }`}
                        />
                        {SUBMISSION_STATUS[mySub.status]?.label ?? mySub.status}
                      </span>
                    )}

                    <div className="ml-auto flex items-center gap-3">
                      {isEvaluated && (
                        <Link
                          href={`/teacher/assignments/${mySub.id}`}
                          className="text-[10px] uppercase tracking-[0.22em] text-brass hover:text-parchment font-semibold transition-colors"
                        >
                          View Results →
                        </Link>
                      )}
                      {canSubmit && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : a.id)}
                          className={`text-[10px] uppercase tracking-[0.22em] font-semibold px-4 py-2 rounded-md transition-all cursor-pointer ${
                            isExpanded
                              ? "bg-void text-slate-300 border hairline hover:bg-obsidian"
                              : "bg-gradient-to-r from-burgundy to-crimson border border-brass/30 text-parchment shadow-[0_0_10px_rgba(153,27,27,0.3)] hover:brightness-110"
                          }`}
                        >
                          {isExpanded ? "CANCEL" : "SUBMIT WORK"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && canSubmit && (
                  <div className="px-6 pb-6 bg-obsidian">
                    <SubmitArea assignment={a} onSubmitted={handleSubmitted} />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
