export const MODULE_ID = 'ink-flood';

/** Day starts at 08:00 (480 minutes from midnight) */
export const DAY_START = 480;

/** Day ends at 19:30 (1170 minutes from midnight) */
export const DAY_END = 1170;

/** Maximum number of cycles */
export const MAX_CYCLES = 10;

/** Maximum insight tokens spendable per cycle */
export const MAX_INSIGHT_PER_CYCLE = 3;

/**
 * Travel time matrix (minutes) between locations.
 * "lighthouse" = Сигнальная Башня (Тёмная стоит на square, время = 0).
 * Synced with `02 Город.md` movement matrix.
 */
export const TRAVEL_MATRIX: Record<string, Record<string, number>> = {
  square:     { square: 0,  residence: 10, temple: 10, market: 12, shop: 12, alley: 15, lighthouse: 30, tavern: 5,  chapel: 13, wall: 12 },
  residence:  { square: 10, residence: 0,  temple: 15, market: 15, shop: 18, alley: 20, lighthouse: 35, tavern: 12, chapel: 18, wall: 17 },
  temple:     { square: 10, residence: 15, temple: 0,  market: 12, shop: 17, alley: 20, lighthouse: 30, tavern: 12, chapel: 5,  wall: 7  },
  market:     { square: 12, residence: 15, temple: 12, market: 0,  shop: 5,  alley: 3,  lighthouse: 22, tavern: 10, chapel: 17, wall: 14 },
  shop:       { square: 12, residence: 18, temple: 17, market: 5,  shop: 0,  alley: 3,  lighthouse: 22, tavern: 10, chapel: 20, wall: 17 },
  alley:      { square: 15, residence: 20, temple: 20, market: 3,  shop: 3,  alley: 0,  lighthouse: 20, tavern: 12, chapel: 22, wall: 20 },
  lighthouse: { square: 30, residence: 35, temple: 30, market: 22, shop: 22, alley: 20, lighthouse: 0,  tavern: 28, chapel: 32, wall: 33 },
  tavern:     { square: 5,  residence: 12, temple: 12, market: 10, shop: 10, alley: 12, lighthouse: 28, tavern: 0,  chapel: 15, wall: 14 },
  chapel:     { square: 13, residence: 18, temple: 5,  market: 17, shop: 20, alley: 22, lighthouse: 32, tavern: 15, chapel: 0,  wall: 8  },
  wall:       { square: 12, residence: 17, temple: 7,  market: 14, shop: 17, alley: 20, lighthouse: 33, tavern: 14, chapel: 8,  wall: 0  },
};

/** Slot type labels (localization keys) */
export const SLOT_LABELS = {
  matter: 'INK_FLOOD.keys.matter',
  word: 'INK_FLOOD.keys.word',
  vision: 'INK_FLOOD.keys.vision',
} as const;
