import { createFileRoute } from "@tanstack/react-router";
import { TeamsGrid } from "@/components/f1/TeamsGrid";

export const Route = createFileRoute("/teams")({
  head: () => ({
    meta: [
      { title: "2026 F1 Teams & Cars | AWS SBG VITB" },
      {
        name: "description",
        content:
          "Explore the 11 Formula 1 constructors, liveries, and official driver line-ups for the 2026 season.",
      },
      { property: "og:title", content: "2026 F1 Teams & Cars" },
      {
        property: "og:description",
        content:
          "Full 2026 Formula 1 team grid, cars, liveries, and driver pairings.",
      },
    ],
  }),
  component: TeamsPage,
});

function TeamsPage() {
  return (
    <div className="min-h-screen">
      <section className="speedlines border-b border-border py-12 px-4">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold tracking-[0.3em] text-primary uppercase">Constructors</p>
          <h1 className="mt-2 text-4xl font-bold uppercase sm:text-5xl">
            2026 F1 Teams & Cars
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground text-sm sm:text-base">
            Eleven constructors, two cars each. Explore the official 2026 Formula 1 team liveries, logos, and driver line-ups competing on the grid.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <TeamsGrid />
      </section>
    </div>
  );
}
