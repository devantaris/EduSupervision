"use client";

import React, { useState, useEffect } from "react";

interface Teacher {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  status: "active" | "pending_verification" | "suspended";
  employee_id: string;
  invited_at: string;
}

export default function AdminTeachersPage() {
  // Local state roster loaded from mock database representing Phase 3 state
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [inviteInput, setInviteInput] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);

  useEffect(() => {
    // Initial mock list
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

    // Parse emails by comma or newline
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
    setInviteStatus(`Success: Invitation links dispatched to ${emails.length} educators.`);
    
    // Clear success message after 5 seconds
    setTimeout(() => {
      setInviteStatus(null);
      setShowInviteModal(false);
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

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100">Teacher Roster</h1>
          <p className="text-slate-400 text-sm mt-1">
            Bulk-invite educators, audit registration status, and coordinate account verification rules.
          </p>
        </div>
        
        <button
          onClick={() => setShowInviteModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg hover:shadow-indigo-500/20 transition-all cursor-pointer"
        >
          + Invite Educators
        </button>
      </div>

      {/* Bulk Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-100">Invite Educators</h2>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteStatus(null);
                }}
                className="text-slate-500 hover:text-slate-300 text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleBulkInvite} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Email Addresses (Separated by commas, spaces, or newlines)
                </label>
                <textarea
                  rows={5}
                  value={inviteInput}
                  onChange={(e) => setInviteInput(e.target.value)}
                  placeholder="teacher.one@school.edu&#10;teacher.two@school.edu, teacher.three@school.edu"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 placeholder:text-slate-700 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {inviteStatus && (
                <div
                  className={`p-3 rounded-lg text-xs font-medium ${
                    inviteStatus.startsWith("Success")
                      ? "bg-emerald-950/50 border border-emerald-900 text-emerald-400"
                      : "bg-red-950/50 border border-red-900 text-red-400"
                  }`}
                >
                  {inviteStatus}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteStatus(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Dispatch Invitations
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Roster Table Card */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/30 flex justify-between items-center">
          <div className="text-sm font-bold text-slate-200">Educators Registered</div>
          <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full font-medium">
            Total: {teachers.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-800/80 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                <th className="px-6 py-3.5">Email / Account</th>
                <th className="px-6 py-3.5">Full Name</th>
                <th className="px-6 py-3.5">Employee ID</th>
                <th className="px-6 py-3.5">Date Invited</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-200">{teacher.email}</td>
                  <td className="px-6 py-4">
                    {teacher.first_name || teacher.last_name ? (
                      `${teacher.first_name} ${teacher.last_name}`
                    ) : (
                      <span className="text-slate-600 italic">Registration pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono text-[11px]">
                    {teacher.employee_id || (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {new Date(teacher.invited_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        teacher.status === "active"
                          ? "bg-emerald-950/60 text-emerald-400 border border-emerald-900/60"
                          : teacher.status === "suspended"
                          ? "bg-red-950/60 text-red-400 border border-red-900/60"
                          : "bg-amber-950/60 text-amber-400 border border-amber-900/60"
                      }`}
                    >
                      {teacher.status === "active"
                        ? "Active"
                        : teacher.status === "suspended"
                        ? "Suspended"
                        : "Pending Verification"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => toggleStatus(teacher.id)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded cursor-pointer transition-colors ${
                        teacher.status === "active"
                          ? "bg-red-950/40 text-red-400 hover:bg-red-900/30"
                          : "bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/30"
                      }`}
                      disabled={teacher.status === "pending_verification"}
                      style={{
                        opacity: teacher.status === "pending_verification" ? 0.3 : 1,
                        cursor: teacher.status === "pending_verification" ? "not-allowed" : "pointer",
                      }}
                    >
                      {teacher.status === "active" ? "Suspend" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
