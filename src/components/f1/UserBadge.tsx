/**
 * Component shown in the site header.
 * Displays user email & sign-out button when signed in, or a Sign in button when signed out.
 */
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { isFirebaseConfigured } from "@/lib/firebase";

export function UserBadge() {
  const { user, signInWithGoogle, signOut, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  async function handleSignIn() {
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return null;

  if (!user) {
    return (
      <button
        type="button"
        disabled={busy || !isFirebaseConfigured}
        onClick={() => void handleSignIn()}
        className="rounded-sm border border-primary bg-primary/10 px-3 py-1.5 text-xs font-bold tracking-widest text-primary uppercase transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="max-w-[10rem] truncate text-xs text-muted-foreground">
        {user.email}
      </span>
      <button
        type="button"
        onClick={() => void signOut()}
        className="rounded-sm border border-border px-2 py-1 text-[0.65rem] font-bold tracking-widest uppercase transition-colors hover:bg-secondary"
      >
        Sign out
      </button>
    </div>
  );
}
