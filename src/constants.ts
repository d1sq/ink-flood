export const MODULE_ID = 'ink-flood';

/** Day starts at 08:00 (480 minutes from midnight) */
export const DAY_START = 480;

/** Day ends at 19:30 (1170 minutes from midnight) */
export const DAY_END = 1170;

/** Maximum number of cycles */
export const MAX_CYCLES = 10;

/** Maximum insight tokens spendable per cycle */
export const MAX_INSIGHT_PER_CYCLE = 3;

/** Travel time matrix (minutes) between locations */
export const TRAVEL_MATRIX: Record<string, Record<string, number>> = {
  square:     { square: 0,  residence: 10, temple: 10, market: 15, shop: 12, lighthouse: 25, port: 10 },
  residence:  { square: 10, residence: 0,  temple: 15, market: 20, shop: 18, lighthouse: 30, port: 15 },
  temple:     { square: 10, residence: 15, temple: 0,  market: 12, shop: 10, lighthouse: 25, port: 15 },
  market:     { square: 15, residence: 20, temple: 12, market: 0,  shop: 8,  lighthouse: 20, port: 10 },
  shop:       { square: 12, residence: 18, temple: 10, market: 8,  shop: 0,  lighthouse: 22, port: 12 },
  lighthouse: { square: 25, residence: 30, temple: 25, market: 20, shop: 22, lighthouse: 0,  port: 20 },
  port:       { square: 10, residence: 15, temple: 15, market: 10, shop: 12, lighthouse: 20, port: 0  },
};

/** Slot type labels (localization keys) */
export const SLOT_LABELS = {
  matter: 'INK_FLOOD.keys.matter',
  word: 'INK_FLOOD.keys.word',
  vision: 'INK_FLOOD.keys.vision',
} as const;
