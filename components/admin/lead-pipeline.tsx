"use client";

import { useActionState, useEffect, useRef } from "react";
import { updateLeadPipeline, type PipelineState } from "@/app/admin/actions";
import { istTodayLocal, toIstLocalInput } from "@/components/admin/lead-format";
import { Button } from "@/components/ui/button";
import { describedBy, Field, Input, Textarea } from "@/components/ui/field";
import { Toast } from "@/components/ui/toast";
import { MAX_LOSS_REASON, MAX_PROPOSAL_DETAILS, type LeadStatus } from "@/lib/leads/types";

type PipelineValues = {
  nextFollowUp: string;
  lastContacted: string;
  /** "YYYY-MM-DDTHH:mm" in India time. */
  meetingAt: string;
  proposalDetails: string;
  lossReason: string;
};

const keys = ["nextFollowUp", "lastContacted", "meetingAt", "proposalDetails", "lossReason"] as const;

/** The action result, plus what was typed when a save failed. */
type State = PipelineState & { values?: PipelineValues };

/**
 * Follow-up and contact dates, meeting time, proposal details and loss reason. Validated again on the
 * server (real dates 2000–2100, lengths). The status has its own control above, which saves on change.
 */
export function PipelineForm({
  id,
  status,
  lead,
}: {
  id: string;
  status: LeadStatus;
  lead: {
    nextFollowUp: string | null;
    lastContacted: string | null;
    meetingAt: string | null;
    proposalDetails: string;
    lossReason: string;
  };
}) {
  const [state, action, pending] = useActionState(async (prev: State, fd: FormData): Promise<State> => {
    const result = await updateLeadPipeline(prev, fd);
    // Keep what was typed after a failed save; React resets the form after every action.
    const values = Object.fromEntries(keys.map((k) => [k, String(fd.get(k) ?? "")])) as PipelineValues;
    return result.ok ? result : { ...result, values };
  }, {} as State);

  const stored: PipelineValues = {
    nextFollowUp: lead.nextFollowUp ?? "",
    lastContacted: lead.lastContacted ?? "",
    meetingAt: toIstLocalInput(lead.meetingAt),
    proposalDetails: lead.proposalDetails,
    lossReason: lead.lossReason,
  };
  const values = state.error && state.values ? state.values : stored;
  const lost = status === "lost";
  const showLoss = lost || Boolean(lead.lossReason) || Boolean(state.values?.lossReason);

  const lastContactedRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  // Only set after a save in this browser, so it never differs between server and client renders.
  const savedAt =
    state.ok && state.at
      ? new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(
          new Date(state.at),
        )
      : null;

  // The button is disabled while saving, which drops focus to <body>. Put it back:
  // on the first invalid field after a failed save, otherwise on the button.
  useEffect(() => {
    if (!state.at) return;
    const firstInvalid = keys.find((k) => state.fieldErrors?.[k]);
    if (firstInvalid) document.getElementById(`pipeline-${firstInvalid}`)?.focus();
    else submitRef.current?.focus();
  }, [state.at, state.fieldErrors]);

  const err = (k: (typeof keys)[number]) => state.fieldErrors?.[k];

  return (
    <form action={action} noValidate className="@container space-y-5">
      <input type="hidden" name="id" value={id} />
      {/* Keyed so React's post-action reset can't revert to stale defaults; the button and live region stay put. */}
      <div key={state.at} className="space-y-5">
        <div className="grid gap-5 @md:grid-cols-2">
          <Field
            id="pipeline-nextFollowUp"
            label="Next follow-up"
            error={err("nextFollowUp")}
            hint="Shows as due in the list from this day."
          >
            <Input
              id="pipeline-nextFollowUp"
              name="nextFollowUp"
              className="min-w-0"
              type="date"
              min="2000-01-01"
              max="2100-12-31"
              defaultValue={values.nextFollowUp}
              aria-invalid={err("nextFollowUp") ? true : undefined}
              aria-describedby={describedBy("pipeline-nextFollowUp", err("nextFollowUp"), "hint")}
            />
          </Field>
          <Field id="pipeline-lastContacted" label="Last contacted" error={err("lastContacted")}>
            <div className="flex gap-2">
              <Input
                ref={lastContactedRef}
                id="pipeline-lastContacted"
                className="min-w-0"
                name="lastContacted"
                type="date"
                min="2000-01-01"
                max="2100-12-31"
                defaultValue={values.lastContacted}
                aria-invalid={err("lastContacted") ? true : undefined}
                aria-describedby={describedBy("pipeline-lastContacted", err("lastContacted"))}
              />
              <button
                type="button"
                onClick={() => {
                  if (lastContactedRef.current) lastContactedRef.current.value = istTodayLocal();
                }}
                className="h-12 shrink-0 rounded-sm border border-ink/15 px-3 text-sm transition-colors duration-150 hover:border-ink/40"
              >
                Today
                <span className="sr-only"> (set last contacted to today)</span>
              </button>
            </div>
          </Field>
        </div>
        <Field
          id="pipeline-meetingAt"
          label="Meeting"
          error={err("meetingAt")}
          hint="Date and time in India Standard Time."
        >
          <Input
            id="pipeline-meetingAt"
            name="meetingAt"
            type="datetime-local"
            min="2000-01-01T00:00"
            max="2100-12-31T23:59"
            defaultValue={values.meetingAt}
            aria-invalid={err("meetingAt") ? true : undefined}
            aria-describedby={describedBy("pipeline-meetingAt", err("meetingAt"), "hint")}
          />
        </Field>
        <Field
          id="pipeline-proposalDetails"
          label="Proposal details"
          error={err("proposalDetails")}
          hint="What was proposed: scope, format, price, dates."
        >
          <Textarea
            id="pipeline-proposalDetails"
            name="proposalDetails"
            rows={3}
            maxLength={MAX_PROPOSAL_DETAILS}
            defaultValue={values.proposalDetails}
            className="min-h-24"
            aria-invalid={err("proposalDetails") ? true : undefined}
            aria-describedby={describedBy("pipeline-proposalDetails", err("proposalDetails"), "hint")}
          />
        </Field>
        {showLoss ? (
          <Field
            id="pipeline-lossReason"
            label="Loss reason"
            error={err("lossReason")}
            hint={
              lost && !values.lossReason
                ? "Recommended for Lost leads: why it didn't go ahead."
                : "Why it didn't go ahead."
            }
          >
            <Textarea
              id="pipeline-lossReason"
              name="lossReason"
              rows={2}
              maxLength={MAX_LOSS_REASON}
              defaultValue={values.lossReason}
              className="min-h-20"
              aria-invalid={err("lossReason") ? true : undefined}
              aria-describedby={describedBy("pipeline-lossReason", err("lossReason"), "hint")}
            />
          </Field>
        ) : (
          <p className="text-xs text-mute">A loss reason field appears when the status is Lost.</p>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
        {/* Not a live region: the toast below announces the result once. */}
        <p className="mr-auto text-sm">
          {state.error ? (
            <span className="text-danger">{state.error}</span>
          ) : savedAt ? (
            <span className="text-mute">Saved at {savedAt}</span>
          ) : null}
        </p>
        <Button ref={submitRef} type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save pipeline"}
        </Button>
      </div>
      <Toast message={state.message ?? state.error} stamp={state.at} tone={state.error ? "error" : "success"} />
    </form>
  );
}
