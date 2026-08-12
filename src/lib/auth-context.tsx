/**
 * User authentication context.
 * Supports Google sign-in (@vitbhopal.ac.in only).
 *
 * NOTE: Admin auth (in booking-api.ts) is completely separate and unchanged.
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "./firebase";
import { ALLOWED_DOMAIN } from "./event-config";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type AuthContextValue = {
  /** Currently signed-in user, null when signed out or loading. */
  user: User | null;
  /** True while the initial auth state is being resolved. */
  loading: boolean;
  /** Sign in with a Google account (@vitbhopal.ac.in only). */
  signInWithGoogle: () => Promise<void>;
  /** Sign out. */
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function isDomainAllowed(email: string | null | undefined): boolean {
  return Boolean(email && email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`));
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes (persisted session).
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth(), (fbUser) => {
      if (fbUser && !isDomainAllowed(fbUser.email)) {
        // User somehow signed in with the wrong domain — force sign-out.
        void fbSignOut(auth());
        setUser(null);
      } else {
        setUser(fbUser);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  async function handleGoogleSignIn() {
    if (!isFirebaseConfigured) throw new Error("Firebase not configured");
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ hd: ALLOWED_DOMAIN, prompt: "select_account" });
    const cred = await signInWithPopup(auth(), provider);
    if (!isDomainAllowed(cred.user.email)) {
      await fbSignOut(auth());
      throw new Error(`Only @${ALLOWED_DOMAIN} accounts are allowed.`);
    }
  }

  async function handleSignOut() {
    if (!isFirebaseConfigured) return;
    await fbSignOut(auth());
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle: handleGoogleSignIn,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
