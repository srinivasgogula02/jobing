/** Pure campaign rules, kept separate so edge cases can be regression-tested. */
export function campaignBatchLimit(
  requested: number,
  dailyBudget: number,
  target: number,
  alreadySent: number,
): number {
  const remaining = Math.max(0, target - alreadySent);
  return Math.max(0, Math.min(requested, dailyBudget, remaining));
}

export function subscriberPredatesCampaign(
  subscriberCreatedAt: string,
  campaignCreatedAt: string,
): boolean {
  return new Date(subscriberCreatedAt).getTime() <= new Date(campaignCreatedAt).getTime();
}
