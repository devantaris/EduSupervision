import React from "react";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/40 p-6 flex flex-col justify-between">
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              EduSupervision
            </h2>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              Educator Portal
            </span>
          </div>

          <nav className="space-y-2">
            <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Workspace
            </div>
            <a href="/teacher/dashboard" className="block px-3 py-2 rounded-lg bg-indigo-900/30 text-indigo-400 font-semibold border-l-2 border-indigo-500">
              Dashboard
            </a>
            <a href="/teacher/training" className="block px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/40">
              Training Courses
            </a>
            <a href="/teacher/assignments" className="block px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/40">
              My Submissions
            </a>
          </nav>
        </div>

        <div className="border-t border-slate-800 pt-4 text-xs text-slate-500">
          User: <span className="text-slate-400">demo-teacher</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
