"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { TECH_EMAIL } from "@/lib/tech-constants";

/**
 * There is no newsletter backend yet, so subscribing opens a pre-filled
 * email to the HVK inbox.
 */
export function TechSubscribe() {
  const [email, setEmail] = React.useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const subject = encodeURIComponent("Subscribe to HVK updates");
    const body = encodeURIComponent(`Please add ${email} to the HVK updates list.`);
    window.location.href = `mailto:${TECH_EMAIL}?subject=${subject}&body=${body}`;
  }

  return (
    <form onSubmit={handleSubmit} className="relative mt-4 max-w-xs">
      <label htmlFor="tech-subscribe-email" className="sr-only">
        Email address
      </label>
      <input
        id="tech-subscribe-email"
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Enter your email"
        className="w-full rounded-full border border-white/20 bg-transparent py-3 pl-5 pr-12 text-sm text-white placeholder:text-tech-muted focus:border-gold focus:outline-none"
      />
      <button
        type="submit"
        aria-label="Subscribe"
        className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-white transition-colors hover:text-gold-light"
      >
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </form>
  );
}
