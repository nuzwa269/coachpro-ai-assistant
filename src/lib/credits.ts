/**
 * Credit → message translation helpers.
 *
 * We use a baseline of 1 credit per message (the cheapest active model) so that
 * users see a friendly "≈ N messages" estimate everywhere, instead of a raw
 * credit number that means nothing on its own.
 */

export const DEFAULT_CREDITS_PER_MESSAGE = 1;

/** Approximate number of messages a credit balance buys. */
export function creditsToMessages(
  credits: number | null | undefined,
  costPerMessage: number = DEFAULT_CREDITS_PER_MESSAGE,
): number {
  const c = Math.max(0, credits ?? 0);
  const cost = Math.max(1, costPerMessage);
  return Math.floor(c / cost);
}

/** Short label like "≈ 248 messages" or "≈ 1 message". */
export function messagesLabel(
  credits: number | null | undefined,
  costPerMessage: number = DEFAULT_CREDITS_PER_MESSAGE,
): string {
  const n = creditsToMessages(credits, costPerMessage);
  return `≈ ${n.toLocaleString()} ${n === 1 ? "message" : "messages"}`;
}

/** Short version without the "messages" word — "≈ 248 msgs". */
export function messagesLabelShort(
  credits: number | null | undefined,
  costPerMessage: number = DEFAULT_CREDITS_PER_MESSAGE,
): string {
  const n = creditsToMessages(credits, costPerMessage);
  return `≈ ${n.toLocaleString()} ${n === 1 ? "msg" : "msgs"} left`;
}

/** True when the user is at or below the warning threshold (default 20%). */
export function isLowOnCredits(
  credits: number | null | undefined,
  monthlyAllowance: number,
  threshold = 0.2,
): boolean {
  if (!monthlyAllowance || monthlyAllowance <= 0) return (credits ?? 0) <= 5;
  return (credits ?? 0) <= Math.ceil(monthlyAllowance * threshold);
}

/** Inline cost label used near a Send button — "1 credit · ≈ 1 message". */
export function costLabel(costPerMessage: number = DEFAULT_CREDITS_PER_MESSAGE): string {
  const c = Math.max(1, costPerMessage);
  return `${c} credit${c === 1 ? "" : "s"} / message`;
}
