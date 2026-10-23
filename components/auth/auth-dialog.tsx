"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import type { AuthResult } from "@/types/api";
import { RegistrationForm } from "@/components/home/registration-form";
import { LoginPanel } from "@/components/portal/login-form";
import { homeFor } from "@/lib/journey";
import { useSession } from "@/lib/session/session-provider";
import { cn } from "@/lib/utils";

export type AuthView = "login" | "register";

interface AuthDialogApi {
  open(view: AuthView, options?: { next?: string | null }): void;
  close(): void;
}

const AuthDialogContext = React.createContext<AuthDialogApi | null>(null);

/** `null` outside the provider, so callers can fall back to a plain link to /login or /registration. */
export function useAuthDialog(): AuthDialogApi | null {
  return React.useContext(AuthDialogContext);
}

interface OpenState {
  view: AuthView;
  next: string | null;
  /** Page the popup was opened on: navigating elsewhere (sign-in redirect, a link inside it) closes it. */
  path: string;
}

/**
 * The site-wide sign-in / create-account popup. Mounted once in the layout; the header, hero and
 * call-to-action buttons open it through `useAuthDialog()`. /login and /registration stay real
 * pages for deep links, password-reset emails and the access guard's redirects.
 */
export function AuthDialogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = React.useState<OpenState | null>(null);

  // A navigation closes the popup (derived during render rather than from an effect).
  if (state && state.path !== pathname) setState(null);

  const api = React.useMemo<AuthDialogApi>(
    () => ({
      open: (view, options) => setState({ view, next: options?.next ?? null, path: pathname }),
      close: () => setState(null),
    }),
    [pathname],
  );

  return (
    <AuthDialogContext.Provider value={api}>
      {children}
      {state ? (
        <AuthDialog
          view={state.view}
          next={state.next}
          onSwitch={(view) => setState((s) => (s ? { ...s, view } : s))}
          onClose={api.close}
        />
      ) : null}
    </AuthDialogContext.Provider>
  );
}

function AuthDialog({
  view,
  next,
  onSwitch,
  onClose,
}: {
  view: AuthView;
  next: string | null;
  onSwitch: (view: AuthView) => void;
  onClose: () => void;
}) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const session = useSession();

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  // The popup closes by itself once the redirect changes the page.
  const onSignedIn = React.useCallback(
    (result: AuthResult) => {
      session.signIn(result);
      router.replace(homeFor(result.candidate.role, next));
    },
    [session, router, next],
  );

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={view === "login" ? "auth-login-title" : "registration-title"}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(
        "m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl border-0 bg-white p-0 shadow-2xl backdrop:bg-navy/70 dark:bg-dark-surface",
        view === "login" ? "max-w-md" : "max-w-4xl",
      )}
    >
      {view === "login" ? (
        <div className="relative p-6 sm:p-8">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sign in"
            className="absolute right-4 top-4 rounded-lg p-2 text-muted hover:bg-slate-100 hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-blue dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <h2 id="auth-login-title" className="pr-10 text-2xl font-extrabold text-navy dark:text-white">
            Sign in
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted dark:text-slate-400">
            Continue your registration, payment and exam journey.
          </p>
          <div className="mt-6">
            <LoginPanel onSignedIn={onSignedIn} onCreateAccount={() => onSwitch("register")} />
          </div>
        </div>
      ) : (
        <RegistrationForm variant="dialog" onClose={onClose} onSignIn={() => onSwitch("login")} />
      )}
    </dialog>
  );
}
