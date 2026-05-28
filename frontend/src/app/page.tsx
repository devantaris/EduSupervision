import React from "react";
import Link from "next/link";

/* ─────────────────────────────────────────────────────────────
   Data
   ───────────────────────────────────────────────────────────── */
const TRUST_SIGNALS = [
  { value: "500+", label: "Educators Provisioned" },
  { value: "98%", label: "LLM Scoring Precision" },
  { value: "SOC2", label: "Security Compliant" },
  { value: "30s", label: "Telemetry Progress Sync" },
];

const FEATURES = [
  {
    num: "01",
    title: "Multi-Tenancy Isolation",
    desc: "Complete data isolation per institution via unique academic identifiers. Each district's data is hermetically separated with row-level security.",
  },
  {
    num: "02",
    title: "AI Rubric Evaluation",
    desc: "LLM-powered grading mapped against structured rubrics with evidence citations, consistency scoring, and confidence indicators.",
  },
  {
    num: "03",
    title: "Video Telemetry",
    desc: "Real-time curriculum progression tracking with 30-second throttled heartbeats, chapter completion events, and watch-time analytics.",
  },
  {
    num: "04",
    title: "Bulk Teacher Onboarding",
    desc: "Invite entire cohorts via CSV upload. Signed token-based activation links with configurable expiry windows and role assignments.",
  },
  {
    num: "05",
    title: "Plagiarism Detection",
    desc: "Submission fingerprinting with similarity scoring against previous cohort answers. Flags escalate to admin review queue.",
  },
  {
    num: "06",
    title: "Real-time SSE Notifications",
    desc: "Server-sent events push instant alerts for assignment grades, new content, and institutional announcements without polling.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "I",
    title: "Provision & Onboard",
    desc: "Institution directors configure their tenant, import rosters via CSV, and publish core training content modules.",
  },
  {
    step: "II",
    title: "Engage & Track",
    desc: "Educators watch video modules, download reading curricula, and submit reflection essays with active telemetry logging.",
  },
  {
    step: "III",
    title: "Supervise & Certify",
    desc: "The AI engine parses documents via PDF stream/multimodal OCR, scores rubrics with quote citations, and flushes dashboard analytics.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans relative selection:bg-flame selection:text-white">
      
      {/* ══════════════════════════════════════════
          AMBIENT ORGANIC BACKDROPS (SLOW AUDIT DRIFT - 45s)
      ══════════════════════════════════════════ */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Sapphire-Teal auroral blob */}
        <div
          className="absolute top-[-25%] left-[-10%] w-[900px] h-[900px] rounded-full opacity-[0.12] animate-drift-organic blur-[130px]"
          style={{
            background: "radial-gradient(circle, var(--accent-copper) 0%, #05070b 60%, transparent 100%)",
          }}
        />
        {/* Aged Gold auroral blob */}
        <div
          className="absolute bottom-[-15%] right-[-10%] w-[800px] h-[800px] rounded-full opacity-[0.08] animate-drift-organic-slow blur-[140px]"
          style={{
            background: "radial-gradient(circle, var(--accent-amber) 0%, transparent 70%)",
          }}
        />
        {/* Burgundy core glow */}
        <div
          className="absolute top-[25%] right-[10%] w-[550px] h-[550px] rounded-full opacity-[0.06] animate-pulse-ring blur-[100px]"
          style={{
            background: "var(--accent-orange)",
          }}
        />
        
        {/* Fine Editorial Grid Lines */}
        <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,var(--accent-gold)_1px,transparent_1px),linear-gradient(to_bottom,var(--accent-gold)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      {/* ══════════════════════════════════════════
          MINIMALIST TOP BRANDING BAR
      ══════════════════════════════════════════ */}
      <header className="relative z-10 px-8 py-6 border-hairline-b bg-background/20 backdrop-blur-[2px]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="font-serif-display text-2xl tracking-widest font-black uppercase text-gold">
              EduSupervision
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-xs tracking-widest uppercase font-bold text-slate-400 hover:text-gold transition-colors duration-300"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="px-5 py-2 bg-gradient-to-r from-flame to-[#801414] text-white text-xs tracking-widest uppercase font-black rounded hover:shadow-lg hover:shadow-flame/15 transition-all duration-300"
            >
              Enter Console
            </Link>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════ */}
      <main className="flex-1 relative z-10">
        
        {/* ── HERO SECTION (ASYMMETRICAL EDITORIAL) ── */}
        <section className="max-w-7xl mx-auto px-8 pt-20 pb-32 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[85vh]">
          
          {/* Left Text Block (col-span-7) */}
          <div className="lg:col-span-7 space-y-8 animate-slate-reveal">
            
            <div className="inline-flex items-center gap-2 border-hairline bg-amber-950/10 rounded px-3 py-1 text-[10px] tracking-widest uppercase text-gold animate-float-elastic">
              <span className="h-1.5 w-1.5 rounded-full bg-flame animate-pulse" />
              State Auditing Stack
            </div>

            <h1 className="font-serif-display text-6xl sm:text-7xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9] text-white">
              Pedagogy <br />
              <span className="text-gold">As A Craft.</span> <br />
              <span className="gradient-text-flame font-sans font-extrabold normal-case tracking-tight text-5xl sm:text-6xl md:text-7xl">
                Audited by State.
              </span>
            </h1>

            <p className="text-base text-slate-400 max-w-xl leading-relaxed font-light">
              EduSupervision replaces manual, inconsistent supervision workflows with an asynchronous, 
              rubric-driven digital dossier. Deliver immersive training curricula, track watches via 
              debounced progress telemetry, and auto-evaluate teachers via zero-bias, Ministry-calibrated pipelines.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 bg-gold hover:bg-[#ebd5b5] text-black tracking-widest uppercase font-black text-xs transition-all duration-300"
              >
                Access Portal
              </Link>
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center justify-center px-8 py-4 border-hairline hover:bg-gold/5 text-gold tracking-widest uppercase font-black text-xs transition-all duration-300"
              >
                Ministry Console
              </Link>
            </div>
          </div>

          {/* Right Floating Monolith (col-span-5) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end animate-slate-reveal-delay-2 relative">
            <div className="relative w-80 h-96 sm:w-96 sm:h-[480px] flex items-center justify-center">
              
              {/* Outer Rotating Gold Ring */}
              <div aria-hidden="true" className="absolute border border-gold/15 rounded-full w-80 h-80 sm:w-96 sm:h-96 animate-rotate-slow" />
              
              {/* Off-axis Architectural Glass Monolith */}
              <div className="w-64 h-80 sm:w-72 sm:h-96 transform rotate-6 border border-hairline bg-gradient-to-b from-[#0f1422]/20 to-zinc-950/40 backdrop-blur-xl p-8 flex flex-col justify-between shadow-2xl relative group overflow-hidden">
                {/* Micro-glow highlights */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent opacity-50" />
                <div className="absolute bottom-0 right-0 w-24 h-24 rounded-full bg-flame/10 blur-xl group-hover:bg-flame/20 transition-all duration-300" />
                
                {/* Monolith header */}
                <div className="space-y-1">
                  <div className="text-[9px] uppercase tracking-widest text-gold font-bold">State Ledger Core</div>
                  <div className="font-serif text-xl font-bold uppercase text-white">System: active</div>
                </div>

                {/* Monolith visual graphic */}
                <div className="my-6 space-y-2 border-t border-b border-hairline py-4">
                  <div className="flex justify-between items-center text-[10px] tracking-widest uppercase text-slate-500">
                    <span>Registry Search</span>
                    <span className="text-flame font-bold">National Vault</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] tracking-widest uppercase text-slate-500">
                    <span>Verification Chain</span>
                    <span className="text-white font-bold">768-Dim Dense</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] tracking-widest uppercase text-slate-500">
                    <span>Telemetry Ingestion</span>
                    <span className="text-white">Active</span>
                  </div>
                </div>

                {/* Monolith Footer */}
                <div className="flex items-center gap-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-flame animate-pulse-ring" />
                  <span className="text-[10px] tracking-widest uppercase font-bold text-slate-300">Auditing 1.5s</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── EDITORIAL TRUST BAR ── */}
        <section className="border-hairline-t border-hairline-b bg-[#090b10]/40 py-12">
          <div className="max-w-7xl mx-auto px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {TRUST_SIGNALS.map((s, idx) => (
                <div
                  key={s.label}
                  className={`flex flex-col gap-2 ${idx !== 3 ? 'md:border-hairline-r md:pr-4' : ''}`}
                >
                  <span className="font-serif text-3xl font-black text-gold">
                    {s.value}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES SECTION (ASYMMETRICAL LAYOUT) ── */}
        <section id="features" className="max-w-7xl mx-auto px-8 py-32 space-y-24">
          
          {/* Typographic Asymmetric Header */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8 space-y-4">
              <div className="text-[10px] uppercase tracking-widest text-flame font-black">✦ Technical Features</div>
              <h2 className="font-serif text-4xl sm:text-5xl font-black uppercase text-white max-w-2xl leading-none">
                Rigorous Infrastructure <br />
                <span className="text-gold">For Education Districts</span>
              </h2>
            </div>
            <div className="lg:col-span-4">
              <p className="text-sm text-slate-400 font-light leading-relaxed">
                We do not build generic grids. Our system provides precise multi-tenant partitions, 
                high-fidelity content telemetry, and cryptographic verification channels.
              </p>
            </div>
          </div>

          {/* Asymmetrical Feature Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <article
                key={f.title}
                className="group p-8 border-hairline bg-[#0d0f15]/20 hover:bg-[#121620]/30 hover:border-gold/30 transition-all duration-500 relative flex flex-col justify-between min-h-[260px]"
              >
                <div className="space-y-4">
                  {/* Raw numbering */}
                  <div className="font-serif text-sm tracking-widest text-flame font-bold opacity-60 group-hover:opacity-100 transition-opacity">
                    {f.num}
                  </div>
                  
                  {/* Title & Desc */}
                  <div className="space-y-2">
                    <h3 className="font-serif text-lg font-bold text-white uppercase group-hover:text-gold transition-colors duration-300">
                      {f.title}
                    </h3>
                    <p className="text-xs text-slate-400 font-light leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </div>
                
                {/* Hairline accent details */}
                <div className="w-8 h-[1px] bg-gold/30 mt-6 group-hover:w-full transition-all duration-700" />
              </article>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS SECTION (MAGAZINE SPREAD) ── */}
        <section id="how-it-works" className="border-hairline-t bg-[#090b10]/30 py-32 px-8">
          <div className="max-w-7xl mx-auto space-y-20">
            
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="text-[10px] uppercase tracking-widest text-gold font-bold">✦ Operating Protocols</div>
              <h2 className="font-serif text-4xl sm:text-5xl font-black uppercase text-white">The Three Pillars</h2>
            </div>

            {/* Asymmetrical Horizontal Blocks */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {HOW_IT_WORKS.map((h) => (
                <div
                  key={h.step}
                  className="p-8 border-hairline bg-background/60 backdrop-blur-sm relative flex flex-col justify-between group min-h-[300px]"
                >
                  <div>
                    <span className="font-serif text-5xl font-black text-flame/10 group-hover:text-flame/20 transition-colors block mb-4">
                      {h.step}
                    </span>
                    <h3 className="font-serif text-xl font-bold uppercase text-white mb-3">
                      {h.title}
                    </h3>
                    <p className="text-xs text-slate-400 font-light leading-relaxed">
                      {h.desc}
                    </p>
                  </div>
                  <div className="text-[9px] uppercase tracking-widest text-gold font-bold pt-8">
                    Active Module
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── THE EDITORIAL CTA BANNER ── */}
        <section className="max-w-7xl mx-auto px-8 py-32">
          <div className="border border-flame/25 bg-gradient-to-br from-[#1b0d0c]/40 to-background rounded p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
            {/* Ambient orange highlight */}
            <div aria-hidden="true" className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-flame/5 blur-[80px] pointer-events-none" />
            <div aria-hidden="true" className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-gold/5 blur-[80px] pointer-events-none" />

            <div className="max-w-2xl mx-auto space-y-8 relative z-10">
              <span className="text-4xl animate-float-elastic inline-block">✦</span>
              <h2 className="font-serif text-4xl sm:text-5xl font-black uppercase text-white leading-[1.05]">
                Orchestrate Standards. <br />
                <span className="gradient-text-gold">Empower Educators.</span>
              </h2>
              <p className="text-sm text-slate-400 font-light leading-relaxed">
                Deploy a high-contrast pedagogical environment designed specifically for rigorous school district demands.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link
                  href="/login"
                  className="px-8 py-4 bg-flame hover:bg-[#b01e1e] text-white text-xs tracking-widest uppercase font-black transition-all duration-300"
                >
                  Deploy Portal Now
                </Link>
                <Link
                  href="/admin/dashboard"
                  className="px-8 py-4 border border-slate-700 hover:border-slate-500 text-slate-300 text-xs tracking-widest uppercase font-black transition-all duration-300"
                >
                  District Console
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ══════════════════════════════════════════
          THE FLOATING DOCK NAVIGATION (macOS STYLE)
      ══════════════════════════════════════════ */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-full atelier-glass shadow-2xl flex items-center gap-6 animate-float-elastic">
        <a href="#" className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-gold group transition-all duration-200">
          <span className="text-base group-hover:scale-125 transition-transform duration-200">🏠</span>
          <span className="text-[8px] uppercase tracking-wider scale-90 opacity-0 group-hover:opacity-100 transition-opacity">Main</span>
        </a>
        <div aria-hidden="true" className="w-[1px] h-4 bg-gold/15" />
        <a href="#features" className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-gold group transition-all duration-200">
          <span className="text-base group-hover:scale-125 transition-transform duration-200">✦</span>
          <span className="text-[8px] uppercase tracking-wider scale-90 opacity-0 group-hover:opacity-100 transition-opacity">Specs</span>
        </a>
        <div aria-hidden="true" className="w-[1px] h-4 bg-gold/15" />
        <a href="#how-it-works" className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-gold group transition-all duration-200">
          <span className="text-base group-hover:scale-125 transition-transform duration-200">🔍</span>
          <span className="text-[8px] uppercase tracking-wider scale-90 opacity-0 group-hover:opacity-100 transition-opacity">Pillars</span>
        </a>
        <div aria-hidden="true" className="w-[1px] h-4 bg-gold/15" />
        <Link href="/login" className="px-4 py-1.5 bg-gradient-to-r from-flame to-[#801414] text-white text-[9px] tracking-widest uppercase font-black rounded-full hover:shadow-lg hover:shadow-flame/20 hover:scale-105 transition-all duration-200">
          Access Console
        </Link>
      </nav>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer className="border-hairline-t bg-[#04060b] py-16 px-8 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="font-serif-display text-sm tracking-widest font-black uppercase text-gold">EduSupervision</span>
          </div>
          
          <div className="flex items-center gap-8 text-[10px] tracking-widest uppercase font-bold text-slate-500">
            <a href="#" className="hover:text-gold transition-colors">Privacy</a>
            <a href="#" className="hover:text-gold transition-colors">Terms</a>
            <a href="#" className="hover:text-gold transition-colors">Contact</a>
          </div>

          <p className="text-[10px] tracking-widest uppercase font-bold text-slate-600">
            &copy; {new Date().getFullYear()} EduSupervision. Crafting Pedagogical Quality.
          </p>
        </div>
      </footer>
    </div>
  );
}
