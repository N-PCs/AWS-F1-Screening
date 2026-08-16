import { createFileRoute } from "@tanstack/react-router";
import { DriversGrid } from "@/components/f1/DriversGrid";

export const Route = createFileRoute("/drivers")({
  head: () => ({
    meta: [
      { title: "2026 F1 Drivers Grid | AWS Club VITB" },
      {
        name: "description",
        content:
          "Meet the 22 drivers on the 2026 Formula 1 grid, including driver numbers, nationalities, and team associations.",
      },
      { property: "og:title", content: "2026 F1 Drivers Grid" },
      {
        property: "og:description",
        content:
          "The complete 22-driver grid for the 2026 Formula 1 season.",
      },
    ],
  }),
  component: DriversPage,
});

function DriversPage() {
  return (
    <div className="min-h-screen">
      <section className="speedlines border-b border-border py-12 px-4">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold tracking-[0.3em] text-primary uppercase">Driver Lineup</p>
          <h1 className="mt-2 text-4xl font-bold uppercase sm:text-5xl">
            2026 F1 Drivers
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground text-sm sm:text-base">
            The 22 drivers competing for the 2026 World Championship. Explore driver numbers, team colors, and official country flags across the entire grid.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <DriversGrid />
      </section>
    </div>
  );
}
