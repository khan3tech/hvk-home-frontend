"use client";

import * as React from "react";
import type { InteriorStaff } from "@/lib/interiors/types";
import { Button } from "@/components/ui/button";
import { selectClass } from "../admin-shell";

export const STATUS_LABEL: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  site_visit: "Site visit",
  quote_sent: "Quote sent",
  won: "Won",
  lost: "Lost",
  scheduled: "Scheduled",
  done: "Done",
  cancelled: "Cancelled",
};

const textarea =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink focus:border-bright-blue focus:outline-none focus:ring-2 focus:ring-bright-blue/20 dark:border-white/10 dark:bg-dark-surface-alt dark:text-slate-100";

export interface StaffChange {
  status?: string;
  assignedTo?: string | null;
  note?: string;
}

/** Status, assignee and a note for a quote or a consultation. Saves only what changed. */
export function StaffControls({
  statuses,
  status,
  assignedTo,
  staff,
  busy,
  onSave,
}: {
  statuses: readonly string[];
  status: string;
  assignedTo: string | null;
  staff: InteriorStaff[];
  busy: boolean;
  onSave: (change: StaffChange) => void;
}) {
  const [nextStatus, setNextStatus] = React.useState(status);
  const [nextAssignee, setNextAssignee] = React.useState(assignedTo ?? "");
  const [note, setNote] = React.useState("");
  const changed = nextStatus !== status || nextAssignee !== (assignedTo ?? "") || note.trim() !== "";

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-semibold text-navy dark:text-white">
        Status
        <select className={`${selectClass} mt-1 w-full`} value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s] ?? s}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-semibold text-navy dark:text-white">
        Assigned to
        <select className={`${selectClass} mt-1 w-full`} value={nextAssignee} onChange={(e) => setNextAssignee(e.target.value)}>
          <option value="">Unassigned</option>
          {staff.map((p) => (
            <option key={p.id} value={p.id}>
              {p.fullName}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-semibold text-navy dark:text-white sm:col-span-2">
        Add a note <span className="font-normal text-muted">(optional)</span>
        <textarea className={textarea} rows={2} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <div className="sm:col-span-2">
        <Button
          size="sm"
          disabled={busy || !changed}
          onClick={() => {
            onSave({
              ...(nextStatus !== status ? { status: nextStatus } : {}),
              ...(nextAssignee !== (assignedTo ?? "") ? { assignedTo: nextAssignee || null } : {}),
              ...(note.trim() ? { note: note.trim() } : {}),
            });
            setNote("");
          }}
        >
          Save changes
        </Button>
      </div>
    </div>
  );
}
