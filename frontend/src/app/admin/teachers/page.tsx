import React from "react";

export default function AdminTeachersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100">Teacher Roster</h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage teacher accounts, bulk invite using CSV lists, and configure verification status.
        </p>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm font-semibold text-slate-300">Registered Educators</div>
          <button className="bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-not-allowed opacity-50" disabled>
            + Bulk Invite Teachers (Phase 3)
          </button>
        </div>

        <div className="text-center py-12 text-slate-500 text-sm">
          No records found. Setup teacher invitations in Phase 3.
        </div>
      </div>
    </div>
  );
}
