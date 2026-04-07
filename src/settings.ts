import type { CycleState, CycleHistoryEntry, DiscoveryState, RotationMode } from './types';
import { MODULE_ID, DAY_START } from './constants';

const DEFAULT_CYCLE_STATE: CycleState = {
  cycle: 0,
  currentTime: DAY_START,
  events: [],
  unavailableEvents: [],
  keys: { matter: null, word: null, vision: null },
  floodPhase: 0,
  insightEarned: 0,
};

const DEFAULT_DISCOVERY_STATE: DiscoveryState = {
  towerSlots: { matter: false, word: false, vision: false },
  knownKeys: [],
  npcTrust: {},
  npcMemory: {},
  keyAttempts: {},
  notes: '',
};

export function registerSettings(): void {
  game.settings.register(MODULE_ID, 'cycleState', {
    name: 'Cycle State',
    scope: 'world',
    config: false,
    type: Object,
    default: DEFAULT_CYCLE_STATE,
  });

  game.settings.register(MODULE_ID, 'cycleHistory', {
    name: 'Cycle History',
    scope: 'world',
    config: false,
    type: Array,
    default: [] as CycleHistoryEntry[],
  });

  game.settings.register(MODULE_ID, 'discoveryState', {
    name: 'Discovery State',
    scope: 'world',
    config: false,
    type: Object,
    default: DEFAULT_DISCOVERY_STATE,
  });

  game.settings.register(MODULE_ID, 'rotationMode', {
    name: 'Режим ротации ключей',
    hint: 'Фиксированная (циклы 1-3), случайная, или драматическая (убирает последний успешный)',
    scope: 'world',
    config: true,
    type: String,
    choices: {
      fixed: 'Фиксированная',
      random: 'Случайная',
      dramatic: 'Драматическая',
    },
    default: 'dramatic' as RotationMode,
  });

  game.settings.register(MODULE_ID, 'playerSnapshots', {
    name: 'Player Character Snapshots',
    scope: 'world',
    config: false,
    type: Array,
    default: [],
  });

  game.settings.register(MODULE_ID, 'clockIncrement', {
    name: 'Шаг часов по умолчанию (минуты)',
    scope: 'world',
    config: true,
    type: Number,
    default: 30,
    range: { min: 5, max: 60, step: 5 },
  });
}
