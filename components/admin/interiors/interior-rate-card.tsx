"use client";

import * as React from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { ItemBasis, RateCard, RateItem } from "@/lib/interiors/types";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/portal/form-field";
import { adminInteriorsApi } from "@/lib/api/interiors";
import { errorMessage } from "@/lib/api/client";
import { AdminShell, cardClass, selectClass } from "../admin-shell";

const inputClass =
  "h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm text-ink focus:border-bright-blue focus:outline-none focus:ring-2 focus:ring-bright-blue/20 dark:border-white/10 dark:bg-dark-surface-alt dark:text-slate-100";

const BASIS_LABEL: Record<ItemBasis, string> = {
  floor_area: "Floor area (sq ft)",
  wall_area: "Wall area (sq ft)",
  ceiling_area: "Ceiling area (sq ft)",
  running_ft: "Running feet",
  sqft_front: "Front area (sq ft)",
  each: "Each",
};

/** "False ceiling" becomes "false-ceiling" (the code an item is known by). */
export const slugify = (label: string): string =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

/** Staff portal (interiors): the prices the estimator uses. */
export function InteriorRateCard() {
  const [card, setCard] = React.useState<Omit<RateCard, "updatedAt"> | null>(null);
  const [updatedAt, setUpdatedAt] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [newItem, setNewItem] = React.useState<{ label: string; basis: ItemBasis }>({ label: "", basis: "each" });

  React.useEffect(() => {
    let cancelled = false;
    adminInteriorsApi
      .rateCard()
      .then(({ updatedAt: at, ...rest }) => {
        if (cancelled) return;
        setCard(rest);
        setUpdatedAt(at);
      })
      .catch((err: unknown) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, []);

  const patchItem = (code: string, patch: Partial<RateItem>) => setCard((c) => (c ? { ...c, items: c.items.map((i) => (i.code === code ? { ...i, ...patch } : i)) } : c));
  const setRate = (code: string, tier: "essential" | "premium" | "luxe", value: string) =>
    setCard((c) => (c ? { ...c, items: c.items.map((i) => (i.code === code ? { ...i, rates: { ...i.rates, [tier]: Number(value) } } : i)) } : c));

  function addItem() {
    if (!card) return;
    const code = slugify(newItem.label);
    if (!code) {
      setError("Give the new item a name.");
      return;
    }
    if (card.items.some((i) => i.code === code)) {
      setError("An item with that name already exists.");
      return;
    }
    setError(null);
    setCard({ ...card, items: [...card.items, { code, label: newItem.label.trim(), category: "Other", basis: newItem.basis, rates: { essential: 0, premium: 0, luxe: 0 }, rooms: [], active: true }] });
    setNewItem({ label: "", basis: "each" });
  }

  async function save() {
    if (!card) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const saved = await adminInteriorsApi.saveRateCard(card);
      setUpdatedAt(saved.updatedAt);
      setMessage("Rate card saved. New estimates use these prices at once.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell title="Rate card">
      <p className="mb-4 max-w-3xl text-sm text-muted dark:text-slate-400">
        These are the prices behind the instant estimate. Rates are in rupees per unit for each package. Prices you see now are placeholders until the real rates are entered. Quotes already requested keep the estimate they were shown.
        {updatedAt ? ` Last saved ${new Date(updatedAt).toLocaleString("en-IN")}.` : ""}
      </p>
      <FormMessage>{error}</FormMessage>
      {message ? (
        <p role="status" className="mb-3 text-sm font-semibold text-green-700 dark:text-green-400">
          {message}
        </p>
      ) : null}

      {!card ? (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading…
        </p>
      ) : (
        <div className="space-y-6">
          <section className={cardClass} aria-labelledby="items-title">
            <h2 id="items-title" className="text-base font-bold text-navy dark:text-white">
              Items
            </h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[52rem] text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-muted dark:text-slate-400">
                    <th scope="col" className="py-2 pr-3">Item</th>
                    <th scope="col" className="py-2 pr-3">Priced per</th>
                    <th scope="col" className="py-2 pr-3">Essential</th>
                    <th scope="col" className="py-2 pr-3">Premium</th>
                    <th scope="col" className="py-2 pr-3">Luxe</th>
                    <th scope="col" className="py-2">On</th>
                  </tr>
                </thead>
                <tbody>
                  {card.items.map((item) => (
                    <tr key={item.code} className="border-t border-slate-100 dark:border-white/10">
                      <td className="py-2 pr-3">
                        <input className={inputClass} aria-label={`Name of ${item.code}`} value={item.label} maxLength={120} onChange={(e) => patchItem(item.code, { label: e.target.value })} />
                      </td>
                      <td className="py-2 pr-3 text-xs text-muted dark:text-slate-400">{BASIS_LABEL[item.basis]}</td>
                      {(["essential", "premium", "luxe"] as const).map((tier) => (
                        <td key={tier} className="py-2 pr-3">
                          <input className={`${inputClass} w-28`} type="number" min={0} aria-label={`${item.label} ${tier} rate`} value={item.rates[tier]} onChange={(e) => setRate(item.code, tier, e.target.value)} />
                        </td>
                      ))}
                      <td className="py-2">
                        <input type="checkbox" checked={item.active} aria-label={`${item.label} available`} onChange={(e) => patchItem(item.code, { active: e.target.checked })} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label className="text-sm font-semibold text-navy dark:text-white">
                New item
                <input className={`${inputClass} mt-1 w-56`} value={newItem.label} maxLength={120} placeholder="For example Wall panelling" onChange={(e) => setNewItem({ ...newItem, label: e.target.value })} />
              </label>
              <label className="text-sm font-semibold text-navy dark:text-white">
                Priced per
                <select className={`${selectClass} mt-1`} value={newItem.basis} onChange={(e) => setNewItem({ ...newItem, basis: e.target.value as ItemBasis })}>
                  {(Object.keys(BASIS_LABEL) as ItemBasis[]).map((b) => (
                    <option key={b} value={b}>
                      {BASIS_LABEL[b]}
                    </option>
                  ))}
                </select>
              </label>
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4" aria-hidden="true" /> Add item
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted dark:text-slate-400">To stop offering an item, untick &ldquo;On&rdquo;. Items cannot be deleted so old quotes stay readable.</p>
          </section>

          <section className={cardClass} aria-labelledby="cities-title">
            <h2 id="cities-title" className="text-base font-bold text-navy dark:text-white">
              Cities
            </h2>
            <p className="mt-1 text-xs text-muted dark:text-slate-400">The factor multiplies the estimate (1 is the base price, 1.08 is 8% more).</p>
            <ul className="mt-3 space-y-2">
              {card.cities.map((city, index) => (
                <li key={index} className="flex flex-wrap items-center gap-3">
                  <input className={`${inputClass} w-56`} aria-label={`City ${index + 1}`} value={city.name} maxLength={80} onChange={(e) => setCard({ ...card, cities: card.cities.map((c, i) => (i === index ? { ...c, name: e.target.value } : c)) })} />
                  <input className={`${inputClass} w-24`} type="number" step="0.01" min={0.1} max={10} aria-label={`Factor for ${city.name || `city ${index + 1}`}`} value={city.factor} onChange={(e) => setCard({ ...card, cities: card.cities.map((c, i) => (i === index ? { ...c, factor: Number(e.target.value) } : c)) })} />
                  <button type="button" className="rounded p-2 text-muted hover:text-red-600 disabled:opacity-40" aria-label={`Remove ${city.name || `city ${index + 1}`}`} disabled={card.cities.length <= 1} onClick={() => setCard({ ...card, cities: card.cities.filter((_, i) => i !== index) })}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
            <Button className="mt-3" variant="outline" size="sm" onClick={() => setCard({ ...card, cities: [...card.cities, { name: "", factor: 1 }] })}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Add city
            </Button>
          </section>

          <section className={cardClass} aria-labelledby="terms-title">
            <h2 id="terms-title" className="text-base font-bold text-navy dark:text-white">
              Range, GST and wording
            </h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-navy dark:text-white">
                Estimate range (plus or minus %)
                <input className={`${inputClass} mt-1`} type="number" min={0} max={50} value={card.rangePercent} onChange={(e) => setCard({ ...card, rangePercent: Number(e.target.value) })} />
              </label>
              <label className="text-sm font-semibold text-navy dark:text-white">
                GST (%)
                <input className={`${inputClass} mt-1`} type="number" min={0} max={50} value={card.gstPercent} onChange={(e) => setCard({ ...card, gstPercent: Number(e.target.value) })} />
              </label>
              <label className="text-sm font-semibold text-navy dark:text-white sm:col-span-2">
                Disclaimer shown under every estimate
                <textarea className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink dark:border-white/10 dark:bg-dark-surface-alt dark:text-slate-100" rows={3} maxLength={2000} value={card.disclaimer} onChange={(e) => setCard({ ...card, disclaimer: e.target.value })} />
              </label>
            </div>
          </section>

          <Button onClick={() => void save()} disabled={busy}>
            {busy ? "Saving…" : "Save rate card"}
          </Button>
        </div>
      )}
    </AdminShell>
  );
}
