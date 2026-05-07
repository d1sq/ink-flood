import { writable, derived } from 'svelte/store';
import type { CycleState, CycleHistoryEntry, DiscoveryState, EncounterState } from '../types';
import { MODULE_ID, DAY_START } from '../constants';
import { getGlitchForCycle } from '../engine/glitch-engine';
import { getFloodTimes, formatTime } from '../engine/clock-engine';
import {
  defaultEncounterState,
  getRecommendedEncounters,
  getAvailableEchoes,
  getCycleLog,
} from '../engine/encounter-engine';

/** Reactive cycle state store */
export const cycleState = writable<CycleState>({
  cycle: 0,
  currentTime: DAY_START,
  events: [],
  unavailableEvents: [],
  keys: { matter: null, word: null, vision: null },
  floodPhase: 0,
  insightEarned: 0,
});

/** Reactive cycle history store */
export const cycleHistory = writable<CycleHistoryEntry[]>([]);

/** Reactive discovery state store */
export const discoveryState = writable<DiscoveryState>({
  towerSlots: { matter: false, word: false, vision: false },
  knownKeys: [],
  npcTrust: {},
  npcMemory: {},
  keyAttempts: {},
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

/** Reactive encounter state store */
export const encounterState = writable<EncounterState>(defaultEncounterState());

/** Derived: encounters whose spawn window matches current cycle/time */
export const recommendedEncounters = derived(
  [cycleState, encounterState],
  ([$cycle, $enc]) => getRecommendedEncounters($cycle.cycle, $cycle.currentTime, $enc)
);

/** Derived: echoes whose progenitor is dead and can manifest */
export const availableEchoes = derived(encounterState, $enc => getAvailableEchoes($enc));

/** Derived: encounter log entries for the current cycle */
export const currentCycleLog = derived(
  [cycleState, encounterState],
  ([$cycle, $enc]) => getCycleLog($enc, $cycle.cycle)
);

/** Sync stores from Foundry settings */
export function syncFromSettings(): void {
  try {
    const state = (game as any).settings.get(MODULE_ID, 'cycleState') as CycleState;
    cycleState.set(state);

    const history = (game as any).settings.get(MODULE_ID, 'cycleHistory') as CycleHistoryEntry[];
    cycleHistory.set(history);

    const discovery = (game as any).settings.get(MODULE_ID, 'discoveryState') as DiscoveryState;
    discoveryState.set(discovery);

    const encounters = (game as any).settings.get(MODULE_ID, 'encounterState') as EncounterState;
    if (encounters) encounterState.set(encounters);
  } catch (e) {
    console.warn(`${MODULE_ID} | Failed to sync from settings:`, e);
  }
}
