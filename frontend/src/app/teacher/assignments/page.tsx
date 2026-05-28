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
      // Step 1: Get presigned upload URL
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

      // Step 2: Upload file directly via XHR (for progress events)
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

      // Step 3: Confirm submission → triggers AI pipeline
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
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 border-t border-slate-800/60 pt-4">
      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Submit Your Work</p>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all duration-200 ${
          isDragging
            ? "border-[#991b1b] bg-[#991b1b]/10"
            : file
            ? "border-emerald-700 bg-emerald-950/10"
            : "border-slate-700 hover:border-[#991b1b]/50 bg-slate-950/30"
        }`}
      >
        {file ? (
          <>
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-400 truncate max-w-xs">{file.name}</p>
              <p className="text-[10px] text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB · click to change</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
              <span className="text-base">📄</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Drop file here or click to browse</p>
              <p className="text-[10px] text-slate-600">PDF, DOCX accepted · max 50 MB</p>
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
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[#dfc397] transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/40 rounded-lg p-2.5">{error}</p>
      )}

      <button
        type="submit"
        disabled={!file || uploading}
        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
          !file || uploading
            ? "bg-slate-800 text-slate-600 cursor-not-allowed"
            : "bg-[#991b1b] hover:bg-[#881337] text-[#f5f2eb] shadow-lg shadow-[#991b1b]/20 cursor-pointer"
        }`}
      >
        {uploading ? `Uploading… ${uploadProgress}%` : "Submit for AI Evaluation"}
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
        // Map by assignment_id for easy lookup
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
      <header>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#f5f2eb]">My Assignments</h1>
        <p className="text-slate-500 text-sm mt-1">
          Submit your work and view detailed AI evaluations across all rubric criteria.
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-[#dfc397]" },
          { label: "Pending", value: stats.pending, color: "text-amber-400" },
          { label: "Submitted", value: stats.submitted, color: "text-blue-400" },
          { label: "Evaluated", value: stats.evaluated, color: "text-emerald-400" },
        ].map((s) => (
          <div key={s.label} className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4">
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] uppercase tracking-widest text-slate-600 font-bold mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-5 animate-pulse space-y-3">
              <div className="h-4 bg-slate-800 rounded w-3/5" />
              <div className="h-3 bg-slate-800/70 rounded w-full" />
              <div className="h-3 bg-slate-800/70 rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/40 border border-slate-800/60 rounded-2xl">
          <span className="text-4xl opacity-20 mb-4">📋</span>
          <p className="text-slate-400 font-bold text-sm">No assignments yet</p>
          <p className="text-slate-600 text-xs mt-1">Your administrator will assign tasks soon.</p>
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
                className="bg-slate-900/40 border border-slate-800/60 rounded-2xl overflow-hidden hover:border-slate-700/60 transition-all duration-200"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-[#f5f2eb] leading-snug">{a.title}</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{a.description}</p>
                    </div>

                    {isEvaluated && mySub.score_json?.overall_score != null && (
                      <div className="shrink-0 text-right">
                        <div className="text-2xl font-black text-emerald-400">
                          {mySub.score_json.overall_score.toFixed(0)}
                        </div>
                        <div className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">/ 100 pts</div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-4 flex-wrap">
                    <span className={`text-[10px] font-bold ${dueColor}`}>{formatDue(a.due_date)}</span>
                    <span className="text-[10px] text-slate-600">{a.rubric_criteria.length} rubric criteria</span>

                    {/* Submission status badge */}
                    {mySub && (
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-bold ${
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

                    <div className="ml-auto flex items-center gap-2">
                      {isEvaluated && (
                        <Link
                          href={`/teacher/assignments/${mySub.id}`}
                          className="text-xs text-[#dfc397] hover:text-[#f5f2eb] font-bold transition-colors"
                        >
                          View Results →
                        </Link>
                      )}
                      {canSubmit && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : a.id)}
                          className={`text-xs font-bold px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                            isExpanded
                              ? "bg-slate-800 text-slate-300 border-slate-700"
                              : "bg-[#991b1b] hover:bg-[#881337] text-[#f5f2eb] border-transparent shadow-lg shadow-[#991b1b]/20"
                          }`}
                        >
                          {isExpanded ? "Cancel" : "Submit Work"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && canSubmit && (
                  <div className="px-5 pb-5">
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
