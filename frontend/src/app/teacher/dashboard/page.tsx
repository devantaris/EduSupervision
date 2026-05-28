import React from "react";

// Mock upcoming deadlines — in production these would come from apiFetch
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
  { label: "Foundation", emoji: "🌱", active: true, done: false },
  { label: "Practice", emoji: "📚", active: false, done: false },
  { label: "Advanced", emoji: "🔬", active: false, done: false },
  { label: "Expert", emoji: "🏆", active: false, done: false },
];

const MOTIVATIONAL_QUOTES = [
  {
    quote:
      "Education is not the filling of a pail, but the lighting of a fire.",
    author: "W.B. Yeats",
  },
];

function urgencyStyles(daysLeft: number): string {
  if (daysLeft <= 3)
    return "text-red-400 bg-red-950/50 border-red-900/50";
  if (daysLeft <= 7)
    return "text-amber-400 bg-amber-950/50 border-amber-900/50";
  return "text-emerald-400 bg-emerald-950/50 border-emerald-900/50";
}

function urgencyLabel(daysLeft: number): string {
  if (daysLeft <= 3) return "Urgent";
  if (daysLeft <= 7) return "Due soon";
  return `${daysLeft} days`;
}

export default function TeacherDashboard() {
  const quote = MOTIVATIONAL_QUOTES[0];

  return (
    <div className="space-y-10">
      {/* ── Hero Greeting ── */}
      <section>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-100 leading-tight">
          Welcome back, Educator{" "}
          <span className="inline-block animate-[wave_1.5s_ease-in-out_1]">👋</span>
        </h1>
        <p className="mt-2 text-slate-400 text-sm max-w-xl leading-relaxed">
          Your professional development journey is underway. Keep learning,
          keep growing — every module brings you closer to expert status.
        </p>
      </section>

      {/* ── Stat Cards ── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Training Progress */}
        <article className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-xl hover:-translate-y-1 hover:shadow-indigo-500/10 transition-all duration-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Training Progress
            </span>
            <span className="text-xl">🎓</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-slate-100">0%</span>
          </div>
          {/* Mini progress bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              style={{ width: "0%" }}
            />
          </div>
          <p className="text-[10px] text-slate-500">No training videos started yet</p>
        </article>

        {/* Pending Submissions */}
        <article className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-xl hover:-translate-y-1 hover:shadow-amber-500/10 transition-all duration-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Pending Submissions
            </span>
            <span className="text-xl">📋</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-slate-100">3</span>
            <span className="text-sm text-amber-400 font-semibold mb-1">due soon</span>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex-1 h-1.5 rounded-full bg-amber-500/60"
              />
            ))}
          </div>
          <p className="text-[10px] text-slate-500">3 assignments awaiting your submission</p>
        </article>

        {/* Evaluation Score */}
        <article className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-xl hover:-translate-y-1 hover:shadow-emerald-500/10 transition-all duration-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Evaluation Score
            </span>
            <span className="text-xl">⭐</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-slate-100">—</span>
          </div>
          <div className="flex gap-0.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex-1 h-1.5 rounded-full bg-slate-800"
              />
            ))}
          </div>
          <p className="text-[10px] text-slate-500">Complete assignments to receive scores</p>
        </article>
      </section>

      {/* ── My Learning Path ── */}
      <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-100">My Learning Path</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Your personalised CPD progression stages
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-indigo-950/60 text-indigo-400 border border-indigo-800/60">
            Stage 1 of 4
          </span>
        </div>

        {/* Stage track */}
        <div className="flex items-center gap-0">
          {LEARNING_PATH_STAGES.map((stage, idx) => {
            const isLast = idx === LEARNING_PATH_STAGES.length - 1;
            return (
              <React.Fragment key={stage.label}>
                {/* Stage node */}
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all duration-200 shadow-lg ${
                      stage.done
                        ? "bg-emerald-600 shadow-emerald-500/30"
                        : stage.active
                        ? "bg-indigo-600 shadow-indigo-500/30 ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900"
                        : "bg-slate-800 opacity-50"
                    }`}
                  >
                    {stage.done ? "✅" : stage.emoji}
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      stage.active
                        ? "text-indigo-400"
                        : stage.done
                        ? "text-emerald-400"
                        : "text-slate-600"
                    }`}
                  >
                    {stage.label}
                  </span>
                </div>

                {/* Connector line */}
                {!isLast && (
                  <div className="flex-1 h-0.5 mx-2 mb-5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-700 ${
                        stage.done ? "w-full" : "w-0"
                      }`}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          You&apos;re currently in the{" "}
          <span className="text-indigo-400 font-semibold">Foundation</span>{" "}
          stage. Complete your first 5 modules to unlock the Practice stage.
        </p>
      </section>

      {/* ── Bottom two-col: Deadlines + Continue Learning ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Deadlines */}
        <section className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-100">Upcoming Deadlines</h2>
            <a
              href="/teacher/assignments"
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View all →
            </a>
          </div>

          <div className="space-y-3">
            {UPCOMING_DEADLINES.map((deadline) => (
              <div
                key={deadline.id}
                className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-800/30 border border-slate-800/60 hover:bg-slate-800/50 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-lg shrink-0">
                  📝
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate">
                    {deadline.title}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{deadline.subject}</p>
                </div>
                <span
                  className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold border ${urgencyStyles(
                    deadline.daysLeft
                  )}`}
                >
                  {urgencyLabel(deadline.daysLeft)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Continue Learning CTA */}
        <section className="flex flex-col gap-5">
          <div className="bg-gradient-to-br from-indigo-900/60 via-purple-900/40 to-slate-900/60 border border-indigo-800/50 rounded-2xl p-6 shadow-xl flex flex-col justify-between gap-5 hover:-translate-y-1 transition-all duration-200">
            <div>
              <div className="text-2xl mb-3">🚀</div>
              <h3 className="text-base font-extrabold text-slate-100">
                Continue Learning
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Pick up where you left off — your training library is just one
                click away.
              </p>
            </div>
            <a
              href="/teacher/training"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200"
            >
              <span>Open Library</span>
              <span>→</span>
            </a>
          </div>
        </section>
      </div>

      {/* ── Motivational Quote ── */}
      <section className="relative overflow-hidden bg-slate-900/30 border border-slate-800/60 rounded-2xl p-6 shadow-xl">
        {/* Decorative blobs */}
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex items-start gap-4">
          <div className="text-3xl mt-0.5 shrink-0">💡</div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400">
              Daily Inspiration
            </p>
            <blockquote className="text-slate-300 font-medium text-sm leading-relaxed italic">
              &quot;{quote.quote}&quot;
            </blockquote>
            <p className="text-xs text-slate-500 font-semibold">— {quote.author}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
