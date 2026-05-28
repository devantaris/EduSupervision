import React from "react";

export default function TeacherDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100">Welcome, Educator</h1>
        <p className="text-slate-400 text-sm mt-1">
          Access your professional training courses and check evaluation reports for assignment submissions.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase">Training Progress</span>
          <div className="text-3xl font-bold text-slate-100">0%</div>
          <span className="text-[10px] text-slate-500">No training videos started</span>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase">Pending Submissions</span>
          <div className="text-3xl font-bold text-slate-100">0</div>
          <span className="text-[10px] text-slate-500">No pending assignments due</span>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase">Average Evaluation Score</span>
          <div className="text-3xl font-bold text-slate-100">N/A</div>
          <span className="text-[10px] text-slate-500">No graded assignments</span>
        </div>
      </div>

      <div className="bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl p-16 text-center space-y-2">
        <div className="text-slate-400 font-medium">Professional Growth Plan Activated</div>
        <p className="text-slate-500 text-xs max-w-sm mx-auto">
          Welcome to your professional development environment. Course materials will appear as soon as they are assigned by institution supervisors.
        </p>
      </div>
    </div>
  );
}
