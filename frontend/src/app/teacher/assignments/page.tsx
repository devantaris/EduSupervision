"use client";

import React, { useState, useRef } from "react";

type AssignmentStatus = "pending" | "submitted" | "graded" | "overdue";

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_at: string;
  status: AssignmentStatus;
  score?: number;
  max_score?: number;
  feedback?: string;
  submitted_at?: string;
}

const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: "a1",
    title: "Lesson Plan Design: Constructivist Approach",
    description:
      "Submit a detailed lesson plan applying constructivist pedagogy to a topic of your choice. Must include learning objectives, activities, and assessment criteria.",
    due_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: "pending",
  },
  {
    id: "a2",
    title: "Classroom Management Reflection Journal",
    description:
      "Write a 500-word reflective journal entry on a challenging classroom management situation you encountered and how you resolved it.",
    due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: "submitted",
    submitted_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "a3",
    title: "Differentiated Instruction Analysis",
    description:
      "Analyze a provided case study and propose strategies for differentiating instruction for diverse learners including ELL students and students with IEPs.",
    due_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: "graded",
    score: 88,
    max_score: 100,
    submitted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    feedback:
      "Excellent analysis of accommodation strategies. Consider expanding on technology-based differentiation tools in future submissions.",
  },
  {
    id: "a4",
    title: "Formative Assessment Design Portfolio",
    description:
      "Create a portfolio of 5 formative assessment strategies tailored to secondary school science curriculum.",
    due_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: "overdue",
  },
];

const STATUS_CONFIG: Record<AssignmentStatus, { label: string; badge: string; dot: string; cardBorder: string }> = {
  pending: {
    label: "Pending",
    badge: "bg-amber-950/60 text-amber-400 border border-amber-900/60",
    dot: "bg-amber-400 animate-pulse",
    cardBorder: "border-amber-900/30 hover:border-amber-800/50",
  },
  submitted: {
    label: "Submitted",
    badge: "bg-indigo-950/60 text-indigo-400 border border-indigo-900/60",
    dot: "bg-indigo-400",
    cardBorder: "border-indigo-900/30 hover:border-indigo-800/50",
  },
  graded: {
    label: "Graded",
    badge: "bg-emerald-950/60 text-emerald-400 border border-emerald-900/60",
    dot: "bg-emerald-400",
    cardBorder: "border-emerald-900/30 hover:border-emerald-800/50",
  },
  overdue: {
    label: "Overdue",
    badge: "bg-red-950/60 text-red-400 border border-red-900/60",
    dot: "bg-red-400",
    cardBorder: "border-red-900/30 hover:border-red-800/50",
  },
};

function getDueDateLabel(due_at: string, status: AssignmentStatus): { text: string; color: string } {
  if (status === "graded" || status === "submitted") {
    return { text: "", color: "" };
  }
  const diff = new Date(due_at).getTime() - Date.now();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (diff < 0) return { text: `${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} overdue`, color: "text-red-400" };
  if (hours < 24) return { text: `Due in ${hours}h`, color: "text-red-400" };
  if (days <= 2) return { text: `Due in ${days} day${days !== 1 ? "s" : ""}`, color: "text-amber-400" };
  return { text: `Due in ${days} days`, color: "text-slate-400" };
}

function SubmitArea({ assignment, onSubmit }: { assignment: Assignment; onSubmit: (id: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setSubmitting(true);
    // Simulate API call delay
    await new Promise((r) => setTimeout(r, 1200));
    onSubmit(assignment.id);
    setSubmitting(false);
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
            ? "border-indigo-500 bg-indigo-950/20"
            : file
            ? "border-emerald-700 bg-emerald-950/10"
            : "border-slate-700 hover:border-indigo-600 bg-slate-950/30 hover:bg-indigo-950/10"
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
              <p className="text-[10px] text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB — click to change</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Drop file here or click to browse</p>
              <p className="text-[10px] text-slate-600">PDF, DOCX, PPTX accepted</p>
            </div>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.ppt,.pptx"
          onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
          className="hidden"
        />
      </div>

      {/* Optional note */}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note for your supervisor (optional)..."
        rows={2}
        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 placeholder:text-slate-700 text-xs focus:outline-none focus:border-indigo-500 transition-colors resize-none"
      />

      <button
        type="submit"
        disabled={!file || submitting}
        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
          !file || submitting
            ? "bg-slate-800 text-slate-600 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 cursor-pointer"
        }`}
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Submitting...
          </span>
        ) : (
          "Submit Assignment"
        )}
      </button>
    </form>
  );
}

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>(MOCK_ASSIGNMENTS);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleSubmit = (id: string) => {
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: "submitted" as AssignmentStatus, submitted_at: new Date().toISOString() }
          : a
      )
    );
    setExpandedId(null);
  };

  const stats = {
    total: assignments.length,
    pending: assignments.filter((a) => a.status === "pending").length,
    submitted: assignments.filter((a) => a.status === "submitted").length,
    graded: assignments.filter((a) => a.status === "graded").length,
    overdue: assignments.filter((a) => a.status === "overdue").length,
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100">My Submissions</h1>
        <p className="text-slate-400 text-sm mt-1">
          Submit lesson plans and view detailed AI evaluations mapping rubric categories and development suggestions.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-slate-300", bg: "bg-slate-800/50 border-slate-700/50" },
          { label: "Pending", value: stats.pending, color: "text-amber-400", bg: "bg-amber-950/30 border-amber-900/40" },
          { label: "Submitted", value: stats.submitted, color: "text-indigo-400", bg: "bg-indigo-950/30 border-indigo-900/40" },
          { label: "Graded", value: stats.graded, color: "text-emerald-400", bg: "bg-emerald-950/30 border-emerald-900/40" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border p-4 shadow-lg ${s.bg}`}>
            <div className={`text-4xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Assignment Cards */}
      {assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </div>
          <p className="text-slate-300 font-bold text-sm">No assignments assigned yet</p>
          <p className="text-slate-600 text-xs mt-1">Your administrator will assign submissions tasks soon.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((a) => {
            const cfg = STATUS_CONFIG[a.status];
            const dueMeta = getDueDateLabel(a.due_at, a.status);
            const isExpanded = expandedId === a.id;
            const canSubmit = a.status === "pending" || a.status === "overdue";

            return (
              <article
                key={a.id}
                className={`bg-slate-900/40 border rounded-2xl shadow-lg overflow-hidden transition-all duration-200 hover:shadow-xl ${cfg.cardBorder}`}
              >
                {/* Card Header */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${cfg.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                        {dueMeta.text && (
                          <span className={`text-[10px] font-semibold ${dueMeta.color}`}>
                            · {dueMeta.text}
                          </span>
                        )}
                        {a.submitted_at && (
                          <span className="text-[10px] text-slate-600">
                            · Submitted {new Date(a.submitted_at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-200 leading-snug">{a.title}</h3>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">{a.description}</p>
                    </div>

                    {/* Score (if graded) */}
                    {a.status === "graded" && a.score !== undefined && (
                      <div className="shrink-0 text-right">
                        <div className="text-2xl font-black text-emerald-400">{a.score}</div>
                        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">/ {a.max_score ?? 100} pts</div>
                      </div>
                    )}
                  </div>

                  {/* Graded Feedback */}
                  {a.status === "graded" && a.feedback && (
                    <div className="mt-3 p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl">
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">AI Feedback</p>
                      <p className="text-xs text-slate-300 leading-relaxed">{a.feedback}</p>
                    </div>
                  )}

                  {/* Actions Row */}
                  <div className="flex items-center gap-3 mt-4">
                    <div className="text-[10px] text-slate-600">
                      Due {new Date(a.due_at).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                    </div>
                    {canSubmit && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : a.id)}
                        className={`ml-auto text-xs font-bold px-3.5 py-1.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                          isExpanded
                            ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                            : "bg-indigo-600 hover:bg-indigo-500 text-white border-transparent shadow-lg shadow-indigo-500/20"
                        }`}
                      >
                        {isExpanded ? "Cancel" : "Submit Work"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Submit Area */}
                {isExpanded && canSubmit && (
                  <div className="px-5 pb-5 border-t border-slate-800/60">
                    <SubmitArea assignment={a} onSubmit={handleSubmit} />
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
