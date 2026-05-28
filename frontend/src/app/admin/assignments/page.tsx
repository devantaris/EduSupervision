import React from "react";

export default function AdminAssignmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100">Supervision Assignments</h1>
        <p className="text-slate-400 text-sm mt-1">
          Publish training assignments and configure AI evaluation rubrics with detailed weights.
        </p>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm font-semibold text-slate-300">Assignment Inventory</div>
          <button className="bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-not-allowed opacity-50" disabled>
            + Create New Assignment (Phase 3)
          </button>
        </div>

        <div className="text-center py-12 text-slate-500 text-sm">
          No assignments configured yet. Set up rubrics and objectives in Phase 3.
        </div>
      </div>
    </div>
  );
}
