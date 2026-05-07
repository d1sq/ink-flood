import type {
  CycleState,
  EncounterDefinition,
  EncounterLogEntry,
  EncounterState,
  NpcId,
  NpcStatus,
  StatusSource,
  EventState,
  CycleHistoryEntry,
} from '../types';
import { ENCOUNTER_DEFINITIONS, ENCOUNTER_BY_ID, NPC_IDS } from '../data/encounters';

/** Default fully-alive NPC status table for a fresh run */
export function defaultNpcStatus(): Record<NpcId, EncounterState['npcStatus'][NpcId]> {
  const out = {} as Record<NpcId, EncounterState['npcStatus'][NpcId]>;
  for (const id of NPC_IDS) {
    out[id] = { npcId: id, status: 'alive', source: 'auto' };
  }
  return out;
}

/** Default empty encounter state */
export function defaultEncounterState(): EncounterState {
  return {
    npcStatus: defaultNpcStatus(),
    log: [],
    manualOverrides: {},
  };
}

/**
 * Encounters whose cycle/time window matches the current state and whose
 * gating (echo dependency on NPC death, manual overrides) is satisfied.
 */
export function getRecommendedEncounters(
  cycle: number,
  currentTime: number,
  encounters: EncounterState
): EncounterDefinition[] {
  return ENCOUNTER_DEFINITIONS.filter((def) => {
    // Manual override wins (true = force show, false = force hide).
    const override = encounters.manualOverrides[def.id];
    if (override === false) return false;

    // Cycle range gate.
    if (cycle < def.cycleRange[0] || cycle > def.cycleRange[1]) {
      return override === true; // force-shown despite cycle? respect it
    }

    // Echo gate: only if the progenitor is dead.
    if (def.type === 'echo' && def.echoOf) {
      const npc = encounters.npcStatus[def.echoOf];
      if (!npc || npc.status !== 'dead') {
        return override === true;
      }
    }

    // At least one spawn window covers cycle + currentTime.
    const matchingWindow = def.spawnWindows.some(
      (w) =>
        cycle >= w.cycleMin &&
        currentTime >= w.timeRange[0] &&
        currentTime <= w.timeRange[1]
    );

    return matchingWindow || override === true;
  });
}

/** All Echo definitions whose progenitor is currently marked dead */
export function getAvailableEchoes(encounters: EncounterState): EncounterDefinition[] {
  return ENCOUNTER_DEFINITIONS.filter(
    (def) => def.type === 'echo' && def.echoOf && encounters.npcStatus[def.echoOf]?.status === 'dead'
  );
}

/**
 * Mapping: which event missed → which NPC is presumed dead.
 *
 * We mark dead only when the relevant key event is conclusively missed
 * (i.e. the cycle ended without it being completed). This is conservative —
 * a 'completed' or 'available' event leaves status as 'alive'.
 */
const EVENT_TO_DEAD_NPC: Partial<Record<EventState['id'], NpcId>> = {
  execution: 'kel',
  temple: 'elza',
  alley: 'fritz',
  shop: 'olbrecht',
};

/**
 * Derive auto NPC statuses from event states + cycle history.
 *
 * Only updates entries with `source: 'auto'` — manual overrides are preserved.
 * Conservative: only sets `dead` when the corresponding event is `missed`.
 * Konrad / Brummel / Nagel have no clean event trigger and stay 'alive'/'unknown'
 * until the GM toggles manually.
 */
export function deriveNpcStatusFromEvents(
  cycleState: CycleState,
  history: CycleHistoryEntry[],
  current: EncounterState
): EncounterState {
  const next: EncounterState = {
    ...current,
    npcStatus: { ...current.npcStatus },
  };

  // Combined view: events from current cycle + completion data from history.
  const allCompletedEvents = new Set<string>();
  for (const h of history) {
    for (const ev of h.completedEvents) allCompletedEvents.add(ev);
  }

  for (const event of cycleState.events) {
    const npcId = EVENT_TO_DEAD_NPC[event.id];
    if (!npcId) continue;
    const entry = next.npcStatus[npcId];
    if (!entry || entry.source === 'manual') continue; // respect GM override

    if (event.status === 'missed') {
      // NPC presumed dead this cycle.
      next.npcStatus[npcId] = {
        npcId,
        status: 'dead',
        diedInCycle: cycleState.cycle,
        source: 'auto',
      };
    } else if (event.status === 'completed') {
      // NPC saved this cycle — clear any prior auto-dead.
      if (entry.status !== 'alive') {
        next.npcStatus[npcId] = { npcId, status: 'alive', source: 'auto' };
      }
    }
  }

  return next;
}

/** Manually set NPC status (always source='manual', protects from auto-derivation) */
export function setNpcStatus(
  state: EncounterState,
  npcId: NpcId,
  status: NpcStatus,
  cycle: number
): EncounterState {
  const entry: EncounterState['npcStatus'][NpcId] = {
    npcId,
    status,
    source: 'manual',
  };
  if (status === 'dead') entry.diedInCycle = cycle;
  return {
    ...state,
    npcStatus: { ...state.npcStatus, [npcId]: entry },
  };
}

/** Reset an NPC status back to auto (clears manual flag) */
export function resetNpcStatusToAuto(state: EncounterState, npcId: NpcId): EncounterState {
  return {
    ...state,
    npcStatus: {
      ...state.npcStatus,
      [npcId]: { npcId, status: 'alive', source: 'auto' },
    },
  };
}

/** Append an entry to the encounter journal */
export function recordEncounter(
  state: EncounterState,
  cycle: number,
  time: number,
  encounterId: string,
  location?: string
): EncounterState {
  const def = ENCOUNTER_BY_ID[encounterId];
  if (!def) return state;
  const entry: EncounterLogEntry = {
    cycle,
    time,
    encounterId,
    ...(location ? { location } : {}),
  };
  return {
    ...state,
    log: [...state.log, entry],
  };
}

/** Filter journal to entries from the current cycle */
export function getCycleLog(state: EncounterState, cycle: number): EncounterLogEntry[] {
  return state.log.filter((e) => e.cycle === cycle);
}

/** Toggle manual override for a specific encounter id */
export function setManualOverride(
  state: EncounterState,
  encounterId: string,
  forced: boolean | null
): EncounterState {
  const next = { ...state.manualOverrides };
  if (forced === null) delete next[encounterId];
  else next[encounterId] = forced;
  return { ...state, manualOverrides: next };
}
