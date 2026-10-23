"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useAuthDialog } from "@/components/auth/auth-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { useSession } from "@/lib/session/session-provider";
import { cn } from "@/lib/utils";

/**
 * Replaces the inline registration form: the form itself opens in the site-wide popup. Visiting
 * /registration#registration (links from other pages, shared URLs) opens that popup straight away.
 */
export function RegistrationCta() {
  const session = useSession();
  const dialog = useAuthDialog();
  const autoOpened = React.useRef(false);

  React.useEffect(() => {
    if (autoOpened.current || session.status !== "anonymous") return;
    if (window.location.hash === "#registration") {
      autoOpened.current = true;
      dialog?.open("register");
    }
  }, [session.status, dialog]);

  return (
    <section id="registration" className="relative bg-app-bg py-14 dark:bg-dark-bg sm:py-16 lg:py-20">
      <div className="container">
        <div className="relative rounded-xl2 border border-slate-100 bg-white p-6 shadow-card-hover dark:border-white/10 dark:bg-dark-surface sm:p-8 lg:p-10">
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary-blue dark:text-bright-blue">
            Get Started Today
          </span>
          <h2 className="mt-2 text-2xl font-extrabold text-navy dark:text-white sm:text-3xl">Candidate Registration</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted dark:text-slate-400">
            Register to take the first step towards a brighter future with HVK Tech Online Examination. It takes about two
            minutes.
          </p>

          {session.status === "authenticated" ? (
            <div className="mt-6 rounded-lg border border-light-blue bg-light-blue/40 p-5 dark:border-white/10 dark:bg-dark-surface-alt">
              <p className="text-sm font-semibold text-navy dark:text-white">
                You&apos;re signed in as {session.candidate?.fullName}.
              </p>
              <Link href="/dashboard" className={cn(buttonVariants({ variant: "primary" }), "mt-4")}>
                Continue to your dashboard <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Button size="lg" onClick={() => dialog?.open("register")} aria-haspopup="dialog">
                Register now <span aria-hidden="true">→</span>
              </Button>
              <p className="text-sm text-muted dark:text-slate-400">
                Already registered?{" "}
                <button
                  type="button"
                  onClick={() => dialog?.open("login")}
                  aria-haspopup="dialog"
                  className="font-semibold text-primary-blue underline dark:text-bright-blue"
                >
                  Sign in
                </button>
              </p>
            </div>
          )}

          <p className="mt-6 flex items-center gap-1.5 text-xs text-muted dark:text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Secure Your Seat — limited seats available. Your information is safe and secure with us.
          </p>
        </div>
      </div>
    </section>
  );
}
