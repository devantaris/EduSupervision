import React from "react";
import Link from "next/link";
import InstitutionSeal from "@/components/ui/InstitutionSeal";

const TRUST_SIGNALS = [
  { value: "NEP 2020", label: "Aligned Framework" },
  { value: "6-Stage", label: "AI Evaluation Chain" },
  { value: "768-Dim", label: "Vector Plagiarism Audit" },
  { value: "100%", label: "Verbatim Evidence Quotes" },
];

const STAKEHOLDERS = [
  {
    role: "State Boards & Ministry Regulators",
    badge: "Ministry Level",
    color: "from-burgundy to-crimson",
    border: "border-burgundy/40",
    icon: (
      <svg className="w-6 h-6 text-brass" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.333A48.357 48.357 0 0012 9.75c-2.551 0-5.056.2-7.5.583V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
      </svg>
    ),
    headline: "Centralized Academic Governance & Oversight",
    points: [
      "District-wide quality histograms and cross-school performance benchmarking",
      "Immutable evaluation audit trails sealed with cryptographic verification",
      "Real-time monitoring of state curriculum compliance (RBSE / CBSE / NCERT)",
      "Zero-bias standardisation of pedagogical criteria across all educational zones"
    ]
  },
  {
    role: "Principals & Academic Deans",
    badge: "Institutional Level",
    color: "from-gold/20 to-brass/10",
    border: "border-gold/30",
    icon: (
      <svg className="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
    headline: "Automated Rubrics & Workload Reduction",
    points: [
      "Interactive Rubric Builder with live 100% weight balancing calculator",
      "Cuts lesson plan inspection time by 90% while improving diagnostic depth",
      "Automated cohort invitation workflows with 72-hour secure token emails",
      "Aggregated teacher competency tracking & automated CPD course assignments"
    ]
  },
  {
    role: "Teachers & Faculty Members",
    badge: "Educator Level",
    color: "from-emerald-950/40 to-emerald-900/10",
    border: "border-emerald-500/30",
    icon: (
      <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    headline: "Fair Feedback & Career Progression",
    points: [
      "AI feedback backed by verbatim quotations directly from your lesson text",
      "Circular SVG composite scoring ring with individual criterion breakdowns",
      "Personalized masterclass recommendations linked to specific weak areas",
      "Structured 4-stage CPD pathway (Foundation → Practice → Advanced → Expert)"
    ]
  },
  {
    role: "Academic Supervisors & Inspectors",
    badge: "Inspection Level",
    color: "from-void to-obsidian",
    border: "border-brass/25",
    icon: (
      <svg className="w-6 h-6 text-brass" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    headline: "Rigorous Plagiarism & Integrity Auditing",
    points: [
      "2-Layer Plagiarism detection: MinHash n-grams + pgvector HNSW cosine similarity",
      "Flags cross-institutional lesson plan recycling and unoriginal copy-pasting",
      "One-click certified PDF evaluation dossiers ready for official inspections",
      "Real-time SSE notification stream alerting on suspicious similarity spikes"
    ]
  }
];

const DEMO_USERS = [
  {
    name: "Devansh Kumar",
    role: "Director of Supervision & Registrar",
    email: "devansh.kumar@rajasthan.edu.in",
    pass: "AdminPassword123!",
    badge: "Admin Access",
    initials: "DK",
    desc: "Full administrative controls, rubric creation, teacher roster, analytics."
  },
  {
    name: "Atharva Joshi",
    role: "Academic Dean & Evaluation Officer",
    email: "atharva.joshi@rajasthan.edu.in",
    pass: "AdminPassword123!",
    badge: "Admin Access",
    initials: "AJ",
    desc: "Curriculum oversight, quality audits, material catalog management."
  },
  {
    name: "Ayush Anand",
    role: "Senior PGT Physics (Jaipur Division)",
    email: "ayush.anand@rajasthan.edu.in",
    pass: "TeacherPassword123!",
    badge: "Teacher Portal",
    initials: "AA",
    desc: "Evaluated submission: Thermodynamics (Score: 88/100, Exceeds Standard)."
  },
  {
    name: "Gaurika Kaushik",
    role: "PGT English & Pedagogy (Kota Division)",
    email: "gaurika.kaushik@rajasthan.edu.in",
    pass: "TeacherPassword123!",
    badge: "Teacher Portal",
    initials: "GK",
    desc: "Evaluated submission: Hindi Literature & Heritage (Score: 95/100, Distinction)."
  },
  {
    name: "Satvik Kshatriya",
    role: "TGT Social Sciences & History (Bikaner)",
    email: "satvik.kshatriya@rajasthan.edu.in",
    pass: "TeacherPassword123!",
    badge: "Teacher Portal",
    initials: "SK",
    desc: "Evaluated submission: Indira Gandhi Canal System (Score: 92/100)."
  },
  {
    name: "Parth Shukla",
    role: "TGT Mathematics (Udaipur Division)",
    email: "parth.shukla@rajasthan.edu.in",
    pass: "TeacherPassword123!",
    badge: "Teacher Portal",
    initials: "PS",
    desc: "Live pipeline demo: Submission currently in AI Evaluation queue."
  }
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "1. Issue & Configure Rubrics",
    desc: "School administrators & deans define criteria, assign dynamic percentage weights (100% total), and issue curriculum tasks to teacher cohorts."
  },
  {
    step: "02",
    title: "2. Submit Lesson Plans & Telemetry",
    desc: "Teachers engage with CPD video training, review state pedagogical standards, and upload their detailed lesson plans (PDF/DOCX)."
  },
  {
    step: "03",
    title: "3. Dual-Pass AI Evaluation",
    desc: "Google Gemini parses submissions via multimodal OCR, generates 768-dim embeddings, cross-checks plagiarism, and performs dual-pass rubric scoring."
  },
  {
    step: "04",
    title: "4. Evidence Quotes & CPD Pathway",
    desc: "Results are sealed with verbatim citations, an interactive circular score ring, and auto-generated professional development modules."
  }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-void text-parchment font-jakarta relative selection:bg-burgundy selection:text-parchment overflow-hidden">
      
      {/* Background Gradients */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[900px] h-[900px] rounded-full bg-burgundy/10 blur-[160px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[900px] h-[900px] rounded-full bg-gold/5 blur-[160px]" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 px-8 py-5 border-b hairline bg-void/70 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3.5 group">
            <InstitutionSeal initials="RJ" className="w-10 h-10 text-gold" />
            <div className="flex flex-col">
              <span className="font-cinzel text-lg tracking-[0.12em] font-bold uppercase text-parchment leading-tight">
                EduSupervision
              </span>
              <span className="text-[9px] uppercase tracking-[0.24em] text-brass font-medium">
                Academic Registry & Supervision
              </span>
            </div>
          </Link>
          
          <div className="flex items-center gap-5">
            <a
              href="#who-it-is-for"
              className="hidden md:inline-block text-[10px] tracking-[0.22em] uppercase font-bold text-slate-400 hover:text-gold transition-colors"
            >
              Stakeholders
            </a>
            <a
              href="#how-it-works"
              className="hidden md:inline-block text-[10px] tracking-[0.22em] uppercase font-bold text-slate-400 hover:text-gold transition-colors"
            >
              How It Works
            </a>
            <a
              href="#demo-accounts"
              className="hidden md:inline-block text-[10px] tracking-[0.22em] uppercase font-bold text-brass hover:text-gold transition-colors"
            >
              Demo Logins
            </a>
            <div className="h-5 w-px bg-white/10 hidden md:block" />
            <Link
              href="/login"
              className="px-5 py-2 bg-gradient-to-r from-burgundy to-crimson border border-brass/30 text-parchment text-[10px] tracking-[0.22em] uppercase font-bold rounded-md hover:brightness-110 transition-all shadow-lg shadow-burgundy/20"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10">
        
        {/* HERO SECTION */}
        <section className="max-w-7xl mx-auto px-8 pt-20 pb-28 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-7">
            <div className="inline-flex items-center gap-2 border hairline rounded-full px-4 py-1.5 text-[10px] tracking-[0.24em] uppercase text-brass bg-obsidian/70">
              <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-dot" />
              National &amp; State Academic Supervision Platform
            </div>

            <h1 className="font-cinzel text-4xl sm:text-5xl md:text-6xl font-bold uppercase tracking-wide leading-[1.1] text-parchment">
              AI-Powered <br />
              <span className="text-gold">Academic Registry.</span> <br />
              <span className="font-playfair italic normal-case tracking-normal text-3xl sm:text-4xl md:text-5xl text-brass">
                Objective. Verbatim. Certified.
              </span>
            </h1>

            <p className="text-base text-slate-300 max-w-xl font-playfair leading-relaxed">
              EduSupervision is a state-grade digital supervision platform built for modern educational boards, 
              principals, and educators. It automates lesson plan grading through multi-stage LLM evaluation, 
              detects regional plagiarism with vector similarity, and awards continuous professional development (CPD) accreditation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-burgundy to-crimson border border-brass/30 text-parchment tracking-[0.15em] uppercase font-bold text-xs rounded-md shadow-xl shadow-burgundy/25 hover:brightness-110 transition-all"
              >
                Access Portal Login
              </Link>
              <a
                href="#demo-accounts"
                className="inline-flex items-center justify-center px-8 py-4 border hairline bg-obsidian/60 hover:bg-obsidian text-brass tracking-[0.15em] uppercase font-bold text-xs rounded-md transition-all"
              >
                View Demo Users ↓
              </a>
            </div>
          </div>

          {/* Right Visual Badge */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-md rounded-xl border hairline bg-obsidian p-7 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(350px 180px at 50% 0%, rgba(153,27,27,0.25), transparent 70%)" }} />
              
              <div className="flex items-center justify-between border-b hairline pb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <InstitutionSeal initials="RJ" size={44} />
                  <div>
                    <p className="font-cinzel text-xs font-bold text-parchment uppercase tracking-wide">Rajasthan Directorate</p>
                    <p className="text-[10px] text-brass uppercase tracking-widest">Registry № RAJ-2026-0417</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 px-2.5 py-1 rounded-full">
                  Ledger Verified
                </span>
              </div>

              {/* Sample AI Score Ring Preview */}
              <div className="rounded-lg border hairline bg-void/80 p-5 text-center relative z-10">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-3">Live Composite Evaluation Score</p>
                <div className="flex items-center justify-center gap-6">
                  <div>
                    <span className="font-cinzel text-5xl font-bold text-parchment leading-none">88</span>
                    <span className="text-slate-500 text-xs ml-1">/ 100</span>
                    <p className="font-cinzel text-lg text-brass mt-1">Grade A · Exceeds Standard</p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-3 italic font-playfair">
                  &ldquo;Objectives stated, modeled, and evidenced across 9 lesson segments with verbatim citations.&rdquo;
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left relative z-10 text-[11px]">
                <div className="border hairline-w bg-void/50 p-2.5 rounded-md">
                  <p className="text-slate-500 uppercase text-[9px] tracking-wider">Plagiarism Index</p>
                  <p className="font-cinzel text-base text-emerald-400 font-bold mt-0.5">12% · Clean</p>
                </div>
                <div className="border hairline-w bg-void/50 p-2.5 rounded-md">
                  <p className="text-slate-500 uppercase text-[9px] tracking-wider">CPD Credits</p>
                  <p className="font-cinzel text-base text-gold font-bold mt-0.5">+8 Hours Accrued</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST SIGNALS STRIP */}
        <section className="border-t border-b hairline bg-obsidian/40 py-12">
          <div className="max-w-7xl mx-auto px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/5">
              {TRUST_SIGNALS.map((s) => (
                <div key={s.label} className="flex flex-col gap-2 pl-8 first:pl-0 first:border-0">
                  <span className="font-cinzel text-3xl sm:text-4xl font-bold text-parchment">
                    {s.value}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-brass font-medium">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHO IS EDUSUPERVISION FOR? */}
        <section id="who-it-is-for" className="max-w-7xl mx-auto px-8 py-28 space-y-16">
          <div className="text-center space-y-3">
            <div className="text-[10px] uppercase tracking-[0.24em] text-brass font-bold">✦ Stakeholder Architecture</div>
            <h2 className="font-cinzel text-3xl sm:text-4xl font-bold uppercase text-parchment">
              Built For Every Tier of Educational Leadership
            </h2>
            <p className="text-sm text-slate-400 font-playfair max-w-2xl mx-auto leading-relaxed">
              EduSupervision provides dedicated, purpose-crafted interfaces for state regulators, school deans, teachers, and field inspection officers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {STAKEHOLDERS.map((st) => (
              <div
                key={st.role}
                className={`rounded-xl border ${st.border} bg-obsidian p-8 flex flex-col justify-between space-y-6 hover:border-brass/50 transition-all duration-300 relative overflow-hidden`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-lg bg-void border hairline flex items-center justify-center">
                      {st.icon}
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-brass bg-gold/10 border border-gold/25 px-3 py-1 rounded-full">
                      {st.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-cinzel text-xl font-bold text-parchment uppercase">
                      {st.role}
                    </h3>
                    <p className="text-xs text-brass font-medium mt-1">
                      {st.headline}
                    </p>
                  </div>

                  <ul className="space-y-2.5 pt-2">
                    {st.points.map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 font-playfair leading-relaxed">
                        <span className="text-gold mt-0.5 shrink-0">✦</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="border-t hairline bg-obsidian/30 py-28 px-8">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center space-y-3">
              <div className="text-[10px] uppercase tracking-[0.24em] text-brass font-bold">✦ End-to-End Workflow</div>
              <h2 className="font-cinzel text-3xl sm:text-4xl font-bold uppercase text-parchment">
                How EduSupervision Operates
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {HOW_IT_WORKS.map((h) => (
                <div
                  key={h.step}
                  className="rounded-xl border hairline bg-void p-6 flex flex-col justify-between space-y-4"
                >
                  <span className="font-cinzel text-3xl font-bold text-burgundy">
                    {h.step}
                  </span>
                  <div>
                    <h3 className="font-cinzel text-sm font-bold uppercase text-parchment mb-2">
                      {h.title}
                    </h3>
                    <p className="text-xs text-slate-400 font-playfair leading-relaxed">
                      {h.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DEMO ACCOUNTS SHOWCASE */}
        <section id="demo-accounts" className="max-w-7xl mx-auto px-8 py-28 space-y-12">
          <div className="text-center space-y-3">
            <div className="text-[10px] uppercase tracking-[0.24em] text-gold font-bold">✦ Instant Sandbox Testing</div>
            <h2 className="font-cinzel text-3xl sm:text-4xl font-bold uppercase text-parchment">
              Pre-Configured Demo Accounts
            </h2>
            <p className="text-sm text-slate-400 font-playfair max-w-xl mx-auto">
              Sign in immediately with any of these pre-seeded administrator or educator profiles to experience the live platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DEMO_USERS.map((u) => (
              <div
                key={u.email}
                className="rounded-xl border hairline bg-obsidian p-6 space-y-4 flex flex-col justify-between hover:border-gold/40 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-md bg-gradient-to-br from-burgundy to-crimson border hairline flex items-center justify-center font-cinzel text-brass font-bold text-sm">
                      {u.initials}
                    </div>
                    <span className="text-[9px] uppercase font-bold tracking-wider text-brass bg-gold/10 border border-gold/25 px-2.5 py-0.5 rounded-full">
                      {u.badge}
                    </span>
                  </div>

                  <h3 className="font-cinzel text-base font-bold text-parchment">
                    {u.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {u.role}
                  </p>
                  <p className="text-xs text-slate-500 font-playfair mt-2">
                    {u.desc}
                  </p>
                </div>

                <div className="border-t hairline-w pt-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] uppercase tracking-wider">Email:</span>
                    <code className="text-parchment font-mono text-[11px] bg-void px-2 py-0.5 rounded border hairline-w select-all">{u.email}</code>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] uppercase tracking-wider">Password:</span>
                    <code className="text-brass font-mono text-[11px] bg-void px-2 py-0.5 rounded border hairline-w select-all">{u.pass}</code>
                  </div>
                  <Link
                    href="/login"
                    className="block text-center mt-3 w-full py-2 bg-void hover:bg-white/5 border hairline text-brass text-[10px] uppercase tracking-widest font-bold rounded transition-colors"
                  >
                    Log In as {u.name.split(" ")[0]} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="max-w-7xl mx-auto px-8 pb-32">
          <div className="rounded-xl border hairline bg-obsidian p-14 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-burgundy/15 to-transparent pointer-events-none" />
            
            <div className="max-w-2xl mx-auto space-y-6 relative z-10">
              <InstitutionSeal initials="RJ" size={64} className="mx-auto" />
              <h2 className="font-cinzel text-3xl sm:text-4xl font-bold uppercase text-parchment leading-tight">
                Empower State Educators. <br />
                <span className="text-gold">Elevate Classroom Excellence.</span>
              </h2>
              <p className="text-sm text-slate-300 font-playfair leading-relaxed">
                Experience transparent, rubric-calibrated evaluation powered by Google Gemini AI and state educational standards.
              </p>
              
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex px-8 py-4 bg-gradient-to-r from-burgundy to-crimson border border-brass/30 text-parchment tracking-[0.18em] uppercase font-bold text-xs rounded-md shadow-xl shadow-burgundy/30 hover:brightness-110 transition-all"
                >
                  Enter Academic Console
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t hairline bg-void py-10 px-8 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <InstitutionSeal initials="RJ" size={28} />
            <div>
              <span className="font-cinzel text-xs tracking-[0.15em] font-bold uppercase text-parchment">
                EduSupervision
              </span>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest">Rajasthan Academic Supervision Registry</p>
            </div>
          </div>

          <p className="text-[10px] tracking-[0.2em] uppercase font-bold text-slate-500">
            &copy; {new Date().getFullYear()} Rajasthan Directorate of School Education · Built for NEP 2020.
          </p>
        </div>
      </footer>
    </div>
  );
}
