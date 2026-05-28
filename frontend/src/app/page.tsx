import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header / Navbar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xl font-extrabold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
            EduSupervision
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className="text-sm font-semibold text-slate-300 hover:text-slate-100 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 py-20 text-center max-w-4xl mx-auto space-y-12">
        <div className="space-y-6">
          <div className="inline-flex items-center space-x-2 bg-indigo-950/40 border border-indigo-900/60 rounded-full px-4 py-1 text-xs text-indigo-300">
            <span>🚀 Version 1.0 (MVP) Active</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-none bg-gradient-to-b from-slate-50 via-slate-100 to-slate-400 bg-clip-text text-transparent">
            AI-Assisted Teacher Training <br className="hidden md:inline" />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
              & Evaluation Platform
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-normal">
            EduSupervision empowers institutions to streamline educational standards, deliver interactive training modules, and perform objective, AI-assisted reviews.
          </p>
        </div>

        {/* CTA Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full">
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all text-center"
          >
            Access Portal
          </Link>
          <Link
            href="/admin/dashboard"
            className="w-full sm:w-auto px-8 py-4 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 font-bold rounded-xl transition-all text-center"
          >
            Institution Console
          </Link>
        </div>

        {/* Core Pillars / Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 w-full text-left">
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-3 hover:border-slate-800 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-indigo-950 flex items-center justify-center text-indigo-400 font-bold">
              🔑
            </div>
            <h3 className="text-lg font-bold text-slate-100">Multi-Tenancy</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Complete data isolation via unique academic institution identifiers ensuring strict privacy.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-3 hover:border-slate-800 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-purple-950 flex items-center justify-center text-purple-400 font-bold">
              📹
            </div>
            <h3 className="text-lg font-bold text-slate-100">Video Telemetry</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Curriculum progression tracking with continuous 30-second throttled micro-updates.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-3 hover:border-slate-800 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-emerald-950 flex items-center justify-center text-emerald-400 font-bold">
              🤖
            </div>
            <h3 className="text-lg font-bold text-slate-100">AI Evaluation</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Objective evaluation workflows mapped against rubrics with evidence citation.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500 mt-auto bg-slate-950">
        &copy; {new Date().getFullYear()} EduSupervision. All rights reserved.
      </footer>
    </div>
  );
}
