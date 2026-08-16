import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { EVENT } from "@/lib/event-config";
import { AuthProvider } from "@/lib/auth-context";
import { UserBadge } from "@/components/f1/UserBadge";
import { LoadingScreen } from "@/components/f1/LoadingScreen";
import { Instagram, Twitter, Globe } from "lucide-react";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "author", content: "AWS Club VITB" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },

      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&family=Titillium+Web:wght@300;400;600;700&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LoadingScreen />
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">
            {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
            <Outlet />
          </main>
          <SiteFooter />
        </div>
        <Toaster position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/f1", label: "F1 101" },
  { to: "/book", label: "Book Seats" },
] as const;

function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        {/* Logo */}
        <Link to="/" className="group flex items-center gap-3">
          <span className="checkers h-7 w-7 rounded-sm opacity-90" aria-hidden />
          <span className="display text-sm leading-tight font-bold tracking-widest uppercase">
            {EVENT.club}
            <span className="block text-[0.65rem] font-medium tracking-[0.25em] text-muted-foreground">
              Race Screening
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 text-sm font-semibold tracking-wide uppercase sm:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: "text-primary" }}
              className="rounded-sm px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop user badge */}
        <div className="hidden sm:block">
          <UserBadge />
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="flex h-9 w-9 items-center justify-center rounded-sm border border-border text-foreground transition-colors hover:bg-secondary sm:hidden"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? (
            /* X icon */
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            /* Hamburger icon */
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="border-t border-border bg-card px-4 py-3 sm:hidden">
          <nav className="flex flex-col gap-1 text-sm font-semibold tracking-wide uppercase">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeProps={{ className: "text-primary" }}
                className="rounded-sm px-3 py-2.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-2 border-t border-border pt-2">
            <UserBadge />
          </div>
        </div>
      )}
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="relative mt-20 border-t border-border bg-background/95 pt-16 pb-8">
      
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 md:flex-row md:justify-between">
        
        {/* Brand */}
        <div className="flex max-w-sm flex-col gap-4">
          <h3 className="font-display text-2xl font-bold uppercase tracking-widest text-primary">
            {EVENT.club}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {EVENT.title} at {EVENT.venue}, {EVENT.campus}. Experience the pinnacle of motorsport on the big screen with fellow fans.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-4">
          <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">The Paddock</h4>
          <nav className="flex flex-col gap-2">
            <Link to="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">Home</Link>
            <Link to="/book" className="text-sm text-muted-foreground transition-colors hover:text-primary">Book Seats</Link>
            <Link to="/f1" className="text-sm text-muted-foreground transition-colors hover:text-primary">New to F1?</Link>
            <Link to="/admin" className="text-sm text-muted-foreground transition-colors hover:text-primary">Organiser Access</Link>
          </nav>
        </div>

        {/* Socials */}
        <div className="flex flex-col gap-4">
          <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">Connect</h4>
          <div className="flex gap-4">
            <a href="#" className="text-muted-foreground transition-colors hover:text-primary">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground transition-colors hover:text-primary">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground transition-colors hover:text-primary">
              <Globe className="h-5 w-5" />
            </a>
          </div>
        </div>

      </div>

      <div className="mx-auto mt-16 flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-border/40 px-4 pt-6 text-xs text-muted-foreground/60 sm:flex-row">
        <p>© {new Date().getFullYear()} {EVENT.club}. All rights reserved.</p>
        <p className="tracking-widest uppercase">Built for the thrill</p>
      </div>
    </footer>
  );
}

