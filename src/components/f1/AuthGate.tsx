/**
 * Full-page sign-in gate shown on the /book page when the user is not
 * authenticated. Supports Google sign-in only.
 */
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { ALLOWED_DOMAIN } from "@/lib/event-config";
import { isFirebaseConfigured } from "@/lib/firebase";

export function AuthGate() {
  const { signInWithGoogle, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  async function handleGoogle() {
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  const disabled = busy || loading || !isFirebaseConfigured;

  return (
    <div className="rounded-md border border-border bg-card p-5 sm:p-6">
      {/* Header */}
      <div className="checkers h-1.5 w-16 rounded-sm opacity-80" aria-hidden />
      <h2 className="mt-3 text-lg font-bold uppercase sm:text-xl">
        Sign in to book
      </h2>
      <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
        Only <span className="font-semibold text-primary">@{ALLOWED_DOMAIN}</span> Google accounts
        can book seats for the screening.
      </p>

      {!isFirebaseConfigured && (
        <p className="mt-3 rounded-md border border-accent/50 bg-accent/10 p-3 text-xs">
          Firebase keys not configured yet — see <code>firebase/README.md</code>.
        </p>
      )}

      {/* Google sign-in */}
      <Button
        className="mt-5 w-full gap-2 font-bold uppercase tracking-wide"
        disabled={disabled}
        onClick={() => void handleGoogle()}
      >
        <GoogleIcon />
        Sign in with Google
      </Button>

      <p className="mt-4 text-center text-[0.7rem] text-muted-foreground">
        We only use your email to verify you're a VIT Bhopal student.
        No spam, ever.
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
