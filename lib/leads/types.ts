import type { LeadData } from "@/lib/validation/lead";

export const leadStatuses = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "meeting", label: "Meeting Scheduled" },
  { value: "proposal", label: "Proposal Sent" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
] as const;

export type LeadStatus = (typeof leadStatuses)[number]["value"];

export const isLeadStatus = (v: unknown): v is LeadStatus => leadStatuses.some((s) => s.value === v);

/** Outcome of the team notification email for a stored lead. */
export type NotifyStatus = "sent" | "failed";

export type Lead = LeadData & {
  id: string;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
  /** Where the request came from (page path), for later attribution. */
  source: string | null;
  /**
   * Whether the notification email went out. null/undefined: not recorded yet
   * (still sending, no mailer, or a lead stored before this was tracked).
   */
  notifyStatus?: NotifyStatus | null;
};

/** Contact fields the admin can correct (privacy policy: right to correction). */
export const contactFields = ["name", "designation", "email", "phone", "institution", "city"] as const;
export type ContactFields = Partial<Pick<Lead, (typeof contactFields)[number]>>;

export type LeadNote = {
  id: string;
  leadId: string;
  body: string;
  createdAt: string;
};

export type LeadFilters = {
  q?: string;
  status?: LeadStatus;
  eventType?: string;
};

export type NewLead = LeadData & {
  source: string | null;
  /** Salted hash of the submitter's IP — used only for rate limiting, never displayed. */
  ipHash: string | null;
};

export interface LeadStore {
  readonly kind: "postgres" | "file";
  create(lead: NewLead): Promise<Lead>;
  list(filters?: LeadFilters): Promise<Lead[]>;
  get(id: string): Promise<{ lead: Lead; notes: LeadNote[] } | null>;
  updateStatus(id: string, status: LeadStatus): Promise<void>;
  addNote(leadId: string, body: string): Promise<void>;
  countByStatus(): Promise<Record<LeadStatus, number>>;
  /** Submissions from the same IP hash since `since`. */
  countRecent(ipHash: string, since: Date): Promise<number>;
  /** Records whether the notification email for this lead was sent. Doesn't touch updatedAt. */
  markNotified(id: string, status: NotifyStatus): Promise<void>;
  /** Permanently removes the lead and its notes (privacy policy: right to deletion). */
  delete(id: string): Promise<void>;
  /** Corrects contact details; bumps updatedAt. Only the given fields change. */
  updateContact(id: string, fields: ContactFields): Promise<void>;
  /** Cheap connectivity check. Throws if the store can't be reached. */
  ping(): Promise<void>;
}
