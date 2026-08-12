/**
 * Compact badge shown in the site header when a user is signed in.
 * Displays their email and a sign-out button.
 */
import { useAuth } from "@/lib/auth-context";

export function UserBadge() {
  const { user, signOut } = useAuth();
  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-[10rem] truncate text-xs text-muted-foreground sm:inline">
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
