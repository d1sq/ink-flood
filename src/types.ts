/** Key slot types */
export type SlotType = 'matter' | 'word' | 'vision';

/** Event IDs */
export type EventId = 'dawn' | 'execution' | 'governor' | 'temple' | 'market' | 'alley' | 'shop' | 'chapel' | 'lighthouse';

/** Key IDs */
export type KeyId = 'dawn-lens' | 'glass-key' | 'seal' | 'prayer' | 'coin' | 'confession' | 'truth-lens' | 'oath' | 'lighthouse-eye';

/** Event status within a cycle */
export type EventStatus = 'available' | 'completed' | 'missed' | 'unavailable';

/** Rotation mode for key availability */
export type RotationMode = 'fixed' | 'random' | 'dramatic';

/** Flood phase (0 = not started, 1-5 = phases) */
export type FloodPhaseNumber = 0 | 1 | 2 | 3 | 4 | 5;

/** Ink Trace / Watcher Mark tier */
export type MarkTier = 0 | 1 | 2 | 3;

/** Event definition (static data) */
export interface EventDefinition {
  id: EventId;
  /** Minutes from midnight (e.g. 510 = 08:30) */
  time: number;
  /** Event window duration in minutes */
  duration: number;
  /** Location ID */
  location: string;
  /** Key produced by this event */
  keyId: KeyId;
  /** Which slot this key fills */
  slot: SlotType;
  /** Localization key for the event name */
  nameKey: string;
  /** Read-aloud description (Russian) */
  description: string;
  /** Short description for quick reference */
  shortDescription: string;
  /** GM hints: DCs, timeline, options (default / cycles 1-7) */
  gmHints: string;
  /** Cycle-specific overrides for description and hints */
  cycleOverrides?: Record<number, { description?: string; gmHints?: string }>;
}

/** Flood phase definition */
export interface FloodPhase {
  phase: FloodPhaseNumber;
  /** Default time in minutes from midnight */
  defaultTime: number;
  /** Read-aloud text */
  description: string;
  /** Mechanical effects text */
  effects: string;
}

/** Glitch effect definition */
export interface GlitchEffect {
  /** Cycle when this glitch activates */
  minCycle: number;
  /** DC modifier */
  dcModifier: number;
  /** Flood start offset in minutes (negative = earlier) */
  floodTimeShift: number;
  /** Event time shifts: eventId -> minutes offset */
  eventTimeShifts: Partial<Record<EventId, number>>;
  /** Text descriptions of active glitches */
  descriptions: string[];
}

/** Per-event state within a cycle */
export interface EventState {
  id: EventId;
  status: EventStatus;
  /** Actual time (after glitch shifts) */
  actualTime: number;
}

/** Collected keys state */
export interface CollectedKeys {
  matter: KeyId | null;
  word: KeyId | null;
  vision: KeyId | null;
}

/** Full state of a single cycle */
export interface CycleState {
  cycle: number;
  /** Minutes from midnight (480 = 08:00) */
  currentTime: number;
  /** Available events this cycle */
  events: EventState[];
  /** IDs of unavailable events (1 per slot, 3 total) */
  unavailableEvents: EventId[];
  /** Collected keys */
  keys: CollectedKeys;
  /** Current flood phase */
  floodPhase: FloodPhaseNumber;
  /** Insight tokens earned this cycle */
  insightEarned: number;
}

/** Cycle history entry */
export interface CycleHistoryEntry {
  cycle: number;
  keys: CollectedKeys;
  completedEvents: EventId[];
  insightEarned: number;
  /** How the cycle ended */
  endReason: 'flood' | 'death' | 'tower' | 'manual';
}

/** NPC interaction IDs */
export type NpcInteractionId =
  | 'kel-saved' | 'kel-ignored'
  | 'governor-flattered' | 'governor-robbed' | 'governor-honest'
  | 'elza-saved' | 'elza-died' | 'elza-prayer-learned'
  | 'nagel-fought' | 'nagel-spared' | 'nagel-killed'
  | 'olbrecht-defended' | 'olbrecht-lens-broken'
  | 'konrad-persuaded' | 'konrad-lens-fell' | 'konrad-respected'
  | 'fritz-saved' | 'fritz-died';

/** Cross-cycle discovery state */
export interface DiscoveryState {
  /** Tower slot awareness */
  towerSlots: {
    matter: boolean;
    word: boolean;
    vision: boolean;
  };
  /** Known key locations */
  knownKeys: EventId[];
  /** NPC trust levels */
  npcTrust: Record<string, boolean>;
  /** NPC interaction counts (persists across cycles) */
  npcMemory: Record<string, number>;
  /** Key attempt counts across cycles ("Loop Memory" / Память петли).
   *  3+ attempts on one key = DC -2 permanently for that event. */
  keyAttempts: Partial<Record<EventId, number>>;
  /** Custom GM notes */
  notes: string;
}

/** Character mark progression */
export interface CharacterMarkState {
  /** Ozzi's Ink Trace tier (0-3) */
  inkTraceTier: MarkTier;
  /** Igrit's Watcher Mark tier (0-3) */
  watcherMarkTier: MarkTier;
}

/* -------------------------------------------------------------------------- */
/*  Ink encounters                                                            */
/* -------------------------------------------------------------------------- */

/** Living NPCs whose deaths unlock corresponding Ink Echoes */
export type NpcId = 'kel' | 'brummel' | 'elza' | 'nagel' | 'olbrecht' | 'konrad' | 'fritz';

/** Type of ink manifestation */
export type CreatureType = 'silhouette' | 'chorus' | 'echo';

/** NPC alive/dead/unknown state in the current run */
export type NpcStatus = 'alive' | 'dead' | 'unknown';

/** Source of an NPC status: derived from events, or set manually by GM */
export type StatusSource = 'auto' | 'manual';

/** A single recommended spawn window */
export interface SpawnWindow {
  /** Earliest cycle this window applies to */
  cycleMin: number;
  /** Time range in minutes from midnight, [start, end] */
  timeRange: [number, number];
  /** Optional location id (matches TRAVEL_MATRIX keys) */
  location?: string;
  /** Short GM-facing note */
  note: string;
}

/** Static definition of an ink-creature encounter */
export interface EncounterDefinition {
  id: string;
  type: CreatureType;
  /** For type='echo' — whose ink-double this is */
  echoOf?: NpcId;
  /** Display name (English, matches compendium actor) */
  name: string;
  /** Russian display name (for GM UI when ru locale is active) */
  nameRu: string;
  /** Min/max cycle in which this creature can ever appear */
  cycleRange: [number, number];
  /** Spawn window suggestions (GM picks one based on context) */
  spawnWindows: SpawnWindow[];
  /** Default location for echoes — site of the progenitor's death */
  defaultLocation?: string;
  /** Compendium actor name (matches `name` in pack JSON) */
  compendiumActor: string;
  /** Portrait path (relative to Foundry data root) */
  portrait: string;
}

/** Per-NPC status entry */
export interface NpcStatusEntry {
  npcId: NpcId;
  status: NpcStatus;
  /** Cycle in which this NPC was marked dead (for journal) */
  diedInCycle?: number;
  source: StatusSource;
}

/** Single entry in the encounter journal */
export interface EncounterLogEntry {
  cycle: number;
  /** Minutes from midnight when GM logged this encounter */
  time: number;
  encounterId: string;
  location?: string;
}

/** Full encounter state (world-scoped, persists across cycles) */
export interface EncounterState {
  npcStatus: Record<NpcId, NpcStatusEntry>;
  log: EncounterLogEntry[];
  /** Manual GM toggles to force/hide specific encounters by id */
  manualOverrides: Record<string, boolean>;
}
