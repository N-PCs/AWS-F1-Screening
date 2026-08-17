import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/waitlist")({
  beforeLoad: () => {
    throw redirect({
      to: "/book",
      search: { wl: "1" },
    });
  },
});
