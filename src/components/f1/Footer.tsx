import { Link } from "@tanstack/react-router";
import { Instagram, Linkedin, ShieldCheck } from "lucide-react";
import { EVENT } from "@/lib/event-config";

export function SiteFooter() {
  return (
    <footer className="relative border-t border-border/80 bg-background/95 backdrop-blur-xs">
      {/* Top Chequered Trim */}
      <div className="checkers h-1.5 w-full opacity-80" aria-hidden />

      {/* Interactive / Animated F1 Track & Racecar animation */}
      <div className="relative w-full overflow-hidden bg-black/40 py-3 border-b border-border/40">
        {/* Track asphalt grid lines */}
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px)] bg-[size:24px_100%]" />
        
        {/* Start Line */}
        <div className="absolute left-4 top-0 bottom-0 flex flex-col justify-between py-1 z-10">
          <div className="text-[9px] font-mono tracking-widest text-muted-foreground/60 uppercase">START</div>
          <div className="w-1.5 h-full bg-linear-to-b from-red-600 via-white to-red-600 rounded-xs opacity-70" />
        </div>

        {/* Finish Line (Chequered Flag) */}
        <div className="absolute right-4 top-0 bottom-0 flex items-center gap-1.5 z-10">
          <div className="checkers h-full w-4 rounded-xs opacity-90 shadow-xs shadow-white/20" />
          <span className="text-[10px] font-display font-bold italic tracking-wider text-primary uppercase hidden sm:inline-block">
            FINISH
          </span>
        </div>

        {/* Racecar track route */}
        <div className="relative mx-auto max-w-6xl px-12 h-8 flex items-center">
          {/* Track kerb lines */}
          <div className="absolute inset-x-12 h-[2px] bg-linear-to-r from-red-600/30 via-white/20 to-red-600/30 top-1" />
          <div className="absolute inset-x-12 h-[2px] bg-linear-to-r from-red-600/30 via-white/20 to-red-600/30 bottom-1" />
          <div className="absolute inset-x-12 h-[1px] border-t border-dashed border-white/20 top-1/2 -translate-y-1/2" />

          {/* Animated F1 Racecar reaching its endpoint */}
          <div className="relative w-full h-full flex items-center">
            <div className="animate-[f1Drive_6s_cubic-bezier(0.4,0,0.2,1)_infinite] flex items-center gap-1">
              {/* Speed / Flame Exhaust Trail */}
              <div className="h-1.5 w-8 rounded-l-full bg-linear-to-r from-transparent via-amber-500/60 to-red-600 animate-pulse" />
              
              {/* F1 Car SVG */}
              <svg
                className="w-10 h-6 text-primary drop-shadow-[0_0_8px_rgba(225,6,0,0.8)] transition-transform"
                viewBox="0 0 64 32"
                fill="currentColor"
              >
                {/* Rear Wing */}
                <path d="M4 8h6v10H4z" fill="#e10600" />
                <path d="M2 6h10v3H2z" fill="#ffffff" />
                
                {/* Car Chassis Body */}
                <path d="M8 14h28l14 2 10 2v3H8z" fill="#e10600" />
                <path d="M16 12h14l8 4H16z" fill="#111111" />
                
                {/* Cockpit & Driver Halo */}
                <path d="M22 10h8v4h-8z" fill="#e10600" />
                <circle cx="27" cy="11" r="2.5" fill="#ffffff" />
                
                {/* Front Nose & Wing */}
                <path d="M46 16l14 2v2H46z" fill="#e10600" />
                <path d="M56 16h6v5h-6z" fill="#ffffff" />

                {/* Wheels */}
                <circle cx="14" cy="21" r="5" fill="#18181b" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="14" cy="21" r="2" fill="#e10600" />
                <circle cx="48" cy="21" r="5" fill="#18181b" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="48" cy="21" r="2" fill="#e10600" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Container */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          
          {/* Club Info & Credits */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="font-display font-black tracking-widest text-sm uppercase text-foreground">
                {EVENT.club}
              </span>
              <span className="h-3 w-[1px] bg-border" />
              <span className="text-xs text-muted-foreground font-mono">AWS Cloud Club</span>
            </div>
            <p className="text-xs text-muted-foreground">
              This website was made with 💜 by{" "}
              <a
                href="https://github.com/N-PCs/AWS-F1-Screening"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary italic hover:underline transition-colors"
              >
                N-PCs
              </a>{" "}
              & Tech Team
            </p>
          </div>

          {/* Right Controls: Social Links & Organiser Access */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 border-t sm:border-t-0 border-border/50 pt-4 sm:pt-0">
            {/* Social Media Links */}
            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/aws_vitb/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Official Instagram"
                className="group flex items-center gap-2 rounded-md border border-border/80 bg-secondary/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/50 hover:bg-secondary hover:text-foreground hover:shadow-xs"
              >
                <Instagram className="h-4 w-4 text-pink-500 transition-transform group-hover:scale-110" />
                <span>Instagram</span>
              </a>

              <a
                href="https://www.linkedin.com/company/aws-vitb/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Official LinkedIn"
                className="group flex items-center gap-2 rounded-md border border-border/80 bg-secondary/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-blue-500/50 hover:bg-secondary hover:text-foreground hover:shadow-xs"
              >
                <Linkedin className="h-4 w-4 text-blue-500 transition-transform group-hover:scale-110" />
                <span>LinkedIn</span>
              </a>
            </div>

            <div className="hidden sm:block h-4 w-[1px] bg-border" />

            {/* Organiser Access Link */}
            <Link
              to="/admin"
              className="group flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
              <span>Organiser access</span>
            </Link>
          </div>

        </div>

        {/* Bottom Legal / Copyright Bar */}
        <div className="mt-6 border-t border-border/40 pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-muted-foreground/70 gap-2 font-mono">
          <p>© {new Date().getFullYear()} {EVENT.club}. All rights reserved.</p>
          <p className="tracking-wide">LIGHTS OUT • GRANDSTAND EXPERIENCE</p>
        </div>
      </div>
    </footer>
  );
}
