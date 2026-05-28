import React from "react";
import Link from "next/link";

/* ─────────────────────────────────────────────────────────────
   Data
───────────────────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "About", href: "#" },
];

const TRUST_SIGNALS = [
  { icon: "🎓", value: "500+", label: "Educators Trained" },
  { icon: "🤖", value: "98%", label: "Evaluation Accuracy" },
  { icon: "🔒", value: "SOC2", label: "Compliant" },
  { icon: "⚡", value: "30s", label: "Progress Sync" },
];

const FEATURES = [
  {
    icon: "🏛️",
    accent: "indigo",
    title: "Multi-Tenancy Isolation",
    desc: "Complete data isolation per institution via unique academic identifiers. Each district's data is hermetically separated with row-level security.",
  },
  {
    icon: "🤖",
    accent: "purple",
    title: "AI Rubric Evaluation",
    desc: "LLM-powered grading mapped against structured rubrics with evidence citations, consistency scoring, and confidence indicators.",
  },
  {
    icon: "📹",
    accent: "emerald",
    title: "Video Telemetry",
    desc: "Real-time curriculum progression tracking with 30-second throttled heartbeats, chapter completion events, and watch-time analytics.",
  },
  {
    icon: "👥",
    accent: "indigo",
    title: "Bulk Teacher Onboarding",
    desc: "Invite entire cohorts via CSV upload. Signed token-based activation links with configurable expiry windows and role assignments.",
  },
  {
    icon: "🔍",
    accent: "purple",
    title: "Plagiarism Detection",
    desc: "Submission fingerprinting with similarity scoring against previous cohort answers and external sources. Flags escalate to admin review queue.",
  },
  {
    icon: "🔔",
    accent: "emerald",
    title: "Real-time SSE Notifications",
    desc: "Server-sent events push instant alerts for assignment grades, new content, and institutional announcements without polling.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Admins Provision Institution",
    desc: "Institution directors configure their tenant, upload the teacher roster via CSV or manual invite, and publish training content modules.",
    icon: "🏗️",
  },
  {
    step: "02",
    title: "Teachers Complete Training",
    desc: "Educators access video and PDF modules, track their progress in real-time, and submit AI-graded assignments directly in the platform.",
    icon: "📚",
  },
  {
    step: "03",
    title: "AI Evaluates Submissions",
    desc: "EduSupervision's evaluation engine scores assignments against rubrics, generates detailed feedback, and surfaces analytics to supervisors.",
    icon: "✅",
  },
];

/* ─────────────────────────────────────────────────────────────
   Accent helpers
───────────────────────────────────────────── */
type Accent = "indigo" | "purple" | "emerald";

const accentBg: Record<Accent, string> = {
  indigo: "bg-indigo-950/70 border-indigo-900/60",
  purple: "bg-purple-950/70 border-purple-900/60",
  emerald: "bg-emerald-950/70 border-emerald-900/60",
};

const accentText: Record<Accent, string> = {
  indigo: "text-indigo-400",
  purple: "text-purple-400",
  emerald: "text-emerald-400",
};

const accentGlow: Record<Accent, string> = {
  indigo: "group-hover:shadow-indigo-500/10",
  purple: "group-hover:shadow-purple-500/10",
  emerald: "group-hover:shadow-emerald-500/10",
};

/* ─────────────────────────────────────────────────────────────
   Page Component
───────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-x-hidden">
      {/* ══════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 glass border-b border-slate-800/60 px-6 py-0">
        <nav className="max-w-7xl mx-auto flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="h-8 w-8 rounded-lg bg-indigo-600/25 border border-indigo-500/30 flex items-center justify-center text-base transition-all duration-200 group-hover:border-indigo-500/60 group-hover:bg-indigo-600/40">
              🎓
            </div>
            <span className="text-lg font-extrabold gradient-text">
              EduSupervision
            </span>
          </Link>

          {/* Nav links — hidden on mobile */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800/50 transition-all duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-slate-100 transition-colors duration-200"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="hidden sm:inline-flex px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
            >
              Get Started →
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* ══════════════════════════════════════════
            HERO SECTION
        ══════════════════════════════════════════ */}
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-6 pt-16 pb-24 overflow-hidden">
          {/* ── Background gradient blobs ── */}
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none select-none">
            {/* Primary indigo blob */}
            <div
              className="absolute top-[-15%] left-[15%] w-[700px] h-[700px] rounded-full opacity-30 animate-pulse-glow"
              style={{
                background:
                  "radial-gradient(circle at center, #4f46e5 0%, #312e81 40%, transparent 70%)",
                filter: "blur(80px)",
              }}
            />
            {/* Purple blob */}
            <div
              className="absolute top-[10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-25 animate-pulse-glow-slow"
              style={{
                background:
                  "radial-gradient(circle at center, #9333ea 0%, #581c87 40%, transparent 70%)",
                filter: "blur(80px)",
              }}
            />
            {/* Emerald blob */}
            <div
              className="absolute bottom-[-10%] left-[35%] w-[400px] h-[400px] rounded-full opacity-20 animate-pulse-glow-fast"
              style={{
                background:
                  "radial-gradient(circle at center, #10b981 0%, #064e3b 40%, transparent 70%)",
                filter: "blur(70px)",
              }}
            />

            {/* Noise / grain overlay */}
            <div
              className="absolute inset-0 opacity-[0.025]"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
                backgroundSize: "200px 200px",
              }}
            />
          </div>

          {/* ── Floating badge ── */}
          <div className="relative z-10 animate-slide-up mb-6">
            <div className="inline-flex items-center gap-2 bg-indigo-950/50 border border-indigo-800/60 rounded-full px-4 py-1.5 text-xs text-indigo-300 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Platform v1.0 — Production Ready
            </div>
          </div>

          {/* ── Headline ── */}
          <h1 className="relative z-10 animate-slide-up-delay-1 text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05] max-w-5xl">
            <span className="block text-slate-100 mb-2">
              AI-Powered Teacher
            </span>
            <span className="block gradient-text">
              Training &amp; Supervision
            </span>
          </h1>

          {/* ── Subheadline ── */}
          <p className="relative z-10 animate-slide-up-delay-2 mt-7 text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed">
            EduSupervision gives institutions the tools to streamline CPD,
            deliver interactive training modules, and evaluate educators
            objectively — powered by AI rubric scoring and real-time analytics.
          </p>

          {/* ── CTAs ── */}
          <div className="relative z-10 animate-slide-up-delay-3 mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-sm sm:max-w-none">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-200 text-base"
            >
              <span>🚀</span> Access Portal
            </Link>
            <Link
              href="/admin/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-900/80 border border-slate-700 hover:border-slate-600 text-slate-200 hover:text-slate-100 font-bold rounded-xl hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 text-base backdrop-blur-sm"
            >
              <span>🏛️</span> Institution Console
            </Link>
          </div>

          {/* ── Floating decorative icon ── */}
          <div
            aria-hidden="true"
            className="relative z-10 mt-16 animate-float opacity-20 text-6xl select-none"
          >
            🎓
          </div>
        </section>

        {/* ══════════════════════════════════════════
            SOCIAL PROOF BAR
        ══════════════════════════════════════════ */}
        <section className="border-y border-slate-800/60 bg-slate-900/30 backdrop-blur-sm py-8">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-center text-[11px] uppercase tracking-widest text-slate-600 font-bold mb-6">
              Trusted by forward-thinking institutions
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {TRUST_SIGNALS.map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col items-center gap-1.5 text-center"
                >
                  <span className="text-2xl">{s.icon}</span>
                  <span className="text-3xl font-black text-slate-100">
                    {s.value}
                  </span>
                  <span className="text-[11px] uppercase tracking-widest text-slate-500 font-medium">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            FEATURES SECTION
        ══════════════════════════════════════════ */}
        <section id="features" className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            {/* Section header */}
            <div className="text-center mb-16 space-y-3">
              <div className="inline-flex items-center gap-2 bg-purple-950/50 border border-purple-900/50 rounded-full px-3 py-1 text-xs text-purple-300">
                ✦ Platform Capabilities
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-100">
                Everything your institution needs
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto text-base">
                Purpose-built features that handle the full educator lifecycle —
                from onboarding to certification.
              </p>
            </div>

            {/* 3×2 feature grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((f) => {
                const accent = f.accent as Accent;
                return (
                  <article
                    key={f.title}
                    className={`group relative bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4 hover:-translate-y-1 hover:shadow-xl ${accentGlow[accent]} transition-all duration-200`}
                  >
                    {/* Icon */}
                    <div
                      className={`h-12 w-12 rounded-xl border flex items-center justify-center text-2xl ${accentBg[accent]}`}
                    >
                      {f.icon}
                    </div>

                    {/* Text */}
                    <div className="space-y-2">
                      <h3 className="text-base font-bold text-slate-100">
                        {f.title}
                      </h3>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        {f.desc}
                      </p>
                    </div>

                    {/* Subtle accent corner */}
                    <div
                      aria-hidden="true"
                      className={`absolute top-0 right-0 w-24 h-24 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${accentText[accent]}`}
                      style={{
                        background: `radial-gradient(circle at top right, currentColor, transparent 70%)`,
                        opacity: 0,
                      }}
                    />
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            HOW IT WORKS
        ══════════════════════════════════════════ */}
        <section
          id="how-it-works"
          className="py-24 px-6 bg-slate-900/20 border-y border-slate-800/40"
        >
          <div className="max-w-5xl mx-auto">
            {/* Section header */}
            <div className="text-center mb-16 space-y-3">
              <div className="inline-flex items-center gap-2 bg-emerald-950/50 border border-emerald-900/50 rounded-full px-3 py-1 text-xs text-emerald-300">
                ✦ Simple by Design
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-100">
                How it works
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto text-base">
                Three steps from institution setup to AI-evaluated outcomes.
              </p>
            </div>

            {/* Steps */}
            <div className="relative">
              {/* Connector line (desktop) */}
              <div
                aria-hidden="true"
                className="hidden md:block absolute top-12 left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-px bg-gradient-to-r from-indigo-800/60 via-purple-700/60 to-emerald-800/60"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
                {HOW_IT_WORKS.map((step, idx) => {
                  const colors = ["indigo", "purple", "emerald"] as Accent[];
                  const c = colors[idx];
                  return (
                    <div key={step.step} className="flex flex-col items-center text-center gap-5">
                      {/* Badge + icon */}
                      <div className="relative">
                        <div
                          className={`h-24 w-24 rounded-2xl border flex flex-col items-center justify-center gap-1 ${accentBg[c]} shadow-xl`}
                        >
                          <span className="text-3xl">{step.icon}</span>
                          <span
                            className={`text-[10px] font-black uppercase tracking-widest ${accentText[c]}`}
                          >
                            Step {step.step}
                          </span>
                        </div>
                      </div>

                      {/* Text */}
                      <div className="space-y-2 max-w-xs">
                        <h3 className="text-lg font-bold text-slate-100">
                          {step.title}
                        </h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            FINAL CTA BANNER
        ══════════════════════════════════════════ */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border border-indigo-900/50 rounded-3xl p-12 md:p-16 text-center overflow-hidden shadow-2xl shadow-indigo-950/60">
              {/* Background blobs */}
              <div
                aria-hidden="true"
                className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-indigo-600/20 blur-3xl animate-pulse-glow pointer-events-none"
              />
              <div
                aria-hidden="true"
                className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-purple-600/15 blur-3xl animate-pulse-glow-slow pointer-events-none"
              />

              <div className="relative z-10 space-y-6">
                <div className="text-5xl animate-float inline-block">🚀</div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-100 leading-tight">
                  Ready to transform your<br />
                  <span className="gradient-text">teacher development program?</span>
                </h2>
                <p className="text-slate-400 max-w-lg mx-auto text-base">
                  Join leading school districts using EduSupervision to raise
                  educator standards, automate evaluation, and deliver measurable
                  CPD outcomes.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
                  <Link
                    href="/login"
                    className="w-full sm:w-auto px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all duration-200 text-base"
                  >
                    Access Portal →
                  </Link>
                  <Link
                    href="/admin/dashboard"
                    className="w-full sm:w-auto px-10 py-4 bg-slate-900/80 border border-slate-700 hover:border-slate-500 text-slate-200 hover:text-white font-bold rounded-xl transition-all duration-200 text-base"
                  >
                    Institution Console
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer className="border-t border-slate-900 bg-slate-950 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <span className="text-base">🎓</span>
            <span className="font-extrabold gradient-text text-sm">
              EduSupervision
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <a href="#" className="hover:text-slate-300 transition-colors duration-200">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-slate-300 transition-colors duration-200">
              Terms of Service
            </a>
            <a href="#" className="hover:text-slate-300 transition-colors duration-200">
              Contact
            </a>
          </div>

          {/* Copyright */}
          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} EduSupervision. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
