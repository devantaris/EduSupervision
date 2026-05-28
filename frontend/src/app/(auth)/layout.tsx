import React from "react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-stretch bg-background text-foreground font-sans relative select-none">
      
      {/* ══════════════════════════════════════════
          LEFT BRAND DOSSIER PANEL (DESKTOP)
      ══════════════════════════════════════════ */}
      <aside className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative flex-col justify-between overflow-hidden border-hairline-r">
        {/* Deep sapphire-navy / amber organic backdrops */}
        <div aria-hidden="true" className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#05080f] via-background to-[#13110d]" />
          <div
            className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-[0.08] animate-drift-organic blur-[100px]"
            style={{
              background: "radial-gradient(circle, var(--accent-copper) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full opacity-[0.06] animate-drift-organic-slow blur-[80px]"
            style={{
              background: "radial-gradient(circle, var(--accent-amber) 0%, transparent 70%)",
            }}
          />
          {/* Fine structural grid lines */}
          <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,var(--accent-gold)_1px,transparent_1px),linear-gradient(to_bottom,var(--accent-gold)_1px,transparent_1px)] bg-[size:30px_30px]" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-12 xl:p-16">
          
          {/* Top Header Logo */}
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <span className="font-serif-display text-xl tracking-widest font-black uppercase text-gold group-hover:text-white transition-colors duration-300">
              EduSupervision
            </span>
          </Link>

          {/* Center Brand Dossier */}
          <div className="space-y-10 my-auto">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 border-hairline bg-amber-950/10 rounded px-2.5 py-1 text-[9px] tracking-widest uppercase text-gold animate-float-elastic">
                <span className="h-1.5 w-1.5 rounded-full bg-flame animate-pulse" />
                Ministerial Credentialing
              </div>

              <h2 className="font-serif text-3xl xl:text-4xl font-black uppercase tracking-tight leading-[1.05] text-white">
                Rethinking <br />
                <span className="gradient-text-flame font-sans font-extrabold normal-case tracking-tight">Academic Supervision</span> <br />
                As a Core Metric.
              </h2>

              <p className="text-slate-400 text-xs xl:text-sm font-light leading-relaxed max-w-sm">
                Statistical records, immutable vector indexes, and high-frequency content telemetry. 
                Purpose-built infrastructure for modern state supervision.
              </p>
            </div>

            {/* Micro Asymmetrical Stats Table */}
            <div className="grid grid-cols-2 gap-4 border-t border-b border-hairline py-8">
              {[
                { value: "500+", label: "Educators" },
                { value: "98%", label: "LLM Precision" },
                { value: "30s", label: "Telemetry Sync" },
                { value: "SOC2", label: "Security Compliant" },
              ].map((stat, idx) => (
                <div
                  key={stat.label}
                  className={`flex flex-col gap-1 ${idx % 2 === 0 ? 'pr-4 border-hairline-r' : 'pl-4'}`}
                >
                  <div className="font-serif text-xl font-bold text-gold">
                    {stat.value}
                  </div>
                  <div className="text-[8px] uppercase tracking-widest text-slate-500 font-black">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Testimonial */}
          <blockquote className="border-l border-flame/50 pl-4 space-y-2 max-w-sm">
            <p className="text-slate-400 text-xs italic leading-relaxed font-light">
              &ldquo;EduSupervision transformed how we track professional development across our district. 
              The automated AI grading alone saved our administration hundreds of workload hours.&rdquo;
            </p>
            <footer className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">
              — Dr. Maria Chen, Director of Curriculum, Lakeside USD
            </footer>
          </blockquote>
        </div>
      </aside>

      {/* ══════════════════════════════════════════
          RIGHT FORM PANEL (GLASS CARD OVERLAY)
      ══════════════════════════════════════════ */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-12 relative bg-background">
        
        {/* Subtle dot overlay */}
        <div aria-hidden="true" className="absolute inset-0 opacity-[0.01] bg-[radial-gradient(var(--accent-gold)_1px,transparent_0)] bg-[size:24px_24px]" />
        
        {/* Background glow orb */}
        <div aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-950/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-lg space-y-6">
          
          {/* Mobile-only logo header */}
          <div className="lg:hidden text-center mb-10 space-y-2">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="font-serif-display text-2xl tracking-widest font-black uppercase text-gold">
                EduSupervision
              </span>
            </Link>
            <p className="text-[10px] tracking-widest uppercase font-bold text-slate-500">
              AI-Powered Teacher Training &amp; Supervision
            </p>
          </div>

          {/* The Portal Glass Card */}
          <div className="atelier-glass p-8 sm:p-10 shadow-2xl relative">
            {/* Corner structural highlights */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gold/40" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-gold/40" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-gold/40" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gold/40" />
            
            {children}
          </div>

          <p className="text-center text-[9px] uppercase tracking-widest text-slate-600 font-bold">
            &copy; {new Date().getFullYear()} EduSupervision. Institutional Grade.
          </p>
        </div>
      </main>
    </div>
  );
}
