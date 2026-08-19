import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  Zap,
  Gauge,
  Clock,
  Flag,
  Trophy,
  Search,
  Sparkles,
  ChevronRight,
  RotateCcw,
  Sliders,
  Flame,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Play,
  Info,
  TrendingUp,
  Users,
  Layers,
} from "lucide-react";
import { EVENT } from "@/lib/event-config";

export const Route = createFileRoute("/f1")({
  head: () => ({
    meta: [
      { title: "F1 101 — Complete Formula 1 Guide | AWS SBG VITB" },
      {
        name: "description",
        content:
          "New to Formula 1? Master the race weekend format, telemetry, points system, tyre strategy, drivers, and jargon before the AWS SBG VITB Grand Prix screening.",
      },
      { property: "og:title", content: "F1 101 — Complete Formula 1 Guide" },
      {
        property: "og:description",
        content:
          "Interactive F1 beginner guide: Lights out simulator, race weekend format, telemetry breakdown, tyre strategy & jargon decoder.",
      },
    ],
  }),
  component: F1Page,
});
 


/* -------------------------------------------------------------------------- */
/* DATA DEFINITIONS                                                           */
/* -------------------------------------------------------------------------- */

const WEEKEND_STAGES = [
  {
    id: "friday",
    day: "Friday",
    title: "Practice 1 & 2 (FP1 & FP2)",
    subtitle: "Telemetry & Setup Calibration",
    badge: "2x 60 Min Sessions",
    description:
      "Drivers take to the track to gather aerodynamic data, test long-run tyre degradation, and dial in car setup. Nothing counts towards grid position yet — but timing screens reveal true race pace.",
    keyTakeaway: "Watch for fuel-heavy race simulation stints in FP2.",
    stats: [
      { label: "Track Time", value: "120 Mins" },
      { label: "Tyre Sets", value: "13 Dry Sets" },
      { label: "Grid Impact", value: "None" },
    ],
  },
  {
    id: "saturday",
    day: "Saturday",
    title: "Practice 3 + Knockout Qualifying",
    subtitle: "The Battle for Pole Position",
    badge: "3-Part Knockout",
    description:
      "After FP3, Qualifying kicks off in 3 high-intensity knockout segments. Q1 drops the 5 slowest drivers (P16–P20). Q2 drops another 5 (P11–P15). In Q3, the top 10 fight for Pole Position on minimal fuel and fresh Soft tyres.",
    keyTakeaway: "Q3 is absolute maximum attack on empty fuel tanks.",
    stats: [
      { label: "Q1 Drop", value: "Bottom 5" },
      { label: "Q2 Drop", value: "Bottom 5" },
      { label: "Q3 Prize", value: "Pole Position" },
    ],
  },
  {
    id: "sunday",
    day: "Sunday",
    title: "The Grand Prix Race",
    subtitle: "Lights Out & Wheel-to-Wheel Strategy",
    badge: "57 Laps · 308.5 km",
    description:
      "Five red lights illuminate, then go OUT. Drivers sprint into Turn 1 at 320+ km/h. Laps of wheel-to-wheel battles, mandatory pit stops, undercut calls over team radio, and 5G braking forces until the checkered flag.",
    keyTakeaway: "Mandatory pit stop using at least 2 distinct slick compounds.",
    stats: [
      { label: "Race Dist.", value: "~308.5 km" },
      { label: "Avg Pitstop", value: "2.3 - 2.8s" },
      { label: "Max Points", value: "25 + 1 FL" },
    ],
  },
];

const POINTS_SYSTEM = [
  { pos: "1st", pts: 25, badge: "Gold Podium", color: "from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/30" },
  { pos: "2nd", pts: 18, badge: "Silver Podium", color: "from-slate-300/20 to-slate-300/5 text-slate-300 border-slate-400/30" },
  { pos: "3rd", pts: 15, badge: "Bronze Podium", color: "from-amber-700/20 to-amber-700/5 text-amber-600 border-amber-700/30" },
  { pos: "4th", pts: 12, badge: "Points Zone", color: "bg-card border-border text-foreground" },
  { pos: "5th", pts: 10, badge: "Points Zone", color: "bg-card border-border text-foreground" },
  { pos: "6th", pts: 8, badge: "Points Zone", color: "bg-card border-border text-foreground" },
  { pos: "7th", pts: 6, badge: "Points Zone", color: "bg-card border-border text-foreground" },
  { pos: "8th", pts: 4, badge: "Points Zone", color: "bg-card border-border text-foreground" },
  { pos: "9th", pts: 2, badge: "Points Zone", color: "bg-card border-border text-foreground" },
  { pos: "10th", pts: 1, badge: "Final Point", color: "bg-card border-border text-foreground" },
];

const TYRE_COMPOUNDS = [
  {
    id: "soft",
    name: "Soft Compound (C4/C5)",
    stripe: "bg-red-500",
    textCol: "text-red-400",
    bgGradient: "from-red-500/20 via-red-950/10 to-transparent",
    borderColor: "border-red-500/40",
    pace: "Maximum Speed (10/10)",
    durability: "Low (15-22 Laps)",
    grip: "Peak Sticky Mechanical Grip",
    usage: "Qualifying Q3 & Aggressive Sprint Stints",
  },
  {
    id: "medium",
    name: "Medium Compound (C3)",
    stripe: "bg-yellow-400",
    textCol: "text-yellow-400",
    bgGradient: "from-yellow-500/20 via-yellow-950/10 to-transparent",
    borderColor: "border-yellow-500/40",
    pace: "Balanced Pace (8.5/10)",
    durability: "Medium (25-35 Laps)",
    grip: "Optimum Thermal Stability",
    usage: "Race Starting Tyre for Flexible Strategy",
  },
  {
    id: "hard",
    name: "Hard Compound (C1/C2)",
    stripe: "bg-white",
    textCol: "text-zinc-200",
    bgGradient: "from-white/15 via-zinc-900/10 to-transparent",
    borderColor: "border-zinc-300/40",
    pace: "Consistent Durability (7/10)",
    durability: "High (35-50+ Laps)",
    grip: "Durable Low-Degradation Compound",
    usage: "Long One-Stop Race Stints",
  },
  {
    id: "inter",
    name: "Intermediate Compound",
    stripe: "bg-emerald-500",
    textCol: "text-emerald-400",
    bgGradient: "from-emerald-500/20 via-emerald-950/10 to-transparent",
    borderColor: "border-emerald-500/40",
    pace: "Damp Track Performance",
    durability: "Disperses 30L Water/Sec",
    grip: "Grooved Tread for Light Rain",
    usage: "Damp, Drying, or Light Shower Conditions",
  },
  {
    id: "wet",
    name: "Full Wet Compound",
    stripe: "bg-blue-500",
    textCol: "text-blue-400",
    bgGradient: "from-blue-500/20 via-blue-950/10 to-transparent",
    borderColor: "border-blue-500/40",
    pace: "Heavy Monsoon Tread",
    durability: "Disperses 85L Water/Sec",
    grip: "Deep Anti-Aquaplane Channels",
    usage: "Torrential Rain & Heavy Surface Standing Water",
  },
];

const GLOSSARY_ITEMS = [
  {
    term: "DRS (Drag Reduction System)",
    cat: "Tech & Aero",
    def: "An adjustable wing flap on the rear wing. When opened on marked straightaway zones (and within 1.0s of the car ahead), aerodynamic drag drops instantly, yielding a 10–12 km/h top-speed advantage for overtaking.",
  },
  {
    term: "Undercut",
    cat: "Strategy",
    def: "Pitting a lap or two BEFORE your rival to bolt on fresh tyres. Out-lap on cold fresh rubber is so fast that when the opponent pits a lap later, you leapfrog ahead of them on track.",
  },
  {
    term: "Overcut",
    cat: "Strategy",
    def: "Staying out longer on old tyres when cold fresh rubber takes multiple laps to warm up (or in changing weather), snatching track position while competitors struggle for tyre temperature.",
  },
  {
    term: "Box, Box",
    cat: "Team Radio",
    def: "The frantic radio message sent from the pit wall instructing the driver to enter the pitlane immediately on that lap for a tyre change.",
  },
  {
    term: "Safety Car (SC)",
    cat: "Race Control",
    def: "Deploys onto track after major crashes or debris. All cars form a queue behind the Mercedes AMG GT Black Series, closing up all race gaps and allowing 'cheap' pit stops.",
  },
  {
    term: "VSC (Virtual Safety Car)",
    cat: "Race Control",
    def: "Digital speed governor enforced on steering wheel dashes during minor track hazard cleanups. Drivers must reduce speed by 40% and hold mandatory target delta times.",
  },
  {
    term: "Pole Position",
    cat: "Qualifying",
    def: "Starting from P1 at the front of the 22-car grid on Sunday, earned by recording the fastest single flying lap in Saturday Q3.",
  },
  {
    term: "Parc Fermé",
    cat: "Regulations",
    def: "Strict lockdown rule enforced from Qualifying start through Sunday race start. Teams are forbidden from altering major aerodynamic setup or suspension settings.",
  },
  {
    term: "Purple Lap",
    cat: "Telemetry",
    def: "The absolute fastest sector or overall lap time set by ANY driver in the current session, rendered in glowing purple on official timing screens.",
  },
  {
    term: "Dirty Air",
    cat: "Aerodynamics",
    def: "Turbulent, chaotic wake trailing behind an F1 car. Following cars lose downforce and overheat front tyres when running within 1.5 seconds of a leading car.",
  },
  {
    term: "Slipstream / Tow",
    cat: "Aerodynamics",
    def: "Tucking directly behind a high-speed car down long straights. The leading car punches a hole in the air, allowing the trailing car to accelerate faster with reduced drag.",
  },
  {
    term: "Delta Time",
    cat: "Telemetry",
    def: "The exact millisecond time gap comparing a driver's live lap performance against their benchmark personal best or safety car delta requirements.",
  },
];

const FEATURED_DRIVERS = [
  { name: "Lando NORRIS", team: "McLaren", num: "4", image: "/drivers/landonorris.avif", color: "from-amber-500/20 text-amber-400" },
  { name: "Max VERSTAPPEN", team: "Red Bull Racing", num: "1", image: "/drivers/maxversteppen.avif", color: "from-blue-600/20 text-blue-400" },
  { name: "Charles LECLERC", team: "Ferrari", num: "16", image: "/drivers/charlesleclerc.avif", color: "from-red-600/20 text-red-400" },
  { name: "Lewis HAMILTON", team: "Ferrari", num: "44", image: "/drivers/lewishamilton.avif", color: "from-red-600/20 text-red-400" },
  { name: "George RUSSELL", team: "Mercedes", num: "63", image: "/drivers/georgerussell.avif", color: "from-emerald-500/20 text-emerald-400" },
  { name: "Oscar PIASTRI", team: "McLaren", num: "81", image: "/drivers/oscarpiastri.avif", color: "from-amber-500/20 text-amber-400" },
];

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                                                             */
/* -------------------------------------------------------------------------- */

function F1Page() {
  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Background Cyber Grid */}
      <div
        className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"
        aria-hidden
      />

      {/* Hero Section */}
      <HeroHeader />

      {/* Interactive Lights Out Reaction Game */}
      <section className="relative mx-auto max-w-6xl px-4 py-8">
        <LightsOutSimulator />
      </section>

      {/* Race Weekend Blueprint (Tabs & Pit Stop Visuals) */}
      <section className="relative border-t border-border bg-card/20 py-16">
        <WeekendBreakdown />
      </section>

      {/* Telemetry & Circuit Profile (Featuring public/random/italiangrandprix.svg) */}
      <section className="relative mx-auto max-w-6xl px-4 py-16">
        <CircuitTelemetrySection />
      </section>

      {/* Interactive Tyre Strategy Visualizer */}
      <section className="relative border-t border-border bg-card/30 py-16">
        <TyreStrategySection />
      </section>

      {/* Points System & Championship Simulator */}
      <section className="relative mx-auto max-w-6xl px-4 py-16">
        <PointsCalculatorSection />
      </section>

      {/* Drivers & Grid Preview */}
      <section className="relative border-t border-border bg-card/20 py-16">
        <DriversPreviewSection />
      </section>

      {/* Searchable F1 Jargon Decoder */}
      <section className="relative mx-auto max-w-6xl px-4 py-16">
        <JargonDecoderSection />
      </section>

      {/* Final Event Call To Action */}
      <section className="relative border-t border-border py-16">
        <FinalCTASection />
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* HERO HEADER                                                                */
/* -------------------------------------------------------------------------- */

function HeroHeader() {
  return (
    <header className="relative overflow-hidden border-b border-border bg-linear-to-b from-background via-background/95 to-card/40 py-16 lg:py-24">
      {/* Red Ambient Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl opacity-70" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-12">
        <div className="lg:col-span-7">

          {/* Spain arrival kicker */}
          <p className="flex flex-wrap items-center gap-2.5 text-xs font-bold uppercase tracking-[0.35em]">
             <span className="text-amber-400">¡Bienvenidos a Madrid!</span>
           </p>

          <h1 className="mt-3 text-4xl font-extrabold uppercase tracking-tight sm:text-5xl lg:text-6xl">
 <span className="bg-gradient-to-r from-primary via-red-500 to-amber-500 bg-clip-text text-transparent">F1 101 Handbook</span>
          </h1>

          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg leading-relaxed">
            Zero experience required. 22 high-tech race cars, 1000+ hybrid horsepower, 340 km/h wheel-to-wheel battles, and strategic pit stop masterclasses. Here is everything you need to know before the <span className="font-semibold text-foreground">{EVENT.venue}</span> screening!
          </p>

          {/* Quick Stat Badges */}
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-lg">
            <div className="rounded-md border border-white/10 bg-white/5 p-3 backdrop-blur-xs">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider">
                <Gauge className="h-3.5 w-3.5 text-primary" /> Top Speed
              </div>
              <p className="mt-1 text-xl font-bold">340 km/h</p>
            </div>
            <div className="rounded-md border border-white/10 bg-white/5 p-3 backdrop-blur-xs">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider">
                <Clock className="h-3.5 w-3.5 text-primary" /> Pit Stop
              </div>
              <p className="mt-1 text-xl font-bold">1.80 sec</p>
            </div>
            <div className="rounded-md border border-white/10 bg-white/5 p-3 backdrop-blur-xs">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider">
                <Flame className="h-3.5 w-3.5 text-primary" /> Braking Drop
              </div>
              <p className="mt-1 text-xl font-bold">340→80 km/h</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#lights-out-game"
              className="inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25"
            >
              <Zap className="h-4 w-4" /> Test Reaction Speed
            </a>
            <Link
              to="/book"
              className="inline-flex items-center gap-2 rounded-sm border border-border bg-card px-6 py-3 text-sm font-bold uppercase tracking-wider text-foreground transition-all hover:bg-secondary"
            >
              Book Screening Seats <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Hero Card Image Showcase (Using public/random/random4.jpeg & public/random1.avif) */}
        <div className="relative lg:col-span-5">
          <div className="relative overflow-hidden rounded-md border border-white/15 bg-card/60 p-2 shadow-2xl shadow-primary/10">
            <div className="relative aspect-4/3 overflow-hidden">
              <img
                src="/random/madringlogo.jpg"
                alt="Formula 1 car driving at ultra high speed"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              <div className="absolute bottom-3 left-3 right-3 rounded-sm border border-white/10 bg-black/60 p-3 backdrop-blur-md">
                <div className="flex items-center justify-center gap-2 text-xs text-zinc-300">
                   <span className="flex items-center gap-1.5 font-semibold text-primary uppercase tracking-widest">
                    <span>Madrid </span>
                  </span>                
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* LIGHTS OUT REACTION SIMULATOR                                              */
/* -------------------------------------------------------------------------- */

function LightsOutSimulator() {
  const [gameState, setGameState] = useState<"idle" | "ready" | "waiting" | "go" | "jumpstart" | "finished">("idle");
  const [lightsLit, setLightsLit] = useState<number>(0);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(null);

  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lightsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startSequence = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (lightsIntervalRef.current) clearInterval(lightsIntervalRef.current);

    setGameState("ready");
    setLightsLit(0);
    setReactionTime(null);

    let count = 0;
    lightsIntervalRef.current = setInterval(() => {
      count++;
      setLightsLit(count);
      if (count === 5) {
        if (lightsIntervalRef.current) clearInterval(lightsIntervalRef.current);
        setGameState("waiting");
        
        // Random delay between 1.5s and 4.0s before lights go OUT!
        const randomDelay = Math.floor(Math.random() * 2500) + 1500;
        timerRef.current = setTimeout(() => {
          setLightsLit(0);
          setGameState("go");
          startTimeRef.current = performance.now();
        }, randomDelay);
      }
    }, 1000);
  };

  const handlePadClick = () => {
    if (gameState === "idle" || gameState === "finished" || gameState === "jumpstart") {
      startSequence();
    } else if (gameState === "ready" || gameState === "waiting") {
      // Jump start error!
      if (timerRef.current) clearTimeout(timerRef.current);
      if (lightsIntervalRef.current) clearInterval(lightsIntervalRef.current);
      setGameState("jumpstart");
    } else if (gameState === "go") {
      const elapsed = Math.round(performance.now() - startTimeRef.current);
      setReactionTime(elapsed);
      setGameState("finished");
      if (bestTime === null || elapsed < bestTime) {
        setBestTime(elapsed);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (lightsIntervalRef.current) clearInterval(lightsIntervalRef.current);
    };
  }, []);

  const getVerdict = (time: number) => {
    if (time < 180) return { text: "GODLIKE! (Verstappen / Hamilton Level)", color: "text-emerald-400" };
    if (time < 260) return { text: "EXCELLENT! Ready for F1 Grid", color: "text-amber-400" };
    if (time < 350) return { text: "DECENT! Average Road Driver", color: "text-blue-400" };
    return { text: "TOO SLOW! You lost 4 grid positions into T1", color: "text-red-400" };
  };

  return (
    <div id="lights-out-game" className="overflow-hidden rounded-md border border-primary/30 bg-card/60 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
            <Zap className="h-4 w-4" /> Interactive Driver Test
          </div>
          <h2 className="mt-1 text-2xl font-bold uppercase sm:text-3xl">
            5 Red Lights Reaction Test
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Wait for all 5 red lights to turn on, then TAP as fast as possible when lights go OUT!
          </p>
        </div>

        {bestTime !== null && (
          <div className="flex items-center gap-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-amber-400">
            <Trophy className="h-5 w-5" />
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider opacity-80">Personal Best</p>
              <p className="font-mono text-lg font-extrabold">{bestTime} ms</p>
            </div>
          </div>
        )}
      </div>

      {/* Light Gantry Graphics */}
      <div className="my-8 flex justify-center">
        <div className="flex items-center gap-2 sm:gap-4 rounded-md border border-zinc-700 bg-zinc-950 p-4 shadow-inner">
          {[1, 2, 3, 4, 5].map((index) => {
            const isLit = lightsLit >= index;
            return (
              <div
                key={index}
                className="flex flex-col gap-2 rounded-md border border-zinc-800 bg-zinc-900 p-2.5 sm:p-3"
              >
                <div
                  className={`h-7 w-7 sm:h-10 sm:w-10 rounded-full transition-all duration-200 ${
                    isLit
                      ? "bg-red-600 shadow-[0_0_25px_#ef4444]"
                      : "bg-zinc-800/80 border border-zinc-700/50"
                  }`}
                />
                <div
                  className={`h-7 w-7 sm:h-10 sm:w-10 rounded-full transition-all duration-200 ${
                    isLit
                      ? "bg-red-600 shadow-[0_0_25px_#ef4444]"
                      : "bg-zinc-800/80 border border-zinc-700/50"
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Click Area */}
      <div className="text-center">
        <button
          onClick={handlePadClick}
          className={`group relative w-full overflow-hidden rounded-sm border p-8 font-bold uppercase tracking-wider transition-all duration-200 active:scale-[0.99] ${
            gameState === "idle" || gameState === "finished" || gameState === "jumpstart"
              ? "border-primary/50 bg-primary/10 hover:bg-primary/20 text-foreground"
              : gameState === "go"
              ? "border-emerald-500 bg-emerald-500/20 text-emerald-300 animate-pulse cursor-pointer"
              : "border-amber-500/50 bg-amber-500/10 text-amber-300 cursor-pointer"
          }`}
        >
          {gameState === "idle" && (
            <span className="flex items-center justify-center gap-2 text-base sm:text-lg">
              <Play className="h-5 w-5 text-primary" /> Click Here To Start Reaction Test
            </span>
          )}

          {(gameState === "ready" || gameState === "waiting") && (
            <span className="text-base sm:text-lg text-amber-300">
              STAY READY... WAIT FOR LIGHTS TO GO OUT! (CLICK WHEN DARK)
            </span>
          )}

          {gameState === "go" && (
            <span className="text-xl sm:text-2xl font-black text-emerald-400 tracking-widest">
              LIGHTS OUT! TAP NOW! TAP NOW!
            </span>
          )}

          {gameState === "jumpstart" && (
            <div className="space-y-1">
              <span className="text-lg text-red-400 font-extrabold">JUMP START! FALSE START PENALTY (+5 SEC)</span>
              <p className="text-xs text-muted-foreground">You tapped before the lights went out. Click to try again.</p>
            </div>
          )}

          {gameState === "finished" && reactionTime !== null && (
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-sm bg-black/40 px-4 py-1 text-sm font-mono text-zinc-300">
                Reaction Time: <span className="font-bold text-white text-lg">{reactionTime} ms</span>
              </div>
              <p className={`text-base sm:text-lg font-bold ${getVerdict(reactionTime).color}`}>
                {getVerdict(reactionTime).text}
              </p>
              <p className="text-xs text-muted-foreground pt-1">Click to attempt another launch</p>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* WEEKEND BREAKDOWN                                                          */
/* -------------------------------------------------------------------------- */

function WeekendBreakdown() {
  const [activeTab, setActiveTab] = useState<string>("saturday");

  const currentStage = useMemo(
    () => WEEKEND_STAGES.find((s) => s.id === activeTab) || WEEKEND_STAGES[1],
    [activeTab]
  );

  return (
    <div className="mx-auto max-w-6xl px-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h2 className="mt-1 text-3xl font-extrabold uppercase sm:text-4xl">
            How a Grand Prix Unfolds
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            3 days of intense tactical warfare. From setup calibration on Friday to 3-part knockout qualifying on Saturday and 57-lap, 308.5 km race distance on Sunday.
          </p>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="flex rounded-sm border border-border bg-card p-1">
          {WEEKEND_STAGES.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveTab(s.id)}
              className={`rounded-sm px-4 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all ${
                activeTab === s.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.day}
            </button>
          ))}
        </div>
      </div>

      {/* Active Stage Card */}
      <div className="relative mt-8 grid gap-8 lg:grid-cols-12 items-center overflow-hidden rounded-md border border-border bg-card p-6 lg:p-8">
        {/* Spanish tricolour accent bar */}
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-red-600 via-amber-400 to-red-600" aria-hidden="true" />
        <div className="lg:col-span-7 space-y-5">
          <div className="inline-flex items-center gap-2 rounded-sm bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary uppercase tracking-widest">
            {currentStage.badge}
          </div>

          <h3 className="text-2xl font-bold uppercase sm:text-3xl text-foreground">
            {currentStage.title}
          </h3>
          <p className="text-sm font-semibold text-primary">{currentStage.subtitle}</p>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {currentStage.description}
          </p>

          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-xs sm:text-sm text-amber-300 flex items-start gap-3">
            <Info className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase">Key Pro Insight: </span>
              {currentStage.keyTakeaway}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            {currentStage.stats.map((st) => (
              <div key={st.label} className="rounded-md border border-border bg-background/50 p-3">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase">{st.label}</p>
                <p className="mt-1 text-base font-bold text-foreground">{st.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Visual Image (Using public/random/carpitstop.jpeg) */}
        <div className="lg:col-span-5">
          <div className="relative overflow-hidden rounded-md border border-border shadow-xl">
            <img
              src="/random/carpitstop.jpeg"
              alt="Formula 1 pit stop crew changing tyres"
              className="h-64 w-full object-cover lg:h-80 transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 rounded-sm border border-white/10 bg-black/70 p-3 backdrop-blur-xs text-xs text-white">
              <p className="font-bold text-primary uppercase">Precision Pit Work</p>
              <p className="text-zinc-300 mt-0.5">20 pit crew mechanics swap 4 tyres in 2.3 seconds.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* CIRCUIT TELEMETRY SECTION (Featuring public/random/italiangrandprix.svg)   */
/* -------------------------------------------------------------------------- */

function CircuitTelemetrySection() {
  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Track Anatomy & Physics</p>
        <h2 className="mt-1 text-3xl font-extrabold uppercase sm:text-4xl">
          Anatomy of a Grand Prix Circuit
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Featuring the Madring — Madrid's brand-new 22-turn hybrid street circuit around IFEMA. Cars top 340 km/h down Ribera del Sena before sweeping through the 24%-banked La Monumental corner.
        </p>
      </div>

      <div className="relative grid gap-8 lg:grid-cols-12 items-center overflow-hidden rounded-md border border-border bg-card/50 p-6 lg:p-8 backdrop-blur-md">

        {/* SVG Track Graphic */}
        <div className="lg:col-span-6 flex justify-center relative group">
          <div className="relative w-full max-w-md overflow-hidden rounded-md border border-white/10 bg-zinc-950/80 p-6 shadow-inner">
            <img
              src="/madring.avif"
              alt="Spanish Grand Prix Madrid Madring Track Layout"
              className="h-auto w-full transition-transform duration-500"
            />
            
            {/* SVG Overlay Telemetry Badges */}
            <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-sm bg-red-600/20 border border-red-500/40 px-2.5 py-1 text-[11px] font-bold text-red-400 uppercase tracking-widest">
               Madring, Madrid
            </div>
            
            <div className="absolute bottom-4 right-4 rounded-sm bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 text-[11px] font-mono font-bold text-amber-400">
              5.416 km · 22 Corners
            </div>
          </div>
        </div>

        {/* Telemetry Breakdown Details */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-md border border-border bg-background p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase">
              <Zap className="h-4 w-4" /> DRS Speed Trap Zone
            </div>
            <p className="mt-1 text-sm font-semibold">Main Straight & Ribera del Sena</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Rear wing flap opens to shed drag. Cars rocket down the 837 m urban straight at up to 340 km/h — the fastest point of the lap.
            </p>
          </div>

          <div className="rounded-md border border-border bg-background p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase">
              <Flame className="h-4 w-4" /> Ultra-Heavy Braking
            </div>
            <p className="mt-1 text-sm font-semibold">Turn 5 Chicane</p>
            <p className="mt-1 text-xs text-muted-foreground">
              After the top-speed stretch, speed plummets from 340 km/h to just 80 km/h under the motorway overpass — the best overtaking spot on the track.
            </p>
          </div>

          <div className="rounded-md border border-border bg-background p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase">
              <TrendingUp className="h-4 w-4" /> Banked High-Speed Sweep
            </div>
            <p className="mt-1 text-sm font-semibold">La Monumental (Turn 12)</p>
            <p className="mt-1 text-xs text-muted-foreground">
              F1's longest banked corner — 548 m of 24% banking, taken near-flat out in front of 45,000 fans for roughly 6 seconds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* TYRE STRATEGY SECTION                                                      */
/* -------------------------------------------------------------------------- */

function TyreStrategySection() {
  const [selectedTyre, setSelectedTyre] = useState<string>("soft");

  const currentTyre = useMemo(
    () => TYRE_COMPOUNDS.find((t) => t.id === selectedTyre) || TYRE_COMPOUNDS[0],
    [selectedTyre]
  );

  return (
    <div className="mx-auto max-w-6xl px-4 space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Rubber & Strategy</p>
        <h2 className="mt-1 text-3xl font-extrabold uppercase sm:text-4xl">
          Tyres Decide Races
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Pirelli supplies 5 distinct tyre compounds. Every team MUST run at least two different dry compounds during a dry Grand Prix, forcing crucial pit stop strategy decisions.
        </p>
      </div>

      {/* Compound Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        {TYRE_COMPOUNDS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTyre(t.id)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
              selectedTyre === t.id
                ? `${t.borderColor} bg-card text-foreground shadow-lg scale-[1.02]`
                : "border-border bg-background/50 text-muted-foreground hover:bg-card hover:text-foreground"
            }`}
          >
            <span className={`h-3 w-3 rounded-full ${t.stripe}`} />
            {t.name.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Selected Tyre Detail Card */}
      <div className={`rounded-2xl border ${currentTyre.borderColor} bg-gradient-to-br ${currentTyre.bgGradient} p-6 lg:p-8 backdrop-blur-md`}>
        <div className="grid gap-8 lg:grid-cols-12 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-3">
              <span className={`h-5 w-5 rounded-full ${currentTyre.stripe} shadow-md`} />
              <h3 className={`text-2xl font-bold uppercase ${currentTyre.textCol}`}>
                {currentTyre.name}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Pace Output</p>
                <p className="mt-1 text-base font-bold text-white">{currentTyre.pace}</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Stint Longevity</p>
                <p className="mt-1 text-base font-bold text-white">{currentTyre.durability}</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mechanical Grip Profile</p>
              <p className="text-sm text-zinc-200">{currentTyre.grip}</p>
              
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider pt-2">Tactical Purpose</p>
              <p className="text-sm text-zinc-200">{currentTyre.usage}</p>
            </div>
          </div>

          {/* Visual Tyre Image Card */}
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-xl border border-white/15 bg-black/50 p-2 shadow-xl">
              <img
                src="/random/tyres.png"
                alt="Formula 1 Tyre Stacks and Racing Action"
                className="h-75 w-full rounded-lg object-cover"
              />
              <div className="p-3 text-center text-xs font-semibold text-zinc-300">
                Rule: Failing to use 2 different slick compounds results in instant Disqualification (DQ).
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* POINTS CALCULATOR SECTION                                                  */
/* -------------------------------------------------------------------------- */

function PointsCalculatorSection() {
  const [selectedPos, setSelectedPos] = useState<number>(0);
  const [hasFastestLap, setHasFastestLap] = useState<boolean>(true);

  const calculatedPoints = useMemo(() => {
    const base = POINTS_SYSTEM[selectedPos].pts;
    const bonus = hasFastestLap && selectedPos < 10 ? 1 : 0;
    return base + bonus;
  }, [selectedPos, hasFastestLap]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Championship Standings</p>
        <h2 className="mt-1 text-3xl font-extrabold uppercase sm:text-4xl">
          The Points System
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Top 10 drivers score world championship points. Plus 1 bonus point for the fastest lap of the race (if finishing P1–P10).
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Points Table */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-5 gap-3">
          {POINTS_SYSTEM.map((p, idx) => (
            <button
              key={p.pos}
              onClick={() => setSelectedPos(idx)}
              className={`rounded-xl border p-3 text-center transition-all ${p.color} ${
                selectedPos === idx ? "ring-2 ring-primary border-primary scale-[1.03]" : "hover:border-white/30"
              }`}
            >
              <p className="text-xs text-muted-foreground font-semibold">{p.pos}</p>
              <p className="text-xl font-bold mt-0.5">{p.pts} <span className="text-[10px] text-muted-foreground">pts</span></p>
            </button>
          ))}
        </div>

        {/* Interactive Points Calculator Card */}
        <div className="lg:col-span-5 rounded-2xl border border-primary/30 bg-card p-6 space-y-5 backdrop-blur-md shadow-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase">
            <Trophy className="h-4 w-4" /> Live Points Calculator
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">Selected Finishing Position</label>
            <p className="text-2xl font-bold text-foreground mt-1">
              {POINTS_SYSTEM[selectedPos].pos} Place ({POINTS_SYSTEM[selectedPos].pts} Pts)
            </p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-background p-3.5">
            <div>
              <p className="text-xs font-bold text-foreground uppercase">Fastest Lap Bonus Point</p>
              <p className="text-[11px] text-muted-foreground">Sets purple lap time & finishes top 10</p>
            </div>
            <input
              type="checkbox"
              checked={hasFastestLap}
              onChange={(e) => setHasFastestLap(e.target.checked)}
              className="h-5 w-5 accent-primary cursor-pointer rounded"
            />
          </div>

          <div className="border-t border-border pt-4 flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-muted-foreground">Total Race Points:</span>
            <span className="font-mono text-3xl font-extrabold text-primary">{calculatedPoints} PTS</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* DRIVERS & TEAMS PREVIEW                                                    */
/* -------------------------------------------------------------------------- */

function DriversPreviewSection() {
  return (
    <div className="mx-auto max-w-6xl px-4 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">The 2025/2026 Grid</p>
          <h2 className="mt-1 text-3xl font-extrabold uppercase sm:text-4xl">
            Who Are You Rooting For?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Get familiar with top Formula 1 drivers and world championship contender teams.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/drivers"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-secondary transition"
          >
            All 22 Drivers <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            to="/teams"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-secondary transition"
          >
            All 10 Teams <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {FEATURED_DRIVERS.map((d) => (
          <div
            key={d.name}
            className="group relative overflow-hidden rounded-xl border border-white/10 bg-card p-3 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
          >
            <div className="relative aspect-3/4 overflow-hidden rounded-lg bg-zinc-900">
              <img
                src={d.image}
                alt={d.name}
                className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute top-2 left-2 rounded-md bg-black/70 px-2 py-0.5 font-mono text-xs font-bold text-white">
                #{d.num}
              </div>
            </div>

            <div className="mt-2.5 text-center">
              <p className="text-xs font-bold text-foreground truncate">{d.name}</p>
              <p className="text-[10px] text-muted-foreground uppercase">{d.team}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SEARCHABLE JARGON DECODER                                                  */
/* -------------------------------------------------------------------------- */

function JargonDecoderSection() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCat, setSelectedCat] = useState<string>("All");

  const categories = ["All", "Strategy", "Tech & Aero", "Race Control", "Qualifying", "Telemetry"];

  const filteredGlossary = useMemo(() => {
    return GLOSSARY_ITEMS.filter((item) => {
      const matchesSearch =
        item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.def.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCat === "All" || item.cat === selectedCat;
      return matchesSearch && matchesCat;
    });
  }, [searchQuery, selectedCat]);

  return (
    <div className="space-y-8">
      <div>
         <h2 className="mt-1 text-3xl font-extrabold uppercase sm:text-4xl">
          Jargon Decoder
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Never feel lost when commentary mentions "Undercut", "Parc Fermé", or "Purple Lap".
        </p>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search F1 terms (e.g., DRS, Box, Undercut)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-sm border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Category Badges */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`rounded-sm px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                selectedCat === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Glossary Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredGlossary.map((g) => (
          <div
            key={g.term}
            className="rounded-md border border-border bg-card/60 p-5 space-y-2 transition-all hover:border-primary/40 hover:bg-card"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-primary text-base">{g.term}</h3>
              <span className="rounded-sm bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">
                {g.cat}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{g.def}</p>
          </div>
        ))}
      </div>

      {filteredGlossary.length === 0 && (
        <div className="rounded-md border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No F1 terms match your search. Try searching for "DRS" or "Box".
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* FINAL CTA SECTION (Featuring public/random3.avif)                         */
/* -------------------------------------------------------------------------- */

function FinalCTASection() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <div className="relative overflow-hidden rounded-md border border-primary/40 bg-card p-8 lg:p-12 shadow-2xl">
        {/* Background Image Overlay (Using public/random3.avif) */}
        <img
          src="/random3.avif"
          alt="Formula 1 Night Racing Action"
          className="absolute inset-0 h-full w-full object-cover opacity-20 filter blur-xs"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/50" />
        <div className="relative max-w-2xl space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 rounded-sm border border-primary/40 bg-primary/20 px-3.5 py-1 text-xs font-bold text-primary uppercase tracking-widest">
            <Flag className="h-3.5 w-3.5" /> ¡Olé! Race Day Experience
          </div>

          <h2 className="text-3xl font-extrabold uppercase sm:text-4xl text-foreground">
            Ready for Lights Out?
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Now that you know the weekend rules, DRS zones, tyre degradation strategies, and team radios — join us live at <span className="font-semibold text-foreground">{EVENT.venue}</span> to experience 500 fans screaming at every overtake, bullring-style!
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs font-bold text-zinc-300">
            <span>{EVENT.dateLabel}</span>
            <span>{EVENT.timeLabel}</span>
            <span>{EVENT.venue}, {EVENT.campus}</span>

          </div>

          <div className="pt-4">
            <Link
              to="/book"
              className="inline-flex items-center gap-2 rounded-sm bg-primary px-8 py-4 text-base font-extrabold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:bg-primary/90 hover:scale-[1.02]"
            >
              Book Your Screening Seat Now <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}