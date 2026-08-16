import { createFileRoute, Link } from "@tanstack/react-router";
import pitstopImage from "@/assets/pitstop.webp";
import lightsImage from "@/assets/lights.webp";
import tyresImage from "@/assets/tire.webp";
import { EVENT } from "@/lib/event-config";

export const Route = createFileRoute("/f1")({
  head: () => ({
    meta: [
      { title: "F1 101 — How a Grand Prix Weekend Works | AWS Club VITB" },
      {
        name: "description",
        content:
          "New to Formula 1? Learn the race weekend format, points system, teams, and the jargon before the AWS Club VITB Grand Prix screening.",
      },
      { property: "og:title", content: "F1 101 — How a Grand Prix Weekend Works" },
      {
        property: "og:description",
        content:
          "Race weekend format, points, teams and F1 jargon explained before the AWS Club VITB screening.",
      },
    ],
  }),
  component: F1Page,
});

const weekend = [
  {
    day: "Friday",
    name: "Practice 1 & 2",
    text: "Teams learn the track, test tyre compounds and dial in setup. Nothing counts for the grid — but the timing screens hint at real pace.",
  },
  {
    day: "Saturday",
    name: "Practice 3 + Qualifying",
    text: "Qualifying runs in three knockout parts. Q1 drops the slowest five, Q2 drops five more, and the last ten fight for pole position in Q3.",
  },
  {
    day: "Sunday",
    name: "The Grand Prix",
    text: "Lights out. Around 305 km of racing, mandatory pit stops, strategy calls on the radio, and a checkered flag for the winner.",
  },
];

const points = [
  ["1st", 25],
  ["2nd", 18],
  ["3rd", 15],
  ["4th", 12],
  ["5th", 10],
  ["6th", 8],
  ["7th", 6],
  ["8th", 4],
  ["9th", 2],
  ["10th", 1],
] as const;

const glossary = [
  ["DRS", "Drag Reduction System — a flap that opens on straights when a driver is within one second of the car ahead, giving a big speed boost for overtaking."],
  ["Undercut", "Pitting earlier than a rival to run fast laps on fresh tyres and jump ahead when they finally stop."],
  ["Box, box", "Team radio for 'come into the pit lane now'."],
  ["Safety Car", "Deployed after a crash. The field bunches up behind it, gaps disappear, and strategies get thrown out of the window."],
  ["Pole Position", "First place on the starting grid, earned in qualifying."],
  ["Tyre compounds", "Soft (fastest, wears quickest), medium, and hard. Managing them is most of the race."],
  ["Parc fermé", "From qualifying onwards the car setup is locked. Change it and you start from the pit lane."],
  ["Purple lap", "The fastest lap of the session — shown in purple on the timing screens."],
];

type Team = {
  name: string;
  base: string;
  engine: string;
  drivers: string;
  colour: string;
};

/** 2026 grid — 11 teams, 22 cars. */
const teams: Team[] = [
  {
    name: "Oracle Red Bull Racing",
    base: "Milton Keynes, UK",
    engine: "Red Bull Ford",
    drivers: "Max Verstappen · Isack Hadjar",
    colour: "#1E2A6E",
  },
  {
    name: "Scuderia Ferrari",
    base: "Maranello, Italy",
    engine: "Ferrari",
    drivers: "Charles Leclerc · Lewis Hamilton",
    colour: "#E8002D",
  },
  {
    name: "McLaren Formula 1 Team",
    base: "Woking, UK",
    engine: "Mercedes",
    drivers: "Lando Norris · Oscar Piastri",
    colour: "#FF8000",
  },
  {
    name: "Mercedes-AMG Petronas",
    base: "Brackley, UK",
    engine: "Mercedes",
    drivers: "George Russell · Kimi Antonelli",
    colour: "#00D7B6",
  },
  {
    name: "Aston Martin Aramco",
    base: "Silverstone, UK",
    engine: "Honda",
    drivers: "Fernando Alonso · Lance Stroll",
    colour: "#00665E",
  },
  {
    name: "Alpine",
    base: "Enstone, UK",
    engine: "Mercedes",
    drivers: "Pierre Gasly · Franco Colapinto",
    colour: "#0093CC",
  },
  {
    name: "Atlassian Williams Racing",
    base: "Grove, UK",
    engine: "Mercedes",
    drivers: "Alex Albon · Carlos Sainz",
    colour: "#1868DB",
  },
  {
    name: "Racing Bulls",
    base: "Faenza, Italy",
    engine: "Red Bull Ford",
    drivers: "Liam Lawson · Arvid Lindblad",
    colour: "#6C98FF",
  },
  {
    name: "MoneyGram Haas F1 Team",
    base: "Kannapolis, USA",
    engine: "Ferrari",
    drivers: "Esteban Ocon · Oliver Bearman",
    colour: "#B6BABD",
  },
  {
    name: "Audi F1 Team",
    base: "Hinwil, Switzerland",
    engine: "Audi",
    drivers: "Nico Hülkenberg · Gabriel Bortoleto",
    colour: "#C1121F",
  },
  {
    name: "Cadillac F1 Team",
    base: "Indianapolis, USA",
    engine: "Ferrari",
    drivers: "Sergio Pérez · Valtteri Bottas",
    colour: "#C9A227",
  },
];

function F1Page() {
  return (
    <div>
      <section className="speedlines border-b border-border">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold tracking-[0.3em] text-primary uppercase">F1 101</p>
            <h1 className="mt-3 text-4xl font-bold uppercase sm:text-5xl">
              Never watched a Grand Prix?
            </h1>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              You do not need to know anything to enjoy it. Twenty-two cars, two hours, one
              checkered flag. Here is everything that will make the {EVENT.venue} screening
              make sense.
            </p>
          </div>
          <img
            src={lightsImage}
            alt="Formula 1 starting lights glowing red above cars on the grid"
            width={1280}
            height={864}
            loading="lazy"
            className="rounded-md border border-border object-cover shadow-lg"
          />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12">
        <h2 className="text-2xl font-bold uppercase">The race weekend</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {weekend.map((w) => (
            <article
              key={w.day}
              className="rounded-md border border-border bg-card p-5"
            >
              <p className="text-xs font-bold tracking-widest text-primary uppercase">
                {w.day}
              </p>
              <h3 className="mt-1 text-lg font-bold">{w.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{w.text}</p>
            </article>
          ))}
        </div>
        <figure className="mt-8 overflow-hidden rounded-md border border-border">
          <img
            src={pitstopImage}
            alt="Pit crew swapping tyres on a red Formula 1 car during a pit stop"
            width={1280}
            height={864}
            loading="lazy"
            className="h-56 w-full object-cover sm:h-72"
          />
          <figcaption className="border-t border-border bg-card px-4 py-2 text-xs text-muted-foreground">
            A full pit stop — four fresh tyres — takes about 2.5 seconds.
          </figcaption>
        </figure>
      </section>

      <section className="border-y border-border bg-card/40">
        <div className="mx-auto grid max-w-4xl gap-10 px-4 py-12 sm:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold uppercase">Points</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The top ten finishers score. One bonus point goes to whoever sets the fastest
              lap, if they finish in the top ten.
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-2 text-sm">
              {points.map(([pos, pts]) => (
                <div
                  key={pos}
                  className="flex items-center justify-between rounded-sm border border-border px-3 py-1.5"
                >
                  <dt className="text-muted-foreground">{pos}</dt>
                  <dd className="font-bold">{pts}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h2 className="text-2xl font-bold uppercase">Tyres decide races</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Three dry compounds, one set of rules: you must use at least two different
              compounds in a dry race. Soft is fastest but dies quickest, hard lasts but is
              slow, medium splits the difference. Rain brings intermediates and full wets.
            </p>
            <img
              src={tyresImage}
              alt="Stack of Formula 1 slick tyres with red, yellow and white sidewall bands"
              width={1280}
              height={864}
              loading="lazy"
              className="mt-5 rounded-md border border-border object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-bold uppercase">Every team on the 2026 grid</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Eleven constructors, two cars each. Two championships run at once — one for
          drivers, one for constructors. Driver line-ups can still shift during the season.
        </p>
        <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team, i) => (
            <li
              key={team.name}
              className="relative overflow-hidden rounded-md border border-border bg-card p-4 pl-5"
            >
              <span
                className="absolute inset-y-0 left-0 w-1.5"
                style={{ backgroundColor: team.colour }}
                aria-hidden
              />
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold uppercase">{team.name}</h3>
                <span className="font-mono text-xs text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <p className="mt-2 text-sm">{team.drivers}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {team.base} · {team.engine} power unit
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12">
        <h2 className="text-2xl font-bold uppercase">Jargon decoder</h2>
        <dl className="mt-6 divide-y divide-border">
          {glossary.map(([term, def]) => (
            <div key={term} className="grid gap-1 py-4 sm:grid-cols-[9rem_1fr] sm:gap-6">
              <dt className="font-bold text-primary">{term}</dt>
              <dd className="text-sm text-muted-foreground">{def}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-10 rounded-md border border-primary/40 bg-primary/10 p-6">
          <h2 className="text-xl font-bold uppercase">Ready for lights out?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {EVENT.dateLabel} · {EVENT.timeLabel} · {EVENT.venue}
          </p>
          <Link
            to="/book"
            className="mt-4 inline-flex items-center rounded-sm bg-primary px-5 py-2.5 text-sm font-bold tracking-wide text-primary-foreground uppercase transition-colors hover:bg-primary/90"
          >
            Book your seat
          </Link>
        </div>
      </section>
    </div>
  );
}