"use client";

import * as React from "react";
import { CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react";
import { ApiError, errorMessage } from "@/lib/api/client";
import { interiorsApi } from "@/lib/api/interiors";
import {
  BASIS_HINT,
  PROPERTY_LABEL,
  ROOM_LABEL,
  TIER_INFO,
  convertRoom,
  floorAreaSqft,
  formatInr,
  formatRange,
  newRoom,
  roomProblems,
  toEstimateInput,
  type RoomDraft,
  type Unit,
} from "@/lib/interiors/estimator";
import type { Estimate, InteriorConfig, Tier } from "@/lib/interiors/types";
import { interiorContactSchema } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { SectionTitle, interiorsButton, interiorsButtonLight, interiorsInput } from "./ui";

/** Items worth ticking by default for a room, so the first estimate is not empty. */
const RECOMMENDED = new Set(["painting", "modular-kitchen", "wardrobe", "tv-unit", "crockery-unit", "bed-back-panel"]);

const PRESETS: { label: string; rooms: string[] }[] = [
  { label: "1 BHK", rooms: ["living", "bedroom", "kitchen", "bathroom"] },
  { label: "2 BHK", rooms: ["living", "dining", "kitchen", "bedroom", "bedroom", "bathroom", "bathroom"] },
  { label: "3 BHK", rooms: ["living", "dining", "kitchen", "bedroom", "bedroom", "bedroom", "bathroom", "bathroom", "bathroom"] },
];

const QTY_BASES = ["running_ft", "sqft_front", "each"];
const DEBOUNCE_MS = 450;

function roomWithDefaults(type: string, unit: Unit, config: InteriorConfig): RoomDraft {
  const room = newRoom(type, unit);
  const items: RoomDraft["items"] = {};
  for (const item of config.items) if (item.rooms.includes(type) && RECOMMENDED.has(item.code)) items[item.code] = { qty: "" };
  return { ...room, items };
}

export function Estimator() {
  const [config, setConfig] = React.useState<InteriorConfig | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [unit, setUnit] = React.useState<Unit>("ft");
  const [propertyType, setPropertyType] = React.useState("apartment");
  const [tier, setTier] = React.useState<Tier>("premium");
  const [city, setCity] = React.useState("");
  const [rooms, setRooms] = React.useState<RoomDraft[]>([]);
  const [adding, setAdding] = React.useState("bedroom");

  React.useEffect(() => {
    let cancelled = false;
    interiorsApi
      .config()
      .then((c) => {
        if (cancelled) return;
        setConfig(c);
        setCity(c.cities[0] ?? "");
        setRooms([roomWithDefaults("living", "ft", c)]);
      })
      .catch((err: unknown) => !cancelled && setLoadError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, []);

  const input = React.useMemo(() => toEstimateInput(rooms, unit, tier, city, config), [rooms, unit, tier, city, config]);
  const key = input ? JSON.stringify(input) : "";
  const [estimate, setEstimate] = React.useState<{ key: string; data: Estimate | null; error: string | null }>({ key: "", data: null, error: null });

  // The server does the maths (one source of truth); this asks again a moment after the last change.
  React.useEffect(() => {
    if (!input) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      interiorsApi
        .estimate(input, controller.signal)
        .then((data) => !controller.signal.aborted && setEstimate({ key, data, error: null }))
        .catch((err: unknown) => !controller.signal.aborted && setEstimate({ key, data: null, error: errorMessage(err) }));
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // `key` stands for `input`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const current = input && estimate.key === key ? estimate : null;
  const updating = Boolean(input) && !current;

  function changeUnit(next: Unit) {
    if (next === unit) return;
    setRooms((list) => list.map((r) => convertRoom(r, unit, next)));
    setUnit(next);
  }

  function patchRoom(index: number, patch: Partial<RoomDraft>) {
    setRooms((list) => list.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function toggleItem(index: number, code: string, on: boolean) {
    setRooms((list) =>
      list.map((r, i) => {
        if (i !== index) return r;
        const items = { ...r.items };
        if (on) items[code] = { qty: "" };
        else delete items[code];
        return { ...r, items };
      }),
    );
  }

  function setQty(index: number, code: string, qty: string) {
    setRooms((list) => list.map((r, i) => (i === index ? { ...r, items: { ...r.items, [code]: { qty } } } : r)));
  }

  function applyPreset(types: string[]) {
    if (!config) return;
    const counts: Record<string, number> = {};
    setRooms(
      types.map((type) => {
        counts[type] = (counts[type] ?? 0) + 1;
        const room = roomWithDefaults(type, unit, config);
        return types.filter((t) => t === type).length > 1 ? { ...room, name: `${ROOM_LABEL[type] ?? type} ${counts[type]}` } : room;
      }),
    );
  }

  if (loadError) {
    return (
      <p role="alert" className="mx-auto max-w-2xl px-5 py-16 text-center text-sm text-red-700">
        We couldn&apos;t load the estimator. {loadError} Please try again in a moment.
      </p>
    );
  }
  if (!config) {
    return (
      <p role="status" className="flex items-center justify-center gap-2 px-5 py-24 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading the estimator…
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <SectionTitle>Estimate your interiors</SectionTitle>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed">
        Tell us about your space and what you need. The estimate updates as you type. It is a guide, and the final quote follows a free site visit.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <section aria-labelledby="step-property" className="rounded-lg border border-[#d8dcd2] bg-white p-6">
            <h2 id="step-property" className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[#0f3b32]">
              1. Your property and package
            </h2>
            <fieldset className="mt-4">
              <legend className="text-sm font-semibold">Property type</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {config.propertyTypes.map((p) => (
                  <label key={p} className={cn("cursor-pointer rounded-full border px-4 py-1.5 text-sm", propertyType === p ? "border-[#0f3b32] bg-[#0f3b32] text-white" : "border-[#cfd6cf] bg-white")}>
                    <input type="radio" name="property" className="sr-only" checked={propertyType === p} onChange={() => setPropertyType(p)} />
                    {PROPERTY_LABEL[p] ?? p}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-5">
              <legend className="text-sm font-semibold">Package</legend>
              <div className="mt-2 grid gap-3 sm:grid-cols-3">
                {config.tiers.map((t) => (
                  <label key={t} className={cn("cursor-pointer rounded-md border p-3 text-sm", tier === t ? "border-[#0f3b32] bg-[#eef0e8]" : "border-[#cfd6cf]")}>
                    <input type="radio" name="tier" className="sr-only" checked={tier === t} onChange={() => setTier(t)} />
                    <span className="block font-semibold text-[#0f3b32]">{TIER_INFO[t].label}</span>
                    <span className="block text-xs text-[#4a5a54]">{TIER_INFO[t].text}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">
                City
                <select className={interiorsInput} value={city} onChange={(e) => setCity(e.target.value)}>
                  {config.cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <fieldset>
                <legend className="text-sm font-semibold">Measure in</legend>
                <div className="mt-1 inline-flex overflow-hidden rounded-md border border-[#cfd6cf]">
                  {(["ft", "m"] as const).map((u) => (
                    <label key={u} className={cn("cursor-pointer px-5 py-2.5 text-sm", unit === u ? "bg-[#0f3b32] text-white" : "bg-white")}>
                      <input type="radio" name="unit" className="sr-only" checked={unit === u} onChange={() => changeUnit(u)} />
                      {u === "ft" ? "Feet" : "Metres"}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </section>

          <section aria-labelledby="step-rooms" className="rounded-lg border border-[#d8dcd2] bg-white p-6">
            <h2 id="step-rooms" className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[#0f3b32]">
              2. Rooms and what you need
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold">Quick start:</span>
              {PRESETS.map((p) => (
                <button key={p.label} type="button" onClick={() => applyPreset(p.rooms)} className="rounded-full border border-[#0f3b32] px-3 py-1 text-xs font-semibold text-[#0f3b32] hover:bg-[#0f3b32] hover:text-white">
                  {p.label}
                </button>
              ))}
            </div>

            <ul className="mt-5 space-y-5">
              {rooms.map((room, index) => (
                <RoomCard
                  key={room.key}
                  room={room}
                  unit={unit}
                  config={config}
                  onPatch={(patch) => patchRoom(index, patch)}
                  onToggle={(code, on) => toggleItem(index, code, on)}
                  onQty={(code, qty) => setQty(index, code, qty)}
                  onRemove={rooms.length > 1 ? () => setRooms((list) => list.filter((_, i) => i !== index)) : null}
                />
              ))}
            </ul>

            <div className="mt-5 flex flex-wrap items-end gap-3">
              <label className="text-sm font-semibold">
                Add a room
                <select className={interiorsInput} value={adding} onChange={(e) => setAdding(e.target.value)}>
                  {config.roomTypes.map((t) => (
                    <option key={t} value={t}>
                      {ROOM_LABEL[t] ?? t}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" onClick={() => setRooms((list) => (list.length >= 20 ? list : [...list, roomWithDefaults(adding, unit, config)]))} disabled={rooms.length >= 20} className={interiorsButtonLight}>
                <Plus className="h-4 w-4" aria-hidden="true" /> Add room
              </button>
            </div>
          </section>
        </div>

        <aside aria-label="Your estimate" className="lg:sticky lg:top-24 lg:self-start">
          <Summary input={Boolean(input)} estimate={current?.data ?? null} error={current?.error ?? null} updating={updating} />
        </aside>
      </div>

      {input && current?.data ? <QuoteForm config={config} propertyType={propertyType} tier={tier} city={city} rooms={input.rooms} estimate={current.data} /> : null}
    </div>
  );
}

function RoomCard({
  room,
  unit,
  config,
  onPatch,
  onToggle,
  onQty,
  onRemove,
}: {
  room: RoomDraft;
  unit: Unit;
  config: InteriorConfig;
  onPatch: (patch: Partial<RoomDraft>) => void;
  onToggle: (code: string, on: boolean) => void;
  onQty: (code: string, qty: string) => void;
  onRemove: (() => void) | null;
}) {
  const [showAll, setShowAll] = React.useState(false);
  const problems = roomProblems(room, unit);
  const area = floorAreaSqft(room, unit);
  const suggested = config.items.filter((i) => i.rooms.includes(room.type));
  const others = config.items.filter((i) => !i.rooms.includes(room.type));
  const visible = showAll ? [...suggested, ...others] : suggested;
  const label = room.name || ROOM_LABEL[room.type] || room.type;

  return (
    <li className="rounded-md border border-[#d8dcd2] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <label className="min-w-0 flex-1 text-sm font-semibold">
          Room name
          <input className={interiorsInput} value={room.name} maxLength={60} onChange={(e) => onPatch({ name: e.target.value })} />
        </label>
        {onRemove ? (
          <button type="button" onClick={onRemove} className="mt-6 rounded p-2 text-[#8a948f] hover:text-red-600" aria-label={`Remove ${label}`}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {(["length", "width", "height"] as const).map((field) => (
          <label key={field} className="text-sm font-semibold">
            {field[0]!.toUpperCase() + field.slice(1)} ({unit})<span className="sr-only"> of {label}</span>
            <input className={cn(interiorsInput, problems[field] && "border-red-500")} inputMode="decimal" value={room[field]} onChange={(e) => onPatch({ [field]: e.target.value })} aria-invalid={Boolean(problems[field])} />
            {problems[field] ? (
              <span role="alert" className="mt-1 block text-xs font-medium text-red-700">
                {problems[field]}
              </span>
            ) : null}
          </label>
        ))}
      </div>
      {area !== null ? <p className="mt-2 text-xs text-[#4a5a54]">Floor area: {area} sq ft</p> : null}

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold">What do you need in {label}?</legend>
        <ul className="mt-2 space-y-2">
          {visible.map((item) => {
            const chosen = room.items[item.code];
            const hasQty = QTY_BASES.includes(item.basis);
            return (
              <li key={item.code} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={Boolean(chosen)} onChange={(e) => onToggle(item.code, e.target.checked)} aria-label={`${item.label} in ${label}`} />
                  {item.label}
                </label>
                {chosen && hasQty ? (
                  <label className="flex items-center gap-1.5 text-xs text-[#4a5a54]">
                    <span className="sr-only">{`${item.label} quantity in ${label}`}</span>
                    <input className="w-20 rounded-md border border-[#cfd6cf] px-2 py-1 text-sm" inputMode="decimal" placeholder="auto" value={chosen.qty} onChange={(e) => onQty(item.code, e.target.value)} aria-label={`${item.label} quantity in ${label}`} />
                    {item.unit}
                  </label>
                ) : null}
                {chosen ? <span className="text-xs text-[#6a7873]">{BASIS_HINT[item.basis]}</span> : null}
              </li>
            );
          })}
        </ul>
        {others.length > 0 ? (
          <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-3 text-xs font-semibold text-[#0b6bcb] hover:underline">
            {showAll ? "Show only suggested items" : "Show all items"}
          </button>
        ) : null}
      </fieldset>
    </li>
  );
}

function Summary({ input, estimate, error, updating }: { input: boolean; estimate: Estimate | null; error: string | null; updating: boolean }) {
  return (
    <div className="rounded-lg border border-[#d8dcd2] bg-white p-6" aria-live="polite">
      <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[#0f3b32]">Your estimate</h2>
      {!input ? (
        <p className="mt-4 text-sm text-[#4a5a54]">Enter the sizes of your rooms and choose at least one item to see your estimate here.</p>
      ) : error ? (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      ) : !estimate ? (
        <p className="mt-4 flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Working it out…
        </p>
      ) : (
        <div className={cn(updating && "opacity-60")}>
          <p className="mt-4 text-xs uppercase tracking-wide text-[#4a5a54]">Estimated range</p>
          <p className="mt-1 font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#0f3b32]" data-testid="estimate-range">
            {formatRange(estimate.low, estimate.high)}
          </p>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt>Estimate</dt>
              <dd>{formatInr(estimate.total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>GST ({estimate.gstPercent}%)</dt>
              <dd>{formatInr(estimate.gstAmount)}</dd>
            </div>
            <div className="flex justify-between border-t border-[#e4e0d4] pt-1 font-semibold">
              <dt>With GST</dt>
              <dd>{formatInr(estimate.totalWithGst)}</dd>
            </div>
          </dl>
          <div className="mt-4 space-y-3">
            {estimate.rooms.map((room) => (
              <details key={room.name + room.type} className="rounded-md border border-[#e4e0d4] p-3 text-sm">
                <summary className="flex cursor-pointer justify-between font-semibold">
                  <span>{room.name}</span>
                  <span>{formatInr(room.subtotal)}</span>
                </summary>
                <p className="mt-2 text-xs text-[#4a5a54]">
                  {room.floorAreaSqft} sq ft floor · {room.wallAreaSqft} sq ft walls
                </p>
                <ul className="mt-2 space-y-1 text-xs">
                  {room.lines.map((line) => (
                    <li key={line.code} className="flex justify-between gap-3">
                      <span>
                        {line.label}: {line.qty} {line.unit} × {formatInr(line.rate)}
                      </span>
                      <span>{formatInr(line.amount)}</span>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-[#4a5a54]">{estimate.disclaimer}</p>
          <a href="#get-quote" className={`${interiorsButton} mt-4 w-full`}>
            Get my detailed quote
          </a>
        </div>
      )}
    </div>
  );
}

function QuoteForm({ config, propertyType, tier, city, rooms, estimate }: { config: InteriorConfig; propertyType: string; tier: Tier; city: string; rooms: NonNullable<ReturnType<typeof toEstimateInput>>["rooms"]; estimate: Estimate }) {
  const [values, setValues] = React.useState({ name: "", phone: "", email: "", notes: "" });
  const [errors, setErrors] = React.useState<Partial<Record<"name" | "phone" | "email", string>>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState<{ reference: string; low: number; high: number } | null>(null);
  const honeypot = React.useRef<HTMLInputElement>(null);
  const set = (field: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues((v) => ({ ...v, [field]: e.target.value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = interiorContactSchema.safeParse(values);
    if (!parsed.success) {
      const next: Partial<Record<"name" | "phone" | "email", string>> = {};
      for (const issue of parsed.error.issues) next[issue.path[0] as "name" | "phone" | "email"] ??= issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setFormError(null);
    setBusy(true);
    try {
      const result = await interiorsApi.requestQuote({
        ...parsed.data,
        propertyType,
        tier,
        city,
        rooms,
        ...(values.notes.trim() ? { notes: values.notes.trim() } : {}),
        ...(honeypot.current?.value ? { website: honeypot.current.value } : {}),
      });
      setDone({ reference: result.reference, low: result.estimate.low, high: result.estimate.high });
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length > 0) {
        const next: Partial<Record<"name" | "phone" | "email", string>> = {};
        for (const f of ["name", "phone", "email"] as const) if (err.fieldErrors[f]) next[f] = err.fieldErrors[f];
        setErrors(next);
      }
      setFormError(err instanceof ApiError && err.status === 429 ? "Too many requests from this device. Please try again in a few minutes." : errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <section id="get-quote" role="status" className="mt-10 rounded-lg border border-[#0f3b32] bg-white p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-[#0f3b32]" aria-hidden="true" />
        <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#0f3b32]">Thank you! We have your request</h2>
        <p className="mt-2 text-sm">
          Your reference is <strong>{done.reference}</strong>. Estimated range {formatRange(done.low, done.high)}. We have emailed you a copy, and our team will call you to confirm the details and arrange a site visit.
        </p>
      </section>
    );
  }

  const field = (id: keyof typeof values, label: string, type = "text", autoComplete?: string) => (
    <div>
      <label htmlFor={`quote-${id}`} className="block text-sm font-semibold">
        {label} {id !== "notes" ? <span className="text-red-600">*</span> : null}
      </label>
      <input id={`quote-${id}`} type={type} autoComplete={autoComplete} className={interiorsInput} value={values[id]} onChange={set(id)} aria-invalid={id !== "notes" && Boolean(errors[id as "name" | "phone" | "email"])} />
      {id !== "notes" && errors[id as "name" | "phone" | "email"] ? (
        <p role="alert" className="mt-1 text-xs font-medium text-red-700">
          {errors[id as "name" | "phone" | "email"]}
        </p>
      ) : null}
    </div>
  );

  return (
    <section id="get-quote" aria-labelledby="quote-title" className="mt-10 rounded-lg border border-[#d8dcd2] bg-white p-6 sm:p-8">
      <h2 id="quote-title" className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#0f3b32]">
        Get your detailed quote
      </h2>
      <p className="mt-1 text-sm">
        We will keep this estimate ({formatRange(estimate.low, estimate.high)}) with your request, email you a copy and call you to arrange a free site visit. {config.disclaimer}
      </p>
      <form onSubmit={(e) => void submit(e)} noValidate className="mt-5 grid gap-4 sm:grid-cols-2">
        {field("name", "Your name", "text", "name")}
        {field("phone", "Mobile number", "tel", "tel-national")}
        <div className="sm:col-span-2">{field("email", "Email", "email", "email")}</div>
        <div className="sm:col-span-2">
          <label htmlFor="quote-notes" className="block text-sm font-semibold">
            Anything else we should know? <span className="font-normal text-[#6a7873]">(optional)</span>
          </label>
          <textarea id="quote-notes" rows={3} maxLength={2000} className={interiorsInput} value={values.notes} onChange={set("notes")} />
        </div>
        {/* Honeypot: hidden from people and assistive tech, bots fill it in. */}
        <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        {formError ? (
          <p role="alert" className="text-sm font-medium text-red-700 sm:col-span-2">
            {formError}
          </p>
        ) : null}
        <div className="sm:col-span-2">
          <button type="submit" disabled={busy} className={interiorsButton}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            {busy ? "Sending…" : "Send my request"}
          </button>
        </div>
      </form>
    </section>
  );
}
