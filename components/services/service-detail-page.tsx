import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown, Phone } from "lucide-react";
import { AuthLink } from "@/components/auth/auth-link";
import { buttonVariants } from "@/components/ui/button";
import { CertificatePreview } from "@/components/services/certificate-preview";
import { ServicePoster } from "@/components/services/service-poster";
import { PHONE_NUMBER_HREF, SERVICES } from "@/lib/constants";
import { SERVICE_DETAILS, type ServiceDetail } from "@/lib/service-details";
import { cn } from "@/lib/utils";

const heading = "text-2xl font-extrabold text-navy dark:text-white sm:text-3xl";

function SectionTitle({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary-blue dark:text-bright-blue">{eyebrow}</span>
      <h2 className={cn(heading, "mt-2")}>{children}</h2>
    </div>
  );
}

/** Full page for one service: poster, explanation, what you get, how it works, FAQs and calls to action. */
export function ServiceDetailPage({ detail }: { detail: ServiceDetail }) {
  const service = SERVICES.find((s) => s.id === detail.id);
  if (!service) return null;
  const Icon = service.icon;
  const others = SERVICES.filter((s) => s.id !== detail.id);

  return (
    <>
      <section className="bg-light-blue/40 py-12 dark:bg-dark-surface-alt/40 sm:py-16">
        <div className="container grid items-center gap-10 lg:grid-cols-2">
          <div>
            <nav aria-label="Breadcrumb" className="text-xs font-semibold text-muted dark:text-slate-400">
              <Link href="/registration" className="hover:text-bright-blue">Home</Link>
              <span aria-hidden="true"> / </span>
              <Link href="/registration#services" className="hover:text-bright-blue">Services</Link>
              <span aria-hidden="true"> / </span>
              <span aria-current="page" className="text-navy dark:text-white">{service.title}</span>
            </nav>
            <h1 className="mt-4 flex items-center gap-3 text-3xl font-extrabold text-navy dark:text-white sm:text-4xl">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-primary-blue shadow-card dark:bg-bright-blue/10 dark:text-bright-blue">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              {service.title}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-ink dark:text-slate-200">{detail.tagline}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <AuthLink view="register" href="/registration#registration" className={buttonVariants({ size: "lg" })}>
                Register now <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </AuthLink>
              <a href={PHONE_NUMBER_HREF} className={buttonVariants({ size: "lg", variant: "outline" })}>
                <Phone className="h-4 w-4" aria-hidden="true" /> Talk to us
              </a>
            </div>
          </div>
          <ServicePoster icon={Icon} title={service.title} tagline={service.description} accent={detail.accent} badges={detail.badges} />
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="container grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <SectionTitle eyebrow="Overview">What this service is</SectionTitle>
            <div className="mt-4 space-y-4 text-base leading-relaxed text-muted dark:text-slate-300">
              {detail.overview.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-card-hover">
            <Image src={detail.photo.src} alt={detail.photo.alt} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
          </div>
        </div>
      </section>

      <section className="bg-light-blue/40 py-14 dark:bg-dark-surface-alt/40 sm:py-16">
        <div className="container">
          <SectionTitle eyebrow="What you get">Everything included</SectionTitle>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {detail.highlights.map((item) => (
              <li key={item.title} className="rounded-xl2 border border-slate-100 bg-white p-6 shadow-card dark:border-white/10 dark:bg-dark-surface">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-light-blue text-primary-blue dark:bg-bright-blue/10 dark:text-bright-blue">
                  <Check className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-bold text-navy dark:text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted dark:text-slate-400">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {detail.certificate ? (
        <section className="py-14 sm:py-16" aria-labelledby="certificate-heading">
          <div className="container grid items-start gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary-blue dark:text-bright-blue">Your certificate</span>
              <h2 id="certificate-heading" className={cn(heading, "mt-2")}>
                Proof of what you can do
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted dark:text-slate-300">
                When you pass the online assessment for a programme, HVK Tech issues you a certificate of completion. Add it to your résumé and LinkedIn profile, together with the projects you built.
              </p>
              <ul className="mt-5 space-y-3 text-sm text-ink dark:text-slate-200">
                {["Your name and the programme you completed", "The date of issue", "A certificate ID for reference", "The HVK Tech authorised signature"].map((line) => (
                  <li key={line} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-blue dark:text-bright-blue" aria-hidden="true" />
                    {line}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm text-muted dark:text-slate-400">The preview uses your account name when you are signed in. You can also type any name to see how it looks.</p>
            </div>
            <CertificatePreview programmes={detail.certificate.programmes} />
          </div>
        </section>
      ) : null}

      {detail.topics ? (
        <section className="py-14 sm:py-16">
          <div className="container">
            <SectionTitle eyebrow="Popular tracks">What you can learn</SectionTitle>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {detail.topics.map((group) => (
                <div key={group.title} className="rounded-xl2 border border-slate-100 p-6 dark:border-white/10">
                  <h3 className="text-base font-bold text-navy dark:text-white">{group.title}</h3>
                  <ul className="mt-3 space-y-2 text-sm text-muted dark:text-slate-300">
                    {group.items.map((topic) => (
                      <li key={topic} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-blue dark:text-bright-blue" aria-hidden="true" />
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className={cn("py-14 sm:py-16", detail.topics ? "bg-light-blue/40 dark:bg-dark-surface-alt/40" : "")}>
        <div className="container">
          <SectionTitle eyebrow="How it works">Your journey, step by step</SectionTitle>
          <ol className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
            {detail.steps.map((step, index) => (
              <li key={step.title} className="relative rounded-xl2 border border-slate-100 bg-white p-5 shadow-card dark:border-white/10 dark:bg-dark-surface">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-bright-blue text-sm font-bold text-white">{index + 1}</span>
                <h3 className="mt-3 text-base font-bold text-navy dark:text-white">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted dark:text-slate-400">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={cn("py-14 sm:py-16", detail.topics ? "" : "bg-light-blue/40 dark:bg-dark-surface-alt/40")}>
        <div className="container grid gap-10 md:grid-cols-2">
          <div>
            <SectionTitle eyebrow="Who it is for">Made for</SectionTitle>
            <ul className="mt-5 space-y-3 text-base text-ink dark:text-slate-200">
              {detail.audience.map((who) => (
                <li key={who} className="flex items-start gap-3">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-primary-blue dark:text-bright-blue" aria-hidden="true" />
                  {who}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionTitle eyebrow="Outcomes">What you walk away with</SectionTitle>
            <ul className="mt-5 space-y-3 text-base text-ink dark:text-slate-200">
              {detail.outcomes.map((outcome) => (
                <li key={outcome} className="flex items-start gap-3">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-primary-blue dark:text-bright-blue" aria-hidden="true" />
                  {outcome}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="container max-w-3xl">
          <SectionTitle eyebrow="FAQ">Common questions</SectionTitle>
          <div className="mt-6 divide-y divide-slate-100 rounded-xl2 border border-slate-100 dark:divide-white/10 dark:border-white/10">
            {detail.faqs.map((faq) => (
              <details key={faq.q} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-navy dark:text-white">
                  {faq.q}
                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted dark:text-slate-300">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-navy py-14 text-white sm:py-16">
        <div className="container flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-extrabold sm:text-3xl">Ready to get started?</h2>
            <p className="mt-2 max-w-xl text-sm text-slate-300">Create your free account, or call us and we will help you choose the right option.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <AuthLink view="register" href="/registration#registration" className={buttonVariants({ size: "lg" })}>
              Register now <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </AuthLink>
            <a href={PHONE_NUMBER_HREF} className={cn(buttonVariants({ size: "lg", variant: "outline" }), "border-white bg-transparent text-white hover:bg-white/10 dark:border-white dark:bg-transparent dark:text-white")}>
              <Phone className="h-4 w-4" aria-hidden="true" /> Call us
            </a>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="container">
          <SectionTitle eyebrow="More from HVK">Explore our other services</SectionTitle>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {others.map((other) => {
              const OtherIcon = other.icon;
              return (
                <li key={other.id}>
                  <Link
                    href={`/services/${other.id}`}
                    className="flex h-full flex-col rounded-xl2 border border-slate-100 p-5 transition hover:-translate-y-0.5 hover:shadow-card-hover dark:border-white/10"
                  >
                    <OtherIcon className="h-6 w-6 text-primary-blue dark:text-bright-blue" aria-hidden="true" />
                    <span className="mt-3 text-sm font-bold text-navy dark:text-white">{other.title}</span>
                    <span className="mt-1 text-xs text-muted dark:text-slate-400">{other.description}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </>
  );
}

export const SERVICE_IDS = SERVICE_DETAILS.map((s) => s.id);
