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

export type Lead = LeadData & {
  id: string;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
  /** Where the request came from (page path), for later attribution. */
  source: string | null;
};

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
}
