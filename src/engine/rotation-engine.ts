import type { EventId, RotationMode, CycleHistoryEntry, SlotType } from '../types';
import { EVENTS_BY_SLOT } from '../data/events';

/**
 * Determine which 3 events are unavailable this cycle (one per slot).
 * Returns an array of 3 EventIds to exclude.
 */
export function determineRotation(
  cycle: number,
  history: CycleHistoryEntry[],
  mode: RotationMode,
): EventId[] {
  // Cycles 1-3: fixed — remove the "C" variants (market, chapel, dawn)
  if (cycle <= 3) {
    return ['market', 'chapel', 'dawn'];
  }

  if (mode === 'dramatic') {
    return dramaticRotation(history);
  }

  return randomRotation();
}

/** Remove the key the party succeeded with last cycle (per slot) */
function dramaticRotation(history: CycleHistoryEntry[]): EventId[] {
  const result: EventId[] = [];

  for (const slot of ['matter', 'word', 'vision'] as SlotType[]) {
    const slotEvents = EVENTS_BY_SLOT[slot];
    // Find last successful event in this slot
    let removedId: EventId | null = null;

    for (let i = history.length - 1; i >= 0; i--) {
      const completed = history[i].completedEvents;
      const match = slotEvents.find(eid => completed.includes(eid));
      if (match) {
        removedId = match;
        break;
      }
    }

    // If no history for this slot, pick randomly
    if (!removedId) {
      removedId = slotEvents[Math.floor(Math.random() * slotEvents.length)];
    }

    result.push(removedId);
  }

  return result;
}

/** Pick one random event to remove per slot */
function randomRotation(): EventId[] {
  const result: EventId[] = [];
  for (const slot of ['matter', 'word', 'vision'] as SlotType[]) {
    const slotEvents = EVENTS_BY_SLOT[slot];
    const idx = Math.floor(Math.random() * slotEvents.length);
    result.push(slotEvents[idx]);
  }
  return result;
}
