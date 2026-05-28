import React from "react";

export default function RegisterPage({ params }: { params: { token: string } }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-100">Activate Account</h2>
        <p className="text-slate-400 text-sm">Onboard as an educator or supervisor</p>
      </div>

      <div className="bg-slate-950/50 border border-indigo-950 rounded-lg p-3 text-xs text-indigo-300">
        Token verified: <code className="text-indigo-400">{params.token || "pending"}</code>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">First Name</label>
            <input
              type="text"
              disabled
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Last Name</label>
            <input
              type="text"
              disabled
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300">Employee/Teacher ID</label>
          <input
            type="text"
            disabled
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300">Set Password</label>
          <input
            type="password"
            disabled
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
          />
        </div>

        <button
          disabled
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 rounded-lg transition-colors cursor-not-allowed opacity-50"
        >
          Activate Account (Pending Phase 2)
        </button>
      </div>
    </div>
  );
}
