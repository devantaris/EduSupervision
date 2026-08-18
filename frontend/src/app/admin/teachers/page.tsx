"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { apiFetch } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Teacher {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  status: "active" | "pending_verification" | "suspended";
  employee_id: string | null;
  invited_at?: string;
  created_at: string;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  active: {
    label: "Active",
    dot: "bg-emerald-400",
    badge: "bg-emerald-950/60 text-emerald-400 border border-emerald-900/60",
    avatarRing: "ring-emerald-500/30",
    avatarBg: "bg-emerald-950/60 text-emerald-300",
  },
  pending_verification: {
    label: "Pending Verification",
    dot: "bg-amber-400 animate-pulse",
    badge: "bg-amber-950/60 text-amber-400 border border-amber-900/60",
    avatarRing: "ring-amber-500/30",
    avatarBg: "bg-amber-950/60 text-amber-300",
  },
  suspended: {
    label: "Suspended",
    dot: "bg-red-400",
    badge: "bg-red-950/60 text-red-400 border border-red-900/60",
    avatarRing: "ring-red-500/30",
    avatarBg: "bg-red-950/60 text-red-300",
  },
} as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

function AvatarInitials({ teacher }: { teacher: Teacher }) {
  const cfg = STATUS_CONFIG[teacher.status];
  const initials = teacher.first_name
    ? teacher.first_name.charAt(0).toUpperCase()
    : teacher.email.charAt(0).toUpperCase();
  return (
    <div
      className={`w-10 h-10 rounded border hairline flex items-center justify-center font-cinzel text-sm font-bold shrink-0 ${cfg.avatarBg}`}
    >
      {initials}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteInput, setInviteInput] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [inviteStep, setInviteStep] = useState<1 | 2>(1);
  const [inviting, setInviting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Fetch roster ──
  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/v1/teachers");
      if (res.ok) {
        const data = await res.json();
        const raw: Teacher[] = (data.teachers ?? data ?? []).map((t: Record<string, unknown>) => ({
          id: t.id as string,
          email: t.email as string,
          first_name: (t.first_name as string) || "",
          last_name: (t.last_name as string) || "",
          status: (t.status as Teacher["status"]) || "pending_verification",
          employee_id: (t.employee_id as string | null) ?? null,
          created_at: (t.created_at as string) || new Date().toISOString(),
        }));
        setTeachers(raw);
      } else {
        setError("Failed to load teacher roster.");
      }
    } catch {
      setError("Network error. Could not reach the backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  // ── Invite handler ──
  const handleBulkInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteInput.trim()) return;

    const emails = inviteInput
      .split(/[\s,\n]+/)
      .map((email) => email.trim())
      .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

    if (emails.length === 0) {
      setInviteStatus("Error: No valid email addresses found.");
      return;
    }

    setInviting(true);
    setInviteStatus(null);
    try {
      const res = await apiFetch("/api/v1/teachers/invite", {
        method: "POST",
        body: JSON.stringify({ emails }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setInviteStep(2);
        setInviteStatus(`Success: ${data.detail ?? `Invitations dispatched to ${emails.length} educator${emails.length > 1 ? "s" : ""}.`}`);
        setInviteInput("");
        // Refetch roster so new pending entries appear
        await fetchTeachers();
        setTimeout(() => {
          setInviteStatus(null);
          setShowInviteModal(false);
          setInviteStep(1);
        }, 4000);
      } else {
        setInviteStatus(`Error: ${data.detail ?? "Failed to send invitations."}`);
      }
    } catch {
      setInviteStatus("Error: Network error. Please try again.");
    } finally {
      setInviting(false);
    }
  };

  const stats = useMemo(
    () => ({
      total: teachers.length,
      active: teachers.filter((t) => t.status === "active").length,
      pending: teachers.filter((t) => t.status === "pending_verification").length,
      suspended: teachers.filter((t) => t.status === "suspended").length,
    }),
    [teachers]
  );

  const filteredTeachers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return teachers;
    return teachers.filter(
      (t) =>
        t.email.toLowerCase().includes(q) ||
        t.first_name.toLowerCase().includes(q) ||
        t.last_name.toLowerCase().includes(q) ||
        (t.employee_id ?? "").toLowerCase().includes(q)
    );
  }, [teachers, searchQuery]);

  const closeModal = () => {
    setShowInviteModal(false);
    setInviteStatus(null);
    setInviteStep(1);
    setInviteInput("");
  };

  return (
    <div className="space-y-8 max-w-6xl">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 border-b hairline-w pb-6">
        <div>
          <h1 className="text-3xl font-cinzel font-bold text-parchment tracking-[0.1em] uppercase">Teacher Roster</h1>
          <p className="text-slate-400 text-sm mt-1.5 font-playfair italic">
            Bulk-invite educators, audit registration status, and coordinate account verification rules.
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-burgundy to-crimson border border-brass/30 text-parchment text-xs uppercase tracking-widest font-bold px-5 py-2.5 rounded-md shadow-lg shadow-red-900/20 transition-all duration-200 cursor-pointer shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Invite Educators
        </button>
      </div>

      {/* Error Banner */}
      {error && !loading && (
        <div className="border border-red-900/40 bg-red-950/20 rounded px-5 py-3 flex items-center justify-between">
          <span className="text-xs text-red-400 font-bold">⚠ {error}</span>
          <button onClick={fetchTeachers} className="text-xs text-red-400 hover:text-red-300 font-bold underline cursor-pointer">Retry</button>
        </div>
      )}

      {/* Stat Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Enrolled", value: loading ? "—" : stats.total, color: "text-brass" },
          { label: "Active", value: loading ? "—" : stats.active, color: "text-emerald-400" },
          { label: "Pending", value: loading ? "—" : stats.pending, color: "text-amber-400" },
          { label: "Suspended", value: loading ? "—" : stats.suspended, color: "text-red-400" },
        ].map((s) => (
          <div key={s.label} className="bg-obsidian border hairline rounded-xl p-4 shadow-md">
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-600 font-bold mb-2">{s.label}</p>
            <p className={`text-3xl font-cinzel font-bold ${s.color} ${loading ? "animate-pulse" : ""}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/90 backdrop-blur-sm p-4 animate-slate-reveal">
          <div className="w-full max-w-lg bg-obsidian border hairline rounded-xl shadow-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brass/5 via-transparent to-transparent pointer-events-none" />
            
            {/* Modal Header */}
            <div className="px-6 pt-6 pb-4 border-b hairline-w relative z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-cinzel font-bold text-parchment tracking-[0.1em] uppercase">Invite Educators</h2>
                  <p className="text-[10px] text-slate-500 mt-1 font-playfair italic">Send 72-hour activation links to new teaching staff</p>
                </div>
                <button
                  onClick={closeModal}
                  className="w-8 h-8 flex items-center justify-center rounded border hairline text-slate-400 hover:text-brass transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Step Indicator */}
              <div className="flex items-center gap-2 mt-4 relative z-10">
                {[{ n: 1, label: "Enter Emails" }, { n: 2, label: "Confirmed" }].map((step, i) => (
                  <React.Fragment key={step.n}>
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold transition-all border hairline ${
                          inviteStep >= step.n ? "bg-brass text-void border-brass" : "bg-obsidian text-slate-500"
                        }`}
                      >
                        {inviteStep > step.n ? (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          step.n
                        )}
                      </div>
                      <span className={`text-[9px] uppercase tracking-widest font-semibold ${inviteStep >= step.n ? "text-brass" : "text-slate-600"}`}>
                        {step.label}
                      </span>
                    </div>
                    {i < 1 && <div className={`flex-1 h-px ${inviteStep > 1 ? "bg-brass" : "bg-void border-b hairline-w"}`} />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 relative z-10">
              {inviteStep === 2 && inviteStatus?.startsWith("Success") ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-950/60 border border-emerald-900/60 flex items-center justify-center mx-auto">
                    <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-parchment font-cinzel font-bold text-sm tracking-widest uppercase">{inviteStatus.replace("Success: ", "")}</p>
                    <p className="text-slate-500 text-xs mt-2 font-playfair italic">Teachers will receive activation links via email.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBulkInvite} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-[0.22em] font-bold text-slate-400">Email Addresses</label>
                    <p className="text-[10px] font-playfair italic text-slate-500 pb-1">Separated by commas, spaces, or newlines</p>
                    <textarea
                      rows={5}
                      value={inviteInput}
                      onChange={(e) => setInviteInput(e.target.value)}
                      placeholder={"teacher.one@school.edu\nteacher.two@school.edu, teacher.three@school.edu"}
                      className="field w-full bg-void border hairline rounded-md p-3 text-parchment placeholder:text-slate-700 text-xs focus:outline-none focus:border-brass/50 transition-colors resize-none font-mono"
                    />
                    <p className="text-[10px] text-brass uppercase font-bold tracking-widest pt-1">
                      {inviteInput.split(/[\s,\n]+/).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)).length} valid email(s) detected
                    </p>
                  </div>

                  {inviteStatus?.startsWith("Error") && (
                    <div className="p-3 rounded-lg text-xs font-medium bg-red-950/50 border border-red-900 text-red-400">
                      {inviteStatus}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t hairline-w mt-6">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 rounded-md border hairline text-xs text-brass hover:border-brass/50 transition-all cursor-pointer uppercase tracking-widest font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={inviting}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-gradient-to-r from-burgundy to-crimson border border-brass/30 text-parchment text-[10px] uppercase tracking-widest font-bold cursor-pointer transition-all shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {inviting ? (
                        <>
                          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
                          </svg>
                          Sending...
                        </>
                      ) : (
                        "Dispatch Invitations"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Roster Grid */}
      <div>
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] font-bold text-slate-400">Educators Registered</div>
            <div className="text-[10px] text-slate-600 mt-0.5 font-playfair italic">{filteredTeachers.length} of {teachers.length} shown</div>
          </div>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, ID..."
              className="field bg-void border hairline rounded-md pl-8 pr-4 py-2 text-parchment placeholder:text-slate-600 text-xs focus:outline-none focus:border-brass/50 transition-colors w-64"
            />
          </div>
        </div>

        <div>
          {loading ? (
            /* Skeleton grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-obsidian border hairline rounded-xl p-6 flex flex-col gap-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-void border hairline shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-24 bg-void border hairline rounded" />
                      <div className="h-2 w-32 bg-void border hairline rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-20 bg-void border hairline rounded-full mt-2" />
                </div>
              ))}
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="bg-obsidian border hairline rounded-xl flex flex-col items-center justify-center py-20 text-center px-6">
              <span className="text-4xl text-brass mb-4 opacity-50">👥</span>
              <p className="text-parchment font-cinzel font-bold text-lg tracking-[0.1em] uppercase">
                {searchQuery ? "No educators match your search" : "No educators enrolled yet"}
              </p>
              <p className="text-slate-500 text-xs mt-2 font-playfair italic">
                {searchQuery ? "Try adjusting your search terms." : "Click 'Invite Educators' to onboard your first teacher."}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="mt-6 px-5 py-2.5 rounded-md bg-gradient-to-r from-burgundy to-crimson border border-brass/30 text-parchment text-xs font-bold uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-red-900/20"
                >
                  Invite Educators
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTeachers.map((teacher) => {
                const cfg = STATUS_CONFIG[teacher.status];
                return (
                  <div key={teacher.id} className="bg-obsidian border hairline rounded-xl p-6 flex flex-col gap-4 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 relative group overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brass/5 via-transparent to-transparent pointer-events-none" />
                    
                    <div className="relative z-10 flex items-start gap-3">
                      <AvatarInitials teacher={teacher} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-parchment font-cinzel tracking-wider truncate">
                          {teacher.first_name || teacher.last_name
                            ? `${teacher.first_name} ${teacher.last_name}`.trim()
                            : <span className="text-slate-500 italic font-playfair font-normal text-xs">Awaiting registration</span>}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5 truncate">{teacher.email}</div>
                      </div>
                    </div>
                    
                    <div className="relative z-10 grid grid-cols-2 gap-3 pt-4 border-t hairline-w mt-2">
                      <div>
                        <div className="text-[9px] uppercase tracking-[0.22em] font-bold text-slate-600 mb-1">Employee ID</div>
                        <div className="font-mono text-[10px] text-brass">
                          {teacher.employee_id || <span className="text-slate-600">—</span>}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase tracking-[0.22em] font-bold text-slate-600 mb-1">Joined</div>
                        <div className="text-[10px] text-slate-400 font-playfair italic">
                          {new Date(teacher.created_at).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative z-10 mt-auto pt-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${cfg.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
