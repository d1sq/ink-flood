import { writable, derived, type Writable } from 'svelte/store';
import type { CycleState, CycleHistoryEntry, DiscoveryState } from '../types';
import { MODULE_ID, DAY_START } from '../constants';
import { getGlitchForCycle, getInkTraceTier, getWatcherMarkTier } from '../engine/glitch-engine';
import { getFloodTimes, formatTime } from '../engine/clock-engine';

/** Reactive cycle state store */
export const cycleState: Writable<CycleState> = writable({
  cycle: 0,
  currentTime: DAY_START,
  events: [],
  unavailableEvents: [],
  keys: { matter: null, word: null, vision: null },
  floodPhase: 0,
  insightEarned: 0,
});

/** Reactive cycle history store */
export const cycleHistory: Writable<CycleHistoryEntry[]> = writable([]);

/** Reactive discovery state store */
export const discoveryState: Writable<DiscoveryState> = writable({
  towerSlots: { matter: false, word: false, vision: false },
  knownKeys: [],
  npcTrust: {},
  notes: '',
});

/** Derived: formatted clock time */
export const formattedTime = derived(cycleState, $s => formatTime($s.currentTime));

/** Derived: minutes until flood */
export const minutesUntilFlood = derived(cycleState, $s => {
  const floodTimes = getFloodTimes($s.cycle);
  return Math.max(0, floodTimes[0] - $s.currentTime);
});

/** Derived: active glitch */
export const activeGlitch = derived(cycleState, $s => getGlitchForCycle($s.cycle));

/** Derived: character mark tiers */
export const inkTraceTier = derived(cycleState, $s => getInkTraceTier($s.cycle));
export const watcherMarkTier = derived(cycleState, $s => getWatcherMarkTier($s.cycle));

/** Sync stores from Foundry settings (call on ready and on socket events) */
export function syncFromSettings(): void {
  try {
    const state = game.settings.get(MODULE_ID, 'cycleState') as CycleState;
    cycleState.set(state);

    const history = game.settings.get(MODULE_ID, 'cycleHistory') as CycleHistoryEntry[];
    cycleHistory.set(history);

    const discovery = game.settings.get(MODULE_ID, 'discoveryState') as DiscoveryState;
    discoveryState.set(discovery);
  } catch (e) {
    console.warn(`${MODULE_ID} | Failed to sync from settings:`, e);
  }
}
