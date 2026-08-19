import { Link } from "@tanstack/react-router";
import { Instagram, Linkedin, ShieldCheck } from "lucide-react";
import { EVENT } from "@/lib/event-config";

export function SiteFooter() {
  return (
    <footer className="relative border-t border-border/80 bg-background/95 backdrop-blur-xs">
      {/* Top Chequered Trim */}
      <div className="  h-1.5 w-full opacity-80" aria-hidden />

      {/* Interactive / Animated Full-Width F1 Track & Racecar animation */}
      <div className="relative w-full overflow-hidden bg-black/60 py-4 border-b border-border/40">
        {/* Track asphalt grid lines */}
        <div className="absolute inset-0 opacity-25 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px)] bg-[size:28px_100%]" />

        {/* Full-width Racecar track container */}
        <div className="relative w-full h-12 flex items-center px-4 sm:px-8">

          {/* Road Asphalt Background Strip (Attached from START to FINISH) */}
          <div className="absolute inset-x-4 sm:inset-x-8 top-1/2 -translate-y-1/2 h-9 bg-zinc-900/90 rounded-xs border border-zinc-800 shadow-inner" />

          {/* Track kerb lines (Top & Bottom Red/White borders attached end-to-end) */}
          <div className="absolute inset-x-4 sm:inset-x-8 h-[3px] bg-[repeating-linear-gradient(90deg,#e10600,#e10600_12px,#ffffff_12px,#ffffff_24px)] top-1 z-10" />
          <div className="absolute inset-x-4 sm:inset-x-8 h-[3px] bg-[repeating-linear-gradient(90deg,#e10600,#e10600_12px,#ffffff_12px,#ffffff_24px)] bottom-1 z-10" />

          {/* Track Center Dashed White Line */}
          <div className="absolute inset-x-4 sm:inset-x-8 h-[1px] border-t border-dashed border-white/40 top-1/2 -translate-y-1/2 z-10" />

          {/* START Line (Attached at the left edge of the road) */}
          <div className="absolute left-4 sm:left-8 top-1 bottom-1 flex items-center z-20">
            <div className="h-full w-4 sm:w-5 bg-linear-to-b from-red-600 via-white to-red-600 border-x border-black/50 shadow-[0_0_10px_rgba(255,255,255,0.6)] flex items-center justify-center">
              <span className="text-[10px] sm:text-xs font-mono font-black text-black rotate-90 tracking-wider">
                START
              </span>
            </div>
          </div>

          {/* FINISH Line (Attached at the right edge of the road with vertical text) */}
          <div className="absolute right-4 sm:right-8 top-1 bottom-1 flex items-center gap-1 z-20">
            <div className="checkers h-full w-6 sm:w-6 border border-white/40 shadow-md shadow-white/30" />
            <div className="h-full w-4 sm:w-5 bg-white border-x border-black/50 shadow-[0_0_10px_rgba(255,255,255,0.6)] flex items-center justify-center">
              <span className="text-[9px] sm:text-[10px] font-mono font-black text-black rotate-90 tracking-widest uppercase">
                FINISH
              </span>
            </div>
          </div>

          {/* Animated F1 Racecar Path (Drives from START line through FINISH line) */}
          <div className="absolute left-4 sm:left-8 right-4 sm:right-8 h-full z-30 pointer-events-none overflow-hidden">
            <div className="f1-car-anim flex items-center gap-1">
              {/* Exhaust Flame & Speed Blur Trail */}
              <div className="h-2.5 w-14 rounded-l-full bg-linear-to-r from-transparent via-amber-500 to-red-600 animate-pulse shadow-[0_0_12px_rgba(225,6,0,0.9)]" />

              {/* Large Detailed F1 Car SVG */}
              <svg
                className="w-16 h-10 text-primary drop-shadow-[0_0_14px_rgba(225,6,0,1)] shrink-0"
                viewBox="0 0 64 32"
                fill="currentColor"
              >
                {/* Rear Wing */}
                <path d="M3 5h8v16H3z" fill="#e10600" />
                <path d="M0 3h14v4H0z" fill="#ffffff" />

                {/* Chassis Body */}
                <path d="M8 12h28l14 2 10 3v5H8z" fill="#e10600" />
                <path d="M16 10h14l8 4H16z" fill="#111111" />

                {/* Cockpit & Driver Helmet */}
                <path d="M22 8h8v6h-8z" fill="#e10600" />
                <circle cx="27" cy="9" r="3.5" fill="#ffffff" />
                <path d="M25 8h5v2h-5z" fill="#fbbf24" />

                {/* Front Nose & Wing */}
                <path d="M46 14l14 2v4H46z" fill="#e10600" />
                <path d="M54 14h10v7H54z" fill="#ffffff" />

                {/* Wheels (Pirelli Tyres) */}
                <circle cx="14" cy="22" r="6.5" fill="#09090b" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="14" cy="22" r="2.5" fill="#e10600" />
                <circle cx="48" cy="22" r="6.5" fill="#09090b" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="48" cy="22" r="2.5" fill="#e10600" />
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
            <div className="flex items-center">
              <img src="logo.png" style={{ height: "50px", width: "250px" }}></img>
            </div>
            <p className="text-xs text-muted-foreground">
              This website was made with ❤️ by{" "}
              <a
                href="https://github.com/N-PCs"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-white italic hover:underline transition-colors"
              >
                N-PCs
              </a>{"  "} X <a href="https://github.com/naiteekpapriwal"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-white italic hover:underline transition-colors"> Naiteek Papriwal</a>{" "}
              & Tech Team
            </p>
          </div>

          {/* Right Controls: Social Links & Organiser Access */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 border-t sm:border-t-0 border-border/50 pt-4 sm:pt-0">
            {/* Social Media Links */}
            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/awsbuilders.vitb/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Official Instagram"
                className="group flex items-center gap-2 rounded-md border border-border/80 bg-secondary/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/50 hover:bg-secondary hover:text-foreground hover:shadow-xs"
              >
                <Instagram className="h-4 w-4 text-pink-500 transition-transform group-hover:scale-110" />
                <span>Instagram</span>
              </a>

              <a
                href="https://www.linkedin.com/company/aws-cloud-club-vitbhopaluniveristy"
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
        <div className="mt-6 border-t border-border/40 pt-4 flex flex-col sm:flex-row items-center justify-center text-[11px] text-muted-foreground/70 gap-2 font-mono">
          <p>© {new Date().getFullYear()} {EVENT.club}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
