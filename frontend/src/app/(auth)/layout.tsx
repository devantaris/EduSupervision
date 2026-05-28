import React from "react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-stretch bg-slate-950 text-slate-100">
      {/* ── LEFT BRAND PANEL (desktop only) ── */}
      <aside className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative flex-col justify-between overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950" />

        {/* Decorative blobs */}
        <div
          aria-hidden="true"
          className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-indigo-600/20 blur-3xl animate-pulse-glow"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 right-0 w-[340px] h-[340px] rounded-full bg-purple-600/15 blur-3xl animate-pulse-glow-slow"
        />
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/4 w-[200px] h-[200px] rounded-full bg-emerald-500/10 blur-2xl animate-pulse-glow-fast"
        />

        {/* Decorative grid overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-10 xl:p-14">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="h-9 w-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-lg">
              🎓
            </div>
            <span className="text-xl font-extrabold gradient-text">
              EduSupervision
            </span>
          </Link>

          {/* Center content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-indigo-950/60 border border-indigo-800/50 rounded-full px-3 py-1 text-xs text-indigo-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Enterprise Platform · v1.0
              </div>

              <h2 className="text-3xl xl:text-4xl font-extrabold text-slate-100 leading-tight">
                Elevate every{" "}
                <span className="gradient-text">educator</span> in<br />
                your institution.
              </h2>

              <p className="text-slate-400 text-sm xl:text-base leading-relaxed max-w-sm">
                AI-assisted training, objective evaluation, and real-time
                progress telemetry — all in one platform built for modern
                school districts.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "500+", label: "Educators trained" },
                { value: "98%", label: "Eval accuracy" },
                { value: "30s", label: "Progress sync" },
                { value: "SOC2", label: "Compliant" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-slate-900/40 border border-slate-700/40 rounded-xl p-4"
                >
                  <div className="text-2xl font-black text-slate-100">
                    {stat.value}
                  </div>
                  <div className="text-xs uppercase tracking-widest text-slate-500 mt-0.5">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Educator quote */}
          <blockquote className="border-l-2 border-indigo-500/60 pl-4 space-y-2">
            <p className="text-slate-300 text-sm italic leading-relaxed">
              &ldquo;EduSupervision transformed how we track professional
              development across our district. The AI grading alone saved us
              hundreds of reviewer-hours.&rdquo;
            </p>
            <footer className="text-xs text-slate-500">
              — Dr. Maria Chen, Director of Curriculum, Lakeside USD
            </footer>
          </blockquote>
        </div>
      </aside>

      {/* ── RIGHT FORM PANEL ── */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 relative">
        {/* Subtle background texture */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Background glow */}
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-3xl pointer-events-none"
        />

        <div className="relative z-10 w-full max-w-lg">
          {/* Mobile-only logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-lg">
                🎓
              </div>
              <span className="text-xl font-extrabold gradient-text">
                EduSupervision
              </span>
            </Link>
            <p className="text-slate-400 text-sm mt-2">
              AI-Powered Teacher Training &amp; Supervision
            </p>
          </div>

          {/* Form card */}
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-slate-950/80">
            {children}
          </div>

          <p className="text-center text-xs text-slate-600 mt-6">
            &copy; {new Date().getFullYear()} EduSupervision. Enterprise
            Edition.
          </p>
        </div>
      </main>
    </div>
  );
}
