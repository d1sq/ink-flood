import { MODULE_ID, MAX_INSIGHT_PER_CYCLE } from '../constants';

const FLAG_TOKENS = 'insightTokens';
const FLAG_SPENT = 'insightSpentThisCycle';

/** Get insight token balance for an actor */
export function getTokens(actor: Actor): number {
  return (actor.getFlag(MODULE_ID, FLAG_TOKENS) as number) ?? 0;
}

/** Get tokens spent this cycle for an actor */
export function getSpentThisCycle(actor: Actor): number {
  return (actor.getFlag(MODULE_ID, FLAG_SPENT) as number) ?? 0;
}

/** Award insight tokens to an actor */
export async function earnToken(actor: Actor, amount: number = 1): Promise<void> {
  const current = getTokens(actor);
  await actor.setFlag(MODULE_ID, FLAG_TOKENS, current + amount);
}

/** Spend insight tokens (returns false if not enough or cycle limit reached) */
export async function spendTokens(actor: Actor, cost: number): Promise<boolean> {
  const balance = getTokens(actor);
  const spent = getSpentThisCycle(actor);

  if (balance < cost) return false;

  await actor.setFlag(MODULE_ID, FLAG_TOKENS, balance - cost);
  await actor.setFlag(MODULE_ID, FLAG_SPENT, spent + cost);
  return true;
}

/** Reset spent-per-cycle counters for all player characters */
export async function resetCycleSpending(): Promise<void> {
  const actors = game.actors?.filter(a => a.hasPlayerOwner) ?? [];
  for (const actor of actors) {
    await actor.setFlag(MODULE_ID, FLAG_SPENT, 0);
  }
}
