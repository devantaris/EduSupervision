import React from "react";

export default function TeacherTrainingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100">Training Courses</h1>
        <p className="text-slate-400 text-sm mt-1">
          Review curriculum documents, stream pedagogical instructional videos, and check your completion status.
        </p>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <div className="text-sm font-semibold text-slate-300 mb-4">Assigned Materials</div>
        <div className="text-center py-12 text-slate-500 text-sm">
          No training courses have been published by your administrator. Course materials will appear in Phase 4.
        </div>
      </div>
    </div>
  );
}
