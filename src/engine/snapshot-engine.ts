/**
 * Snapshot Engine — saves and restores player character state for the time loop.
 *
 * On cycle 1: snapshot all player characters (HP, spells, resources, items, effects).
 * On each subsequent cycle start: restore to snapshot state.
 *
 * What is restored:
 *   - HP (current, max, temp)
 *   - Spell slots (all levels + pact)
 *   - Class resources (primary, secondary, tertiary)
 *   - Hit dice
 *   - Exhaustion level, death saves
 *   - Item charges/uses
 *   - Inventory (items added during cycle are removed, consumed items are restored)
 *   - Active effects (non-permanent ones are removed)
 */

import { MODULE_ID } from '../constants';

/** Per-item snapshot: just enough to restore uses and detect additions */
interface ItemSnapshot {
  /** Foundry item _id */
  id: string;
  /** Item name (for logging) */
  name: string;
  /** Full item source data — needed to recreate consumed items */
  data: any;
}

/** Per-actor snapshot */
export interface ActorSnapshot {
  actorId: string;
  actorName: string;
  /** system.attributes.hp */
  hp: { value: number; max: number; temp: number };
  /** system.attributes.death */
  deathSaves: { success: number; failure: number };
  /** system.attributes.exhaustion */
  exhaustion: number;
  /** system.spells (spell1-spell9 + pact) */
  spellSlots: Record<string, { value: number; max: number; override: number | null }>;
  /** system.resources (primary, secondary, tertiary) */
  resources: Record<string, { value: number; max: number | string }>;
  /** Hit dice: class name -> { value, max } */
  hitDice: Record<string, { value: number; max: number }>;
  /** All owned items */
  items: ItemSnapshot[];
}

const SPELL_LEVELS = ['spell1', 'spell2', 'spell3', 'spell4', 'spell5', 'spell6', 'spell7', 'spell8', 'spell9', 'pact'];

/** Create a snapshot of a single actor */
export function snapshotActor(actor: any): ActorSnapshot {
  const sys = actor.system;

  // Spell slots
  const spellSlots: Record<string, { value: number; max: number; override: number | null }> = {};
  for (const level of SPELL_LEVELS) {
    const slot = sys.spells?.[level];
    if (slot) {
      spellSlots[level] = {
        value: slot.value ?? 0,
        max: slot.max ?? 0,
        override: slot.override ?? null,
      };
    }
  }

  // Resources
  const resources: Record<string, { value: number; max: number | string }> = {};
  for (const key of ['primary', 'secondary', 'tertiary']) {
    const res = sys.resources?.[key];
    if (res) {
      resources[key] = { value: res.value ?? 0, max: res.max ?? 0 };
    }
  }

  // Hit dice (from classes)
  const hitDice: Record<string, { value: number; max: number }> = {};
  for (const item of actor.items) {
    if (item.type === 'class') {
      hitDice[item.name] = {
        value: item.system?.hitDiceUsed ?? 0,
        max: item.system?.levels ?? 0,
      };
    }
  }

  // Items
  const items: ItemSnapshot[] = actor.items.map((item: any) => ({
    id: item.id,
    name: item.name,
    data: item.toObject(true),
  }));

  return {
    actorId: actor.id,
    actorName: actor.name,
    hp: {
      value: sys.attributes?.hp?.value ?? 0,
      max: sys.attributes?.hp?.max ?? 0,
      temp: sys.attributes?.hp?.temp ?? 0,
    },
    deathSaves: {
      success: sys.attributes?.death?.success ?? 0,
      failure: sys.attributes?.death?.failure ?? 0,
    },
    exhaustion: sys.attributes?.exhaustion ?? 0,
    spellSlots,
    resources,
    hitDice,
    items,
  };
}

/** Restore a single actor from snapshot */
export async function restoreActor(actor: any, snapshot: ActorSnapshot): Promise<void> {
  // 1. Build system update
  const updates: Record<string, any> = {
    'system.attributes.hp.value': snapshot.hp.value,
    'system.attributes.hp.max': snapshot.hp.max,
    'system.attributes.hp.temp': snapshot.hp.temp,
    'system.attributes.death.success': snapshot.deathSaves.success,
    'system.attributes.death.failure': snapshot.deathSaves.failure,
    'system.attributes.exhaustion': snapshot.exhaustion,
  };

  // Spell slots
  for (const [level, slot] of Object.entries(snapshot.spellSlots)) {
    updates[`system.spells.${level}.value`] = slot.value;
    updates[`system.spells.${level}.max`] = slot.max;
    if (slot.override !== null) {
      updates[`system.spells.${level}.override`] = slot.override;
    }
  }

  // Resources
  for (const [key, res] of Object.entries(snapshot.resources)) {
    updates[`system.resources.${key}.value`] = res.value;
    updates[`system.resources.${key}.max`] = res.max;
  }

  await actor.update(updates);

  // 2. Restore hit dice on class items
  for (const item of actor.items) {
    if (item.type === 'class' && snapshot.hitDice[item.name]) {
      await item.update({
        'system.hitDiceUsed': snapshot.hitDice[item.name].value,
      });
    }
  }

  // 3. Restore inventory
  const snapshotItemIds = new Set(snapshot.items.map(i => i.id));
  const currentItemIds = new Set(actor.items.map((i: any) => i.id));

  // Delete items that were added during the cycle (not in snapshot)
  const toDelete = actor.items
    .filter((i: any) => !snapshotItemIds.has(i.id))
    .map((i: any) => i.id);

  if (toDelete.length > 0) {
    await actor.deleteEmbeddedDocuments('Item', toDelete);
  }

  // Recreate items that were consumed/removed during the cycle (in snapshot but not current)
  const toCreate = snapshot.items
    .filter(i => !currentItemIds.has(i.id))
    .map(i => {
      const data = { ...i.data };
      delete data._id; // Let Foundry assign new ID
      return data;
    });

  if (toCreate.length > 0) {
    await actor.createEmbeddedDocuments('Item', toCreate);
  }

  // Restore uses/charges on items that still exist
  for (const snapItem of snapshot.items) {
    const current = actor.items.get(snapItem.id);
    if (!current) continue;

    const snapUses = snapItem.data?.system?.uses;
    const currentUses = current.system?.uses;
    if (snapUses && currentUses && snapUses.value !== currentUses.value) {
      await current.update({ 'system.uses.value': snapUses.value });
    }

    // Restore quantity (potions, arrows, etc.)
    const snapQty = snapItem.data?.system?.quantity;
    const currentQty = current.system?.quantity;
    if (snapQty !== undefined && currentQty !== undefined && snapQty !== currentQty) {
      await current.update({ 'system.quantity': snapQty });
    }
  }

  // 4. Remove non-transfer active effects (conditions applied during cycle)
  const effectsToRemove = actor.effects
    .filter((e: any) => {
      // Keep permanent/passive effects, remove temporary ones
      const isTemporary = e.isTemporary || (e.duration?.seconds > 0) || (e.duration?.rounds > 0);
      // Also remove status conditions (poisoned, frightened, etc.)
      const isStatus = e.statuses?.size > 0;
      return isTemporary || isStatus;
    })
    .map((e: any) => e.id);

  if (effectsToRemove.length > 0) {
    await actor.deleteEmbeddedDocuments('ActiveEffect', effectsToRemove);
  }

  console.log(`${MODULE_ID} | Restored ${actor.name} from snapshot`);
}

/** Snapshot all player characters */
export async function snapshotAllPlayers(): Promise<ActorSnapshot[]> {
  const players = game.actors?.filter((a: any) => a.hasPlayerOwner && a.type === 'character') ?? [];
  const snapshots = players.map((a: any) => snapshotActor(a));

  await game.settings.set(MODULE_ID, 'playerSnapshots', snapshots);

  const names = snapshots.map(s => s.actorName).join(', ');
  ui.notifications?.info(`Чернильный потоп — снапшот сохранён: ${names}`);
  console.log(`${MODULE_ID} | Snapshots saved for: ${names}`);

  return snapshots;
}

/** Restore all player characters from saved snapshots */
export async function restoreAllPlayers(): Promise<void> {
  const snapshots = game.settings.get(MODULE_ID, 'playerSnapshots') as ActorSnapshot[];

  if (!snapshots || snapshots.length === 0) {
    console.warn(`${MODULE_ID} | No snapshots found, skipping restore`);
    return;
  }

  for (const snapshot of snapshots) {
    const actor = game.actors?.get(snapshot.actorId);
    if (actor) {
      await restoreActor(actor, snapshot);
    } else {
      console.warn(`${MODULE_ID} | Actor ${snapshot.actorName} (${snapshot.actorId}) not found, skipping`);
    }
  }

  ui.notifications?.info('Чернильный потоп — персонажи восстановлены');
}

/** Check if snapshots exist */
export function hasSnapshots(): boolean {
  const snapshots = game.settings.get(MODULE_ID, 'playerSnapshots') as ActorSnapshot[];
  return Array.isArray(snapshots) && snapshots.length > 0;
}
