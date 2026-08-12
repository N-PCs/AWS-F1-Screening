/**
 * User authentication context.
 * Supports Google sign-in and email link (passwordless magic link).
 * Only @vitbhopal.ac.in emails are allowed.
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
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
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
  /** Send a magic link to an @vitbhopal.ac.in email address. */
  sendEmailLink: (email: string) => Promise<void>;
  /** Complete the email-link flow after the user clicks the link. */
  completeEmailLink: () => Promise<void>;
  /** Sign out. */
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const EMAIL_LINK_KEY = "f1-signin-email";

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

  // On mount, check if this is an email-link return redirect.
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    if (isSignInWithEmailLink(auth(), window.location.href)) {
      const email = window.localStorage.getItem(EMAIL_LINK_KEY);
      if (email) {
        signInWithEmailLink(auth(), email, window.location.href)
          .then(() => window.localStorage.removeItem(EMAIL_LINK_KEY))
          .catch((err) => console.error("Email link sign-in failed:", err));
      }
    }
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

  async function handleSendEmailLink(email: string) {
    if (!isFirebaseConfigured) throw new Error("Firebase not configured");
    const trimmed = email.trim().toLowerCase();
    if (!isDomainAllowed(trimmed)) {
      throw new Error(`Only @${ALLOWED_DOMAIN} emails are allowed.`);
    }
    const actionCodeSettings = {
      url: window.location.origin + "/book",
      handleCodeInApp: true,
    };
    await sendSignInLinkToEmail(auth(), trimmed, actionCodeSettings);
    window.localStorage.setItem(EMAIL_LINK_KEY, trimmed);
  }

  async function handleCompleteEmailLink() {
    if (!isFirebaseConfigured) throw new Error("Firebase not configured");
    if (!isSignInWithEmailLink(auth(), window.location.href)) return;
    const email = window.localStorage.getItem(EMAIL_LINK_KEY);
    if (!email) throw new Error("Could not find the email used for sign-in. Please try again.");
    await signInWithEmailLink(auth(), email, window.location.href);
    window.localStorage.removeItem(EMAIL_LINK_KEY);
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
        sendEmailLink: handleSendEmailLink,
        completeEmailLink: handleCompleteEmailLink,
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
