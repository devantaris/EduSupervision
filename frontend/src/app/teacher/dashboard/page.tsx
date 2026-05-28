"use client";

import React from "react";
import Link from "next/link";

const UPCOMING_DEADLINES = [
  {
    id: 1,
    title: "Classroom Management Reflection",
    subject: "Foundation Module",
    dueDate: "2026-05-31",
    daysLeft: 3,
  },
  {
    id: 2,
    title: "Differentiated Instruction Essay",
    subject: "Practice Module",
    dueDate: "2026-06-05",
    daysLeft: 8,
  },
  {
    id: 3,
    title: "Assessment Strategy Plan",
    subject: "Advanced Module",
    dueDate: "2026-06-14",
    daysLeft: 17,
  },
];

const LEARNING_PATH_STAGES = [
  { label: "Foundation", active: true, done: false },
  { label: "Practice", active: false, done: false },
  { label: "Advanced", active: false, done: false },
  { label: "Expert", active: false, done: false },
];

const MOTIVATIONAL_QUOTES = [
  {
    quote: "Education is not the filling of a pail, but the lighting of a fire.",
    author: "W.B. Yeats",
  },
];

function urgencyStyles(daysLeft: number): string {
  if (daysLeft <= 3)
    return "text-red-400 bg-[#150a0a] border-red-950/40";
  if (daysLeft <= 7)
    return "text-amber-400 bg-[#1e150c] border-amber-950/40";
  return "text-emerald-400 bg-[#081711] border-emerald-950/40";
}

function urgencyLabel(daysLeft: number): string {
  if (daysLeft <= 3) return "Urgent";
  if (daysLeft <= 7) return "Due soon";
  return `${daysLeft} days`;
}

export default function TeacherDashboard() {
  const quote = MOTIVATIONAL_QUOTES[0];

  return (
    <div className="space-y-12 max-w-7xl animate-slate-reveal select-none">
      
      {/* ── Hero Greeting (Editorial) ── */}
      <section className="border-hairline-b pb-8 space-y-3">
        <div className="inline-flex items-center gap-2 border border-gold/30 bg-amber-950/10 rounded px-2.5 py-0.5 text-[9px] tracking-widest uppercase text-gold animate-float-elastic">
          <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
          Professional Development
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-black uppercase text-white tracking-tight leading-tight">
          Welcome back, <br />
          <span className="gradient-text-gold">Educator Portfolio</span>
        </h1>
        <p className="text-slate-400 text-xs font-light max-w-xl">
          Your professional training track is currently underway. Audit module progression, track watch hours, and submit rubric evaluations.
        </p>
      </section>

      {/* ── Stat Plates (Asymmetrical) ── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Progress Plate */}
        <article className="border-hairline p-6 bg-[#0c0f16]/20 relative flex flex-col justify-between group overflow-hidden min-h-[160px]">
          <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold/30" />
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Training Progress
            </span>
            <span className="text-sm opacity-40 group-hover:opacity-100 transition-opacity">🎓</span>
          </div>
          <div className="space-y-2 mt-4">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-5xl font-black text-white tracking-tighter">0%</span>
            </div>
            {/* Elegant Champagne progress bar */}
            <div className="w-full h-1 bg-zinc-900 overflow-hidden rounded">
              <div
                className="h-full bg-gradient-to-r from-gold to-flame transition-all duration-700"
                style={{ width: "0%" }}
              />
            </div>
            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">No hours tracked yet</p>
          </div>
        </article>

        {/* Pending Submissions Plate */}
        <article className="border-hairline p-6 bg-[#0c0f16]/20 relative flex flex-col justify-between group overflow-hidden min-h-[160px]">
          <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold/30" />
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Awaiting Action
            </span>
            <span className="text-sm opacity-40 group-hover:opacity-100 transition-opacity">📋</span>
          </div>
          <div className="space-y-2 mt-4">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-5xl font-black text-white tracking-tighter">3</span>
              <span className="text-[10px] uppercase tracking-widest text-flame font-black animate-pulse">Pending</span>
            </div>
            {/* Visual indicators */}
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex-1 h-1 bg-flame/60 rounded" />
              ))}
            </div>
            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Assignments awaiting essay file</p>
          </div>
        </article>

        {/* Evaluation Score Plate */}
        <article className="border-hairline p-6 bg-[#0c0f16]/20 relative flex flex-col justify-between group overflow-hidden min-h-[160px]">
          <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold/30" />
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Mean Evaluation
            </span>
            <span className="text-sm opacity-40 group-hover:opacity-100 transition-opacity">⭐</span>
          </div>
          <div className="space-y-2 mt-4">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-5xl font-black text-slate-400 tracking-tighter">—</span>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-1 h-1 bg-zinc-900 rounded" />
              ))}
            </div>
            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Requires first evaluated grade</p>
          </div>
        </article>
      </section>

      {/* ── Asymmetrical CPD Stage Timeline ── */}
      <section className="border border-hairline p-8 bg-[#0c0f16]/10 relative flex flex-col gap-6">
        <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold/30" />
        <div className="flex items-center justify-between border-hairline-b pb-4">
          <div>
            <h2 className="font-serif text-lg font-bold text-white uppercase tracking-widest">My Learning Pathway</h2>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">
              District Certifications Sequence
            </p>
          </div>
          <span className="text-[9px] tracking-widest uppercase bg-amber-950/10 text-gold border border-gold/30 px-3 py-1 font-bold">
            Stage 1 of 4
          </span>
        </div>

        {/* Horizontal Stage Timeline */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-4">
          {LEARNING_PATH_STAGES.map((stage, idx) => (
            <div
              key={stage.label}
              className={`p-4 border relative flex flex-col justify-between group min-h-[110px]
                ${stage.active ? 'border-gold bg-[#140f0e] text-gold' : 'border-hairline bg-[#0c0f16]/20 opacity-50'}
              `}
            >
              <div className="flex justify-between items-start">
                <span className="font-serif text-[10px] tracking-widest uppercase font-bold text-slate-400">
                  Step 0{idx + 1}
                </span>
                {stage.active && (
                  <span className="h-1.5 w-1.5 rounded-full bg-flame animate-pulse-ring" />
                )}
              </div>
              
              <span className="text-xs font-serif uppercase tracking-widest font-black text-white group-hover:text-gold transition-colors duration-300">
                {stage.label}
              </span>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-slate-400 leading-relaxed font-light">
          You are currently active in the <span className="text-gold font-bold">Foundation</span> stage of Oakridge Academy&apos;s professional curriculum. 
          Complete the active modules to unlock developmental evaluations.
        </p>
      </section>

      {/* ── Deadlines & Continue Learning Workspace ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Deadlines Feed (col-span-8) */}
        <section className="lg:col-span-8 border-hairline p-8 bg-[#0c0f16]/20 relative flex flex-col gap-6">
          <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold/30" />
          <div className="flex items-center justify-between border-hairline-b pb-4">
            <h2 className="font-serif text-lg font-bold text-white uppercase tracking-widest">
              Upcoming Submissions
            </h2>
            <Link
              href="/teacher/assignments"
              className="text-[10px] tracking-widest uppercase font-bold text-gold hover:text-white transition-colors"
            >
              View Dossier →
            </Link>
          </div>

          <div className="space-y-4">
            {UPCOMING_DEADLINES.map((deadline) => (
              <div
                key={deadline.id}
                className="flex items-center justify-between p-4 border border-hairline bg-background/50 hover:bg-[#121620]/50 transition-all duration-300 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded border border-hairline bg-background flex items-center justify-center shrink-0 text-sm">
                    📝
                  </div>
                  <div>
                    <p className="text-xs font-serif font-black text-white group-hover:text-gold transition-colors duration-300">
                      {deadline.title}
                    </p>
                    <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mt-0.5">
                      {deadline.subject}
                    </p>
                  </div>
                </div>
                
                <span className={`px-2.5 py-1 text-[8px] tracking-widest uppercase font-bold border ${urgencyStyles(deadline.daysLeft)}`}>
                  {urgencyLabel(deadline.daysLeft)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Continue Learning Action (col-span-4) */}
        <section className="lg:col-span-4 flex flex-col">
          <div className="flex-1 border border-hairline bg-[#0c0f16]/20 p-8 flex flex-col justify-between min-h-[220px] relative">
            <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold/30" />
            
            <div className="space-y-4">
              <span className="text-2xl">🚀</span>
              <h3 className="font-serif text-base font-bold uppercase tracking-widest text-white">
                Resume Curriculum
              </h3>
              <p className="text-[10px] text-slate-400 font-light leading-relaxed">
                Continue precisely where you left off. The training catalog has telemetry progress tracking active.
              </p>
            </div>
            
            <Link
              href="/teacher/training"
              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-gold hover:bg-[#ebd5b5] text-black text-xs tracking-widest uppercase font-black transition-all duration-300"
            >
              Open Catalogue
            </Link>
          </div>
        </section>
      </div>

      {/* ── Inspiration Quote (Editorial Panel) ── */}
      <section className="border border-hairline p-8 bg-[#0c0f16]/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold/30" />
        
        {/* Subtle background glow */}
        <div className="absolute top-1/2 right-[10%] w-64 h-64 bg-amber-950/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="flex items-start gap-4 max-w-2xl relative z-10">
          <div className="text-2xl mt-0.5 shrink-0 opacity-40">💡</div>
          <div className="space-y-2">
            <p className="text-[8px] uppercase tracking-widest text-gold font-black">
              Educational Focus
            </p>
            <blockquote className="font-serif text-lg text-white font-medium italic leading-relaxed">
              &ldquo;{quote.quote}&rdquo;
            </blockquote>
            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">— {quote.author}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
