"use client";

import React, { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface RubricCriterion {
  id: string;
  label: string;
  weight: number;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  max_score: number;
  rubric_criteria: RubricCriterion[];
  created_at: string;
  status?: "active" | "draft" | "closed";
}

interface FormState {
  title: string;
  description: string;
  due_date: string;
  max_score: string;
  criteria: { label: string; weight: string }[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_CRITERIA = [
  { label: "Content Knowledge & Accuracy", weight: "40" },
  { label: "Pedagogical Approach", weight: "35" },
  { label: "Reflective Practice", weight: "25" },
];

const STATUS_BADGE: Record<
  NonNullable<Assignment["status"]>,
  { label: string; classes: string }
> = {
  active: {
    label: "Active",
    classes:
      "bg-emerald-950/60 text-emerald-400 border border-emerald-900/60",
  },
  draft: {
    label: "Draft",
    classes: "bg-amber-950/60 text-amber-400 border border-amber-900/60",
  },
  closed: {
    label: "Closed",
    classes: "bg-slate-800/60 text-slate-500 border border-slate-700/60",
  },
};

function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function daysUntil(iso: string): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
      {/* SVG placeholder illustration */}
      <div className="w-32 h-32 mb-6 rounded-3xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center">
        <svg
          viewBox="0 0 80 80"
          fill="none"
          className="w-16 h-16 opacity-40"
          aria-hidden="true"
        >
          <rect x="10" y="14" width="60" height="52" rx="6" fill="#6366f1" fillOpacity="0.15" stroke="#6366f1" strokeWidth="1.5" />
          <rect x="20" y="26" width="40" height="4" rx="2" fill="#6366f1" fillOpacity="0.5" />
          <rect x="20" y="36" width="28" height="4" rx="2" fill="#6366f1" fillOpacity="0.3" />
          <rect x="20" y="46" width="34" height="4" rx="2" fill="#6366f1" fillOpacity="0.3" />
          <circle cx="60" cy="58" r="12" fill="#6366f1" fillOpacity="0.2" stroke="#6366f1" strokeWidth="1.5" />
          <path d="M60 53v10M55 58h10" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-slate-200 mb-2">
        No assignments yet
      </h3>
      <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-6">
        Create your first rubric-graded assignment and let the AI evaluate
        teacher submissions automatically.
      </p>
      <button
        onClick={onNew}
        className="
          inline-flex items-center gap-2 px-5 py-2.5
          bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl
          shadow-lg shadow-indigo-500/20 transition-all duration-200 cursor-pointer
        "
      >
        <span className="text-base">📝</span>
        Create First Assignment
      </button>
    </div>
  );
}

function AssignmentCard({
  a,
  onDelete,
}: {
  a: Assignment;
  onDelete: (id: string) => void;
}) {
  const status = a.status ?? "active";
  const badge = STATUS_BADGE[status];
  const days = daysUntil(a.due_date);
  const urgent = days !== null && days <= 3 && days >= 0;
  const overdue = days !== null && days < 0;

  return (
    <article className="
      bg-slate-900/40 border border-slate-800 rounded-2xl p-6
      shadow-xl hover:-translate-y-1 hover:shadow-indigo-500/10
      transition-all duration-200 flex flex-col gap-4
    ">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-100 leading-snug truncate pr-2">
            {a.title}
          </h3>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {a.description || "No description provided."}
          </p>
        </div>
        <span
          className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${badge.classes}`}
        >
          {badge.label}
        </span>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-800/30 rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-widest text-slate-600 font-bold mb-1">
            Due Date
          </p>
          <p
            className={`text-sm font-bold ${
              overdue
                ? "text-red-400"
                : urgent
                ? "text-amber-400"
                : "text-slate-200"
            }`}
          >
            {formatDate(a.due_date)}
          </p>
          {days !== null && (
            <p className="text-[10px] text-slate-600 mt-0.5">
              {overdue
                ? `${Math.abs(days)}d overdue`
                : days === 0
                ? "Due today"
                : `${days}d remaining`}
            </p>
          )}
        </div>
        <div className="bg-slate-800/30 rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-widest text-slate-600 font-bold mb-1">
            Max Score
          </p>
          <p className="text-sm font-bold text-slate-200">{a.max_score} pts</p>
        </div>
      </div>

      {/* Rubric chips */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-slate-600 font-bold mb-2">
          Rubric · {a.rubric_criteria?.length ?? 0} criteria
        </p>
        <div className="flex flex-wrap gap-1.5">
          {(a.rubric_criteria ?? []).slice(0, 3).map((c) => (
            <span
              key={c.id}
              className="px-2 py-0.5 rounded-full bg-indigo-950/50 border border-indigo-800/40 text-indigo-300 text-[10px] font-semibold"
            >
              {c.label} · {c.weight}%
            </span>
          ))}
          {(a.rubric_criteria?.length ?? 0) > 3 && (
            <span className="px-2 py-0.5 rounded-full bg-slate-800/50 border border-slate-700/40 text-slate-500 text-[10px]">
              +{(a.rubric_criteria?.length ?? 0) - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
        <p className="text-[10px] text-slate-600">
          Created {formatDate(a.created_at)}
        </p>
        <button
          onClick={() => onDelete(a.id)}
          className="
            text-[10px] font-bold text-red-500/70 hover:text-red-400
            px-2 py-1 rounded-lg hover:bg-red-950/30
            transition-all duration-150 cursor-pointer
          "
        >
          Delete
        </button>
      </div>
    </article>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    due_date: "",
    max_score: "100",
    criteria: DEFAULT_CRITERIA.map((c) => ({ ...c })),
  });

  // ── Toast auto-dismiss ──
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Fetch assignments ──
  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/assignments");
      if (res.ok) {
        const data = await res.json();
        setAssignments(Array.isArray(data) ? data : data.assignments ?? []);
      }
    } catch {
      // leave empty on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // ── Form handlers ──
  function updateCriterion(idx: number, field: "label" | "weight", value: string) {
    setForm((f) => {
      const criteria = [...f.criteria];
      criteria[idx] = { ...criteria[idx], [field]: value };
      return { ...f, criteria };
    });
  }

  function addCriterion() {
    setForm((f) => ({
      ...f,
      criteria: [...f.criteria, { label: "", weight: "" }],
    }));
  }

  function removeCriterion(idx: number) {
    setForm((f) => ({
      ...f,
      criteria: f.criteria.filter((_, i) => i !== idx),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setToast({ type: "error", msg: "Assignment title is required." });
      return;
    }
    const totalWeight = form.criteria.reduce(
      (s, c) => s + (parseFloat(c.weight) || 0),
      0
    );
    if (Math.abs(totalWeight - 100) > 0.1) {
      setToast({ type: "error", msg: `Rubric weights must sum to 100% (currently ${totalWeight}%).` });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        due_date: form.due_date || null,
        max_score: parseFloat(form.max_score) || 100,
        rubric_criteria: form.criteria.map((c, i) => ({
          id: `crit_${i}`,
          label: c.label.trim(),
          weight: parseFloat(c.weight) || 0,
        })),
      };
      const res = await apiFetch("/api/assignments", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created: Assignment = await res.json();
        setAssignments((prev) => [created, ...prev]);
        setToast({ type: "success", msg: "Assignment created successfully!" });
        setShowForm(false);
        setForm({
          title: "",
          description: "",
          due_date: "",
          max_score: "100",
          criteria: DEFAULT_CRITERIA.map((c) => ({ ...c })),
        });
      } else {
        const err = await res.json().catch(() => ({}));
        setToast({ type: "error", msg: err?.detail ?? "Failed to create assignment." });
      }
    } catch {
      setToast({ type: "error", msg: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this assignment? This cannot be undone.")) return;
    try {
      const res = await apiFetch(`/api/assignments/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAssignments((prev) => prev.filter((a) => a.id !== id));
        setToast({ type: "success", msg: "Assignment deleted." });
      } else {
        setToast({ type: "error", msg: "Could not delete assignment." });
      }
    } catch {
      setToast({ type: "error", msg: "Network error." });
    }
  }

  const weightSum = form.criteria.reduce(
    (s, c) => s + (parseFloat(c.weight) || 0),
    0
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-10 max-w-7xl mx-auto">

      {/* ── Toast ── */}
      {toast && (
        <div
          role="alert"
          className={`
            fixed top-5 right-5 z-50 flex items-center gap-3
            px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold
            transition-all duration-300
            ${toast.type === "success"
              ? "bg-emerald-950/90 border-emerald-800/60 text-emerald-300"
              : "bg-red-950/90 border-red-800/60 text-red-300"
            }
          `}
        >
          <span>{toast.type === "success" ? "✅" : "⚠️"}</span>
          {toast.msg}
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-slate-400 hover:text-slate-200 cursor-pointer"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Page header ── */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100">
            Assignments
          </h1>
          <p className="text-slate-400 text-sm mt-1.5">
            Publish rubric-graded assignments and configure AI evaluation criteria for your teaching cohort.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="
            shrink-0 inline-flex items-center gap-2 px-5 py-2.5
            bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl
            shadow-lg shadow-indigo-500/20 transition-all duration-200 cursor-pointer
          "
        >
          <span>{showForm ? "✕" : "+"}</span>
          {showForm ? "Cancel" : "New Assignment"}
        </button>
      </header>

      {/* ── Create Form ── */}
      {showForm && (
        <section aria-label="Create assignment">
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/60 rounded-2xl p-6 md:p-8 shadow-2xl">
            <h2 className="text-lg font-extrabold text-slate-100 mb-6 flex items-center gap-2">
              <span>📝</span> New Assignment
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Row 1: Title */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inclusive Teaching Strategies — Module 2"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="
                    w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3
                    text-sm text-slate-100 placeholder-slate-600
                    focus:outline-none focus:border-indigo-500 transition-colors
                  "
                />
              </div>

              {/* Row 2: Description */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the assignment goals and expectations for teachers…"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="
                    w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3
                    text-sm text-slate-100 placeholder-slate-600 resize-none
                    focus:outline-none focus:border-indigo-500 transition-colors
                  "
                />
              </div>

              {/* Row 3: Due date + Max score */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                    className="
                      w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3
                      text-sm text-slate-100 placeholder-slate-600
                      focus:outline-none focus:border-indigo-500 transition-colors
                      [color-scheme:dark]
                    "
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Max Score (pts)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={form.max_score}
                    onChange={(e) => setForm((f) => ({ ...f, max_score: e.target.value }))}
                    className="
                      w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3
                      text-sm text-slate-100 placeholder-slate-600
                      focus:outline-none focus:border-indigo-500 transition-colors
                    "
                  />
                </div>
              </div>

              {/* Row 4: Rubric Criteria */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Rubric Criteria
                  </label>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        Math.abs(weightSum - 100) < 0.1
                          ? "bg-emerald-950/60 text-emerald-400 border border-emerald-900/60"
                          : "bg-amber-950/60 text-amber-400 border border-amber-900/60"
                      }`}
                    >
                      {weightSum.toFixed(0)}% / 100%
                    </span>
                    <button
                      type="button"
                      onClick={addCriterion}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer transition-colors"
                    >
                      + Add criterion
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {form.criteria.map((c, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 bg-slate-950/60 border border-slate-800/70 rounded-xl p-3"
                    >
                      <span className="shrink-0 w-6 h-6 rounded-lg bg-indigo-950/60 text-indigo-400 text-[10px] font-black flex items-center justify-center border border-indigo-800/40">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        placeholder="Criterion label…"
                        value={c.label}
                        onChange={(e) => updateCriterion(idx, "label", e.target.value)}
                        className="
                          flex-1 bg-transparent border-b border-slate-800 py-1
                          text-sm text-slate-200 placeholder-slate-600
                          focus:outline-none focus:border-indigo-500 transition-colors
                        "
                      />
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="0"
                          value={c.weight}
                          onChange={(e) => updateCriterion(idx, "weight", e.target.value)}
                          className="
                            w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1
                            text-sm text-center text-slate-200
                            focus:outline-none focus:border-indigo-500 transition-colors
                          "
                        />
                        <span className="text-xs text-slate-600">%</span>
                      </div>
                      {form.criteria.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCriterion(idx)}
                          className="shrink-0 text-slate-600 hover:text-red-400 transition-colors cursor-pointer text-sm"
                          aria-label="Remove criterion"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-600 mt-2">
                  Weights must add up to exactly 100%. AI evaluation will use these criteria.
                </p>
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/50">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="
                    inline-flex items-center gap-2 px-6 py-2.5
                    bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl
                    shadow-lg shadow-indigo-500/20 transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
                  "
                >
                  {submitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
                      </svg>
                      Creating…
                    </>
                  ) : (
                    "Publish Assignment"
                  )}
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* ── Assignment Grid ── */}
      <section aria-label="Assignment inventory">
        {/* Stats bar */}
        {!loading && assignments.length > 0 && (
          <div className="flex items-center gap-6 mb-5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-slate-500">
                {assignments.filter((a) => (a.status ?? "active") === "active").length} active
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs text-slate-500">
                {assignments.filter((a) => a.status === "draft").length} draft
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-600" />
              <span className="text-xs text-slate-500">
                {assignments.filter((a) => a.status === "closed").length} closed
              </span>
            </div>
            <div className="ml-auto text-xs text-slate-600">
              {assignments.length} total
            </div>
          </div>
        )}

        {loading ? (
          /* Skeleton */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-6 space-y-4 animate-pulse"
              >
                <div className="flex justify-between">
                  <div className="h-4 bg-slate-800 rounded w-3/5" />
                  <div className="h-4 bg-slate-800 rounded w-12" />
                </div>
                <div className="h-3 bg-slate-800/70 rounded w-4/5" />
                <div className="h-3 bg-slate-800/70 rounded w-2/3" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-14 bg-slate-800/50 rounded-xl" />
                  <div className="h-14 bg-slate-800/50 rounded-xl" />
                </div>
                <div className="flex gap-2">
                  <div className="h-5 bg-slate-800/50 rounded-full w-24" />
                  <div className="h-5 bg-slate-800/50 rounded-full w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl overflow-hidden">
            <EmptyState onNew={() => setShowForm(true)} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {assignments.map((a) => (
              <AssignmentCard key={a.id} a={a} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
