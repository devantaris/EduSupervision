import React from "react";
import Link from "next/link";
import InstitutionSeal from "@/components/ui/InstitutionSeal";

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
    <div className="min-h-screen bg-void text-parchment font-jakarta relative selection:bg-burgundy selection:text-parchment overflow-hidden">
      
      {/* Background Gradients */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-burgundy/10 blur-[150px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full bg-gold/5 blur-[150px]" />
      </div>

      {/* Top Branding Bar */}
      <header className="relative z-10 px-8 py-6 border-b hairline-w bg-void/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4 group">
            <InstitutionSeal initials="ES" className="w-10 h-10 text-gold" />
            <span className="font-cinzel text-xl tracking-[0.15em] font-bold uppercase text-parchment">
              EduSupervision
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-[10px] tracking-[0.22em] uppercase font-bold text-slate-400 hover:text-gold transition-colors duration-300"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="px-5 py-2 bg-gradient-to-r from-burgundy to-crimson border border-brass/30 text-parchment text-[10px] tracking-[0.22em] uppercase font-bold rounded hover:opacity-90 transition-all duration-300 shadow-lg shadow-burgundy/20"
            >
              Enter Console
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10">
        
        {/* HERO SECTION */}
        <section className="max-w-7xl mx-auto px-8 pt-24 pb-32 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[85vh]">
          
          {/* Left Text Block */}
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-2 border hairline rounded-full px-4 py-1.5 text-[10px] tracking-[0.22em] uppercase text-brass bg-obsidian/50">
              <span className="h-1.5 w-1.5 rounded-full bg-burgundy animate-pulse" />
              State Auditing Stack
            </div>

            <h1 className="font-cinzel text-5xl sm:text-6xl md:text-7xl font-bold uppercase tracking-wide leading-[1.1] text-parchment">
              Pedagogy <br />
              <span className="text-gold">As A Craft.</span> <br />
              <span className="font-playfair italic normal-case tracking-normal text-4xl sm:text-5xl md:text-6xl text-brass">
                Audited by State.
              </span>
            </h1>

            <p className="text-lg text-slate-300 max-w-xl font-playfair leading-relaxed">
              EduSupervision replaces manual, inconsistent supervision workflows with an asynchronous, 
              rubric-driven digital dossier. Deliver immersive training curricula, track watches via 
              debounced progress telemetry, and auto-evaluate teachers via zero-bias, Ministry-calibrated pipelines.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-burgundy to-crimson border border-brass/30 text-parchment tracking-[0.15em] uppercase font-bold text-xs rounded-md shadow-lg shadow-burgundy/20 hover:opacity-90 transition-all duration-300"
              >
                Access Portal
              </Link>
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center justify-center px-8 py-4 border hairline rounded-md hover:bg-obsidian/50 text-brass tracking-[0.15em] uppercase font-bold text-xs transition-all duration-300"
              >
                Ministry Console
              </Link>
            </div>
          </div>

          {/* Right Visual Element */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end relative">
            <div className="relative w-80 h-96 sm:w-96 sm:h-[480px] flex items-center justify-center">
              <div aria-hidden="true" className="absolute border hairline rounded-full w-80 h-80 sm:w-96 sm:h-96 opacity-20 animate-spin-slow" style={{ animationDuration: '40s' }} />
              
              <div className="w-64 h-80 sm:w-72 sm:h-96 rounded-xl border hairline bg-obsidian p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-burgundy/10 to-transparent" />
                
                <div className="space-y-2 relative z-10">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-brass font-bold">State Ledger Core</div>
                  <div className="font-cinzel text-xl font-bold uppercase text-parchment">System: Active</div>
                </div>

                <div className="my-6 space-y-4 border-t border-b border-white/5 py-6 relative z-10">
                  <div className="flex justify-between items-center text-[10px] tracking-[0.22em] uppercase text-slate-400">
                    <span>Registry Search</span>
                    <span className="text-brass font-bold">Vault</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] tracking-[0.22em] uppercase text-slate-400">
                    <span>Verification</span>
                    <span className="text-parchment font-bold">Dense</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] tracking-[0.22em] uppercase text-slate-400">
                    <span>Telemetry</span>
                    <span className="text-burgundy font-bold">Active</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] tracking-[0.22em] uppercase font-bold text-slate-300">Auditing 1.5s</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST SIGNALS */}
        <section className="border-t border-b hairline-w bg-obsidian/30 py-16">
          <div className="max-w-7xl mx-auto px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/5">
              {TRUST_SIGNALS.map((s, idx) => (
                <div key={s.label} className="flex flex-col gap-3 pl-8 first:pl-0 first:border-0">
                  <span className="font-cinzel text-4xl font-bold text-parchment">
                    {s.value}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-brass">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="max-w-7xl mx-auto px-8 py-32 space-y-20">
          <div className="text-center space-y-4">
            <div className="text-[10px] uppercase tracking-[0.22em] text-brass font-bold">✦ Technical Capabilities</div>
            <h2 className="font-cinzel text-3xl sm:text-4xl font-bold uppercase text-parchment">
              Rigorous Infrastructure
            </h2>
            <p className="text-sm text-slate-400 font-playfair max-w-2xl mx-auto">
              We do not build generic grids. Our system provides precise multi-tenant partitions, 
              high-fidelity content telemetry, and cryptographic verification channels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <article
                key={f.title}
                className="rounded-xl border hairline bg-obsidian p-8 hover:border-brass/50 transition-all duration-300 flex flex-col gap-4 relative group overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <InstitutionSeal initials={f.num} className="w-16 h-16 text-brass" />
                </div>
                
                <div className="font-cinzel text-lg tracking-widest text-brass font-bold">
                  {f.num}
                </div>
                
                <h3 className="font-cinzel text-xl font-bold text-parchment uppercase">
                  {f.title}
                </h3>
                <p className="text-sm text-slate-400 font-playfair leading-relaxed">
                  {f.desc}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="border-t hairline-w bg-obsidian/40 py-32 px-8">
          <div className="max-w-7xl mx-auto space-y-20">
            <div className="text-center space-y-4">
              <div className="text-[10px] uppercase tracking-[0.22em] text-brass font-bold">✦ Operating Protocols</div>
              <h2 className="font-cinzel text-3xl sm:text-4xl font-bold uppercase text-parchment">
                The Three Pillars
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {HOW_IT_WORKS.map((h) => (
                <div
                  key={h.step}
                  className="rounded-xl border hairline bg-void p-8 relative flex flex-col gap-6"
                >
                  <span className="font-cinzel text-5xl font-bold text-burgundy/20">
                    {h.step}
                  </span>
                  <div>
                    <h3 className="font-cinzel text-xl font-bold uppercase text-parchment mb-3">
                      {h.title}
                    </h3>
                    <p className="text-sm text-slate-400 font-playfair leading-relaxed">
                      {h.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="max-w-7xl mx-auto px-8 py-32">
          <div className="rounded-xl border hairline bg-obsidian p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-burgundy/10 to-void/50" />
            
            <div className="max-w-2xl mx-auto space-y-8 relative z-10">
              <InstitutionSeal initials="ES" className="w-16 h-16 text-gold mx-auto opacity-50" />
              <h2 className="font-cinzel text-3xl sm:text-4xl font-bold uppercase text-parchment leading-tight">
                Orchestrate Standards. <br />
                <span className="text-brass">Empower Educators.</span>
              </h2>
              <p className="text-base text-slate-400 font-playfair">
                Deploy a high-contrast pedagogical environment designed specifically for rigorous school district demands.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link
                  href="/login"
                  className="px-8 py-4 bg-gradient-to-r from-burgundy to-crimson border border-brass/30 text-parchment tracking-[0.15em] uppercase font-bold text-xs rounded-md hover:opacity-90 transition-all duration-300"
                >
                  Deploy Portal Now
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t hairline-w bg-void py-12 px-8 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <InstitutionSeal initials="ES" className="w-6 h-6 text-gold" />
            <span className="font-cinzel text-sm tracking-[0.15em] font-bold uppercase text-parchment">
              EduSupervision
            </span>
          </div>
          
          <div className="flex items-center gap-8 text-[10px] tracking-[0.22em] uppercase font-bold text-slate-500">
            <span className="hover:text-brass cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-brass cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-brass cursor-pointer transition-colors">Contact</span>
          </div>

          <p className="text-[10px] tracking-[0.22em] uppercase font-bold text-slate-600">
            &copy; {new Date().getFullYear()} Academic Registry.
          </p>
        </div>
      </footer>
    </div>
  );
}
