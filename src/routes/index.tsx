import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import heroImage from "@/assets/f1-hero.jpg";
import pitstopImage from "@/assets/f1-pitstop.jpg";
import lightsImage from "@/assets/f1-lights.jpg";
import tyresImage from "@/assets/f1-tyres.jpg";
import { EVENT } from "@/lib/event-config";
import { ROWS, TIERS, TOTAL_SEATS } from "@/lib/seat-layout";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "F1 Grand Prix Screening — AWS Club VITB, AB-02" },
      {
        name: "description",
        content:
          "Lights out at VIT Bhopal. AWS Club VITB screens the Formula 1 Grand Prix live in the AB-02 auditorium — 250 seats, tiered pricing from ₹99, book your seat now.",
      },
      { property: "og:title", content: "F1 Grand Prix Screening — AWS Club VITB" },
      {
        property: "og:description",
        content:
          "250 seats, big screen, full race weekend energy in AB-02. Pick your seat from ₹99.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div>
      <Hero />
      <Countdown />
      <RaceStrip />
      <Tiers />
      <Steps />
      <Gallery />
      <FinalCta />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <img
        src={heroImage}
        alt="Formula 1 car racing at speed under floodlights on a night circuit"
        width={1920}
        height={1088}
        className="absolute inset-0 h-full w-full object-cover opacity-70"
      />
      <div
        className="absolute inset-0 bg-linear-to-t from-background via-background/60 to-background/20"
        aria-hidden
      />
      <div className="relative mx-auto max-w-5xl px-4 py-24 sm:py-32">
        <div className="checkers h-2 w-28 opacity-90" aria-hidden />
        <p className="mt-6 text-xs font-bold tracking-[0.4em] text-primary uppercase">
          {EVENT.club} presents
        </p>
        <h1 className="font-display mt-3 text-4xl font-bold uppercase sm:text-6xl lg:text-7xl">
          {EVENT.title}
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
          Lights out on the big screen. {TOTAL_SEATS} seats, tiered like a real grandstand —
          the closer you sit, the louder the engines.
        </p>
        <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 text-sm">
          <Fact label="Date" value={EVENT.dateLabel} />
          <Fact label="Lights out" value={EVENT.timeLabel} />
          <Fact label="Venue" value={`${EVENT.venue}, ${EVENT.campus}`} />
          <Fact label="From" value="₹99" />
        </dl>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/book"
            className="rounded-sm bg-primary px-6 py-3 text-sm font-bold tracking-widest text-primary-foreground uppercase transition hover:brightness-110"
          >
            Book your seat
          </Link>
          <Link
            to="/f1"
            className="rounded-sm border border-border px-6 py-3 text-sm font-bold tracking-widest uppercase transition hover:bg-secondary"
          >
            New to F1? Start here
          </Link>
        </div>
      </div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}

const STRIP = [
  ["1000+ bhp", "Hybrid V6 turbo power units"],
  ["350 km/h", "Top speed on the long straights"],
  ["2.5 s", "A four-tyre pit stop"],
  ["5 G", "Cornering load on the drivers"],
] as const;

function RaceStrip() {
  return (
    <section className="speedlines border-b border-border">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 sm:grid-cols-4">
        {STRIP.map(([value, label]) => (
          <div key={value}>
            <p className="text-2xl font-bold text-primary">{value}</p>
            <p className="mt-1 text-xs tracking-widest text-muted-foreground uppercase">
              {label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

const SHOTS = [
  {
    src: lightsImage,
    alt: "Formula 1 starting lights glowing red above the grid",
    caption: "Five red lights, then silence breaks",
  },
  {
    src: pitstopImage,
    alt: "Pit crew changing tyres on a red Formula 1 car",
    caption: "Races won and lost in the pit box",
  },
  {
    src: tyresImage,
    alt: "Stack of Formula 1 slick tyres with coloured sidewall bands",
    caption: "Soft, medium, hard — strategy in rubber",
  },
];

function Gallery() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="text-2xl font-bold uppercase sm:text-3xl">Race day energy</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Big screen, big sound, and a room full of people shouting at pit strategy.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {SHOTS.map((shot) => (
          <figure
            key={shot.caption}
            className="overflow-hidden rounded-md border border-border bg-card"
          >
            <img
              src={shot.src}
              alt={shot.alt}
              width={1280}
              height={864}
              loading="lazy"
              className="h-44 w-full object-cover transition duration-300 hover:scale-105"
            />
            <figcaption className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
              {shot.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function useCountdown(target: string) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (now === null) return null;
  const diff = Math.max(0, new Date(target).getTime() - now);
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function Countdown() {
  const left = useCountdown(EVENT.startsAt);
  const cells: Array<[string, number | null]> = [
    ["days", left?.days ?? null],
    ["hrs", left?.hours ?? null],
    ["min", left?.minutes ?? null],
    ["sec", left?.seconds ?? null],
  ];
  return (
    <section className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-6 px-4 py-8">
        <h2 className="text-sm font-bold tracking-[0.3em] uppercase">Formation lap in</h2>
        <div className="flex gap-3">
          {cells.map(([label, value]) => (
            <div
              key={label}
              className="min-w-16 rounded-sm border border-border bg-background px-3 py-2 text-center"
            >
              <span className="block text-2xl font-bold tabular-nums">
                {value === null ? "--" : String(value).padStart(2, "0")}
              </span>
              <span className="text-[0.65rem] tracking-widest text-muted-foreground uppercase">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const TIER_ACCENT: Record<string, string> = {
  premium: "border-t-tier-premium",
  standard: "border-t-tier-standard",
  economy: "border-t-tier-economy",
};

function Tiers() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <h2 className="text-2xl font-bold uppercase sm:text-3xl">Pick your grandstand</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Rows are priced like a circuit: pole position up front, budget seats at the back.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {Object.values(TIERS).map((tier) => {
          const rows = ROWS.filter((r) => r.tier === tier.id);
          const seats = rows.reduce((n, r) => n + r.count, 0);
          return (
            <article
              key={tier.id}
              className={`rounded-md border border-border border-t-[3px] bg-card p-5 ${TIER_ACCENT[tier.id]}`}
            >
              <h3 className="text-lg font-bold uppercase">{tier.name}</h3>
              <p className="mt-1 text-3xl font-bold text-primary">₹{tier.price}</p>
              <p className="mt-3 text-sm text-muted-foreground">
                Rows {rows[0]?.row}–{rows[rows.length - 1]?.row} · {seats} seats
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{tier.blurb}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

const STEPS = [
  ["01", "Pick your seats", "Live seat map — grey seats are already gone."],
  ["02", "Pay by UPI", "Scan the club QR and pay the exact amount shown."],
  ["03", "Upload proof", "Attach the payment screenshot and your details."],
  ["04", "Show your code", "Flash your booking code at the AB-02 door."],
] as const;

function Steps() {
  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-2xl font-bold uppercase sm:text-3xl">How booking works</h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([n, title, body]) => (
            <li key={n}>
              <span className="font-mono text-sm font-bold text-primary">{n}</span>
              <h3 className="mt-1 font-bold uppercase">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-20 text-center">
      <h2 className="text-2xl font-bold uppercase sm:text-3xl">
        {TOTAL_SEATS} seats. One race. No overtaking in the queue.
      </h2>
      <p className="mt-3 text-sm text-muted-foreground">
        Once a seat is booked it disappears from the map instantly.
      </p>
      <Link
        to="/book"
        className="mt-8 inline-block rounded-sm bg-primary px-8 py-3 text-sm font-bold tracking-widest text-primary-foreground uppercase transition hover:brightness-110"
      >
        Grab your seat
      </Link>
    </section>
  );
}
