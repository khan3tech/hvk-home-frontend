import type { FollowUpStatus, LeadStatus } from "@/types/api";

/** Mirrors the backend's LEAD_TRANSITIONS (src/modules/talent-acquisition/lead.model.ts). */
export const LEAD_TRANSITIONS: Record<LeadStatus, readonly LeadStatus[]> = {
  new: ["queued", "assigned", "closed"],
  queued: ["assigned", "closed"],
  assigned: ["contacted", "closed"],
  contacted: ["in_progress", "resolved", "closed"],
  in_progress: ["resolved", "closed"],
  resolved: [],
  closed: [],
};

/** Mirrors the backend's FOLLOW_UP_TRANSITIONS (follow-up.model.ts). */
export const FOLLOW_UP_TRANSITIONS: Record<FollowUpStatus, readonly FollowUpStatus[]> = {
  open: ["in_progress", "done", "cancelled"],
  in_progress: ["done", "cancelled"],
  done: [],
  cancelled: [],
};

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  new: "New",
  queued: "Queued",
  assigned: "Assigned",
  contacted: "Contacted",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

export const FOLLOW_UP_STATUS_LABEL: Record<FollowUpStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Done",
  cancelled: "Cancelled",
};

export const STEP_LABEL: Record<string, string> = {
  registered: "Registered",
  demo_pending: "Demo pending",
  fee_pending: "Fee pending",
  exam_ready: "Exam ready",
  exam_in_progress: "Exam in progress",
  exam_completed: "Exam completed",
  feedback_submitted: "Feedback given",
  completed: "Completed",
};

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}
