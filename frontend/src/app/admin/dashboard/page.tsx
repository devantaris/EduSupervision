import React from "react";

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100">Supervision Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">
          Monitor educational standards, teacher activations, and submission reviews.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase">Active Teachers</span>
          <div className="text-3xl font-bold text-slate-100">0</div>
          <span className="text-[10px] text-emerald-400">Onboarding pending setup</span>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Submissions</span>
          <div className="text-3xl font-bold text-slate-100">0</div>
          <span className="text-[10px] text-slate-500">No active assignments</span>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase">Average Score</span>
          <div className="text-3xl font-bold text-slate-100">N/A</div>
          <span className="text-[10px] text-slate-500">Grades pending AI evaluation</span>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase">Plagiarism Alerts</span>
          <div className="text-3xl font-bold text-slate-100">0</div>
          <span className="text-[10px] text-emerald-400">All submissions verified clear</span>
        </div>
      </div>

      <div className="bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl p-16 text-center space-y-2">
        <div className="text-slate-400 font-medium">Platform Setup Phase 1 Complete</div>
        <p className="text-slate-500 text-xs max-w-sm mx-auto">
          Database schemas are provisioned. Connect to API services to visualize educational audits.
        </p>
      </div>
    </div>
  );
}
