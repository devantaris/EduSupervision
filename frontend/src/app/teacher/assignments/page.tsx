import React from "react";

export default function TeacherAssignmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100">My Submissions</h1>
        <p className="text-slate-400 text-sm mt-1">
          Submit lesson plans and view detailed AI evaluations mapping rubric categories and development suggestions.
        </p>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <div className="text-sm font-semibold text-slate-300 mb-4">Pending Assignments</div>
        <div className="text-center py-12 text-slate-500 text-sm">
          No assignments are currently pending submission. Submissions portal will open in Phase 5.
        </div>
      </div>
    </div>
  );
}
