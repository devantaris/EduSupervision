"use client";

import React, { useState, useEffect, useMemo } from "react";

interface Teacher {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  status: "active" | "pending_verification" | "suspended";
  employee_id: string;
  invited_at: string;
}

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

function AvatarInitials({ teacher }: { teacher: Teacher }) {
  const cfg = STATUS_CONFIG[teacher.status];
  const initials = teacher.first_name
    ? teacher.first_name.charAt(0).toUpperCase()
    : teacher.email.charAt(0).toUpperCase();
  return (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ring-2 shrink-0 ${cfg.avatarBg} ${cfg.avatarRing}`}
    >
      {initials}
    </div>
  );
}

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [inviteInput, setInviteInput] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [inviteStep, setInviteStep] = useState<1 | 2>(1);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const mockRoster: Teacher[] = [
      {
        id: "t1",
        email: "sarah.jenkins@oakridge.edu",
        first_name: "Sarah",
        last_name: "Jenkins",
        status: "active",
        employee_id: "EMP-2024-0012",
        invited_at: "2026-05-10T14:30:00Z",
      },
      {
        id: "t2",
        email: "robert.chen@oakridge.edu",
        first_name: "Robert",
        last_name: "Chen",
        status: "active",
        employee_id: "EMP-2024-0045",
        invited_at: "2026-05-12T09:15:00Z",
      },
      {
        id: "t3",
        email: "elizabeth.taylor@oakridge.edu",
        first_name: "",
        last_name: "",
        status: "pending_verification",
        employee_id: "",
        invited_at: "2026-05-28T16:00:00Z",
      },
    ];
    setTeachers(mockRoster);
  }, []);

  const handleBulkInvite = (e: React.FormEvent) => {
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

    const newInvites: Teacher[] = emails.map((email, idx) => ({
      id: `new-${Date.now()}-${idx}`,
      email,
      first_name: "",
      last_name: "",
      status: "pending_verification",
      employee_id: "",
      invited_at: new Date().toISOString(),
    }));

    setTeachers((prev) => [...prev, ...newInvites]);
    setInviteInput("");
    setInviteStatus(`Success: Invitation links dispatched to ${emails.length} educator${emails.length > 1 ? "s" : ""}.`);
    setInviteStep(2);

    setTimeout(() => {
      setInviteStatus(null);
      setShowInviteModal(false);
      setInviteStep(1);
    }, 4000);
  };

  const toggleStatus = (id: string) => {
    setTeachers((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextStatus = t.status === "active" ? "suspended" : "active";
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  const stats = useMemo(() => ({
    total: teachers.length,
    active: teachers.filter((t) => t.status === "active").length,
    pending: teachers.filter((t) => t.status === "pending_verification").length,
    suspended: teachers.filter((t) => t.status === "suspended").length,
  }), [teachers]);

  const filteredTeachers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return teachers;
    return teachers.filter(
      (t) =>
        t.email.toLowerCase().includes(q) ||
        t.first_name.toLowerCase().includes(q) ||
        t.last_name.toLowerCase().includes(q) ||
        t.employee_id.toLowerCase().includes(q)
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100">Teacher Roster</h1>
          <p className="text-slate-400 text-sm mt-1">
            Bulk-invite educators, audit registration status, and coordinate account verification rules.
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all duration-200 cursor-pointer shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Invite Educators
        </button>
      </div>

      {/* Stat Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Enrolled", value: stats.total, color: "text-indigo-400", bg: "bg-indigo-950/30 border-indigo-900/40" },
          { label: "Active", value: stats.active, color: "text-emerald-400", bg: "bg-emerald-950/30 border-emerald-900/40" },
          { label: "Pending", value: stats.pending, color: "text-amber-400", bg: "bg-amber-950/30 border-amber-900/40" },
          { label: "Suspended", value: stats.suspended, color: "text-red-400", bg: "bg-red-950/30 border-red-900/40" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border p-4 shadow-lg ${s.bg}`}>
            <div className={`text-4xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-800">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-100">Invite Educators</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Send activation links to new teaching staff</p>
                </div>
                <button
                  onClick={closeModal}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Step Indicator */}
              <div className="flex items-center gap-2 mt-4">
                {[
                  { n: 1, label: "Enter Emails" },
                  { n: 2, label: "Confirmed" },
                ].map((step, i) => (
                  <React.Fragment key={step.n}>
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                          inviteStep >= step.n
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-800 text-slate-500"
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
                      <span className={`text-[10px] font-semibold ${inviteStep >= step.n ? "text-slate-300" : "text-slate-600"}`}>
                        {step.label}
                      </span>
                    </div>
                    {i < 1 && <div className={`flex-1 h-px ${inviteStep > 1 ? "bg-indigo-600" : "bg-slate-800"}`} />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {inviteStep === 2 && inviteStatus?.startsWith("Success") ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-950/60 border border-emerald-900/60 flex items-center justify-center mx-auto">
                    <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-slate-200 font-bold text-sm">{inviteStatus.replace("Success: ", "")}</p>
                    <p className="text-slate-500 text-xs mt-1">Teachers will receive activation links via email.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBulkInvite} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Email Addresses
                    </label>
                    <p className="text-[10px] text-slate-600">Separated by commas, spaces, or newlines</p>
                    <textarea
                      rows={5}
                      value={inviteInput}
                      onChange={(e) => setInviteInput(e.target.value)}
                      placeholder={"teacher.one@school.edu\nteacher.two@school.edu, teacher.three@school.edu"}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 placeholder:text-slate-700 text-xs focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                    />
                    <p className="text-[10px] text-slate-600">
                      {inviteInput.split(/[\s,\n]+/).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)).length} valid email(s) detected
                    </p>
                  </div>

                  {inviteStatus && inviteStatus.startsWith("Error") && (
                    <div className="p-3 rounded-lg text-xs font-medium bg-red-950/50 border border-red-900 text-red-400">
                      {inviteStatus}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-1">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer transition-all shadow-lg shadow-indigo-500/20"
                    >
                      Dispatch Invitations
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Roster Table Card */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Table Toolbar */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/30 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <div className="text-sm font-bold text-slate-200">Educators Registered</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{filteredTeachers.length} of {teachers.length} shown</div>
          </div>
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, ID..."
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-4 py-2 text-slate-200 placeholder:text-slate-600 text-xs focus:outline-none focus:border-indigo-500 transition-colors w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredTeachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-slate-300 font-semibold text-sm">
                {searchQuery ? "No educators match your search" : "No educators enrolled yet"}
              </p>
              <p className="text-slate-600 text-xs mt-1">
                {searchQuery ? "Try adjusting your search terms." : "Click 'Invite Educators' to onboard your first teacher."}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Invite Educators
                </button>
              )}
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                  <th className="px-6 py-3.5">Educator</th>
                  <th className="px-6 py-3.5">Employee ID</th>
                  <th className="px-6 py-3.5">Date Invited</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTeachers.map((teacher) => {
                  const cfg = STATUS_CONFIG[teacher.status];
                  return (
                    <tr key={teacher.id} className="hover:bg-slate-800/20 transition-colors">
                      {/* Educator Cell */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <AvatarInitials teacher={teacher} />
                          <div>
                            <div className="text-sm font-semibold text-slate-200">
                              {teacher.first_name || teacher.last_name
                                ? `${teacher.first_name} ${teacher.last_name}`.trim()
                                : <span className="text-slate-500 italic font-normal text-xs">Awaiting registration</span>
                              }
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{teacher.email}</div>
                          </div>
                        </div>
                      </td>
                      {/* Employee ID */}
                      <td className="px-6 py-4">
                        <span className="font-mono text-[11px] text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded">
                          {teacher.employee_id || <span className="text-slate-600 not-italic">—</span>}
                        </span>
                      </td>
                      {/* Date */}
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {new Date(teacher.invited_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      {/* Status Badge */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${cfg.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => toggleStatus(teacher.id)}
                          disabled={teacher.status === "pending_verification"}
                          className={`text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-200 ${
                            teacher.status === "pending_verification"
                              ? "opacity-30 cursor-not-allowed bg-slate-800 text-slate-500"
                              : teacher.status === "active"
                              ? "bg-red-950/50 hover:bg-red-900/40 text-red-400 border border-red-900/50"
                              : "bg-emerald-950/50 hover:bg-emerald-900/40 text-emerald-400 border border-emerald-900/50"
                          }`}
                        >
                          {teacher.status === "active" ? "Suspend" : teacher.status === "suspended" ? "Activate" : "Pending"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
