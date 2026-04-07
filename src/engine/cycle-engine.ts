import type {
  CycleState,
  CycleHistoryEntry,
  EventState,
  RotationMode,
  EventId,
  FloodPhaseNumber,
} from '../types';
import { MODULE_ID, DAY_START, MAX_CYCLES } from '../constants';
import { EVENTS } from '../data/events';
import { getCycleStartChatHTML } from '../chat/flood-messages';
import { resetCycleSpending } from './insight-engine';
import { getGlitchForCycle } from '../data/glitch-tables';
import { determineRotation } from './rotation-engine';
import { restoreAllPlayers, hasSnapshots } from './snapshot-engine';

/** Create a fresh cycle state */
export function createCycleState(
  cycle: number,
  history: CycleHistoryEntry[],
  rotationMode: RotationMode,
  manualUnavailable?: EventId[],
): CycleState {
  const unavailable = manualUnavailable ?? determineRotation(cycle, history, rotationMode);
  const glitch = getGlitchForCycle(cycle);

  const events: EventState[] = EVENTS.map(def => {
    const isUnavailable = unavailable.includes(def.id);
    const timeShift = glitch?.eventTimeShifts[def.id] ?? 0;

    return {
      id: def.id,
      status: isUnavailable ? 'unavailable' : 'available',
      actualTime: def.time + timeShift,
    };
  });

  return {
    cycle,
    currentTime: DAY_START,
    events,
    unavailableEvents: unavailable,
    keys: { matter: null, word: null, vision: null },
    floodPhase: 0,
    insightEarned: 0,
  };
}

/** Save current cycle to history and return the entry */
export function createHistoryEntry(state: CycleState, endReason: CycleHistoryEntry['endReason']): CycleHistoryEntry {
  return {
    cycle: state.cycle,
    keys: { ...state.keys },
    completedEvents: state.events
      .filter(e => e.status === 'completed')
      .map(e => e.id),
    insightEarned: state.insightEarned,
    endReason,
  };
}

/** Start a new cycle: saves history, creates fresh state */
export async function startNewCycle(endReason: CycleHistoryEntry['endReason'] = 'flood'): Promise<CycleState | null> {
  const currentState = game.settings.get(MODULE_ID, 'cycleState') as CycleState;
  const history = game.settings.get(MODULE_ID, 'cycleHistory') as CycleHistoryEntry[];
  const rotationMode = game.settings.get(MODULE_ID, 'rotationMode') as RotationMode;

  // Save current cycle to history (if it was active)
  if (currentState.cycle > 0) {
    const entry = createHistoryEntry(currentState, endReason);
    const newHistory = [...history, entry];
    await game.settings.set(MODULE_ID, 'cycleHistory', newHistory);
  }

  // Restore player characters from snapshot (cycle 2+)
  if (currentState.cycle >= 1 && hasSnapshots()) {
    await restoreAllPlayers();
  }

  const nextCycle = currentState.cycle + 1;
  if (nextCycle > MAX_CYCLES) {
    return null; // Game over
  }

  const updatedHistory = game.settings.get(MODULE_ID, 'cycleHistory') as CycleHistoryEntry[];
  const newState = createCycleState(nextCycle, updatedHistory, rotationMode);
  await game.settings.set(MODULE_ID, 'cycleState', newState);

  // Sync SmallTime: reset world time to 08:00
  try {
    const targetSeconds = DAY_START * 60; // 480 * 60 = 28800 (08:00)
    const currentDaySeconds = game.time.worldTime % 86400;
    let delta = targetSeconds - currentDaySeconds;
    if (delta > 0) delta -= 86400; // Always go "back" to 08:00 (next day's 08:00 if needed)
    delta += 86400; // Advance to next day's 08:00
    await game.time.advance(delta);
  } catch (_) { /* SmallTime not installed */ }

  // Reset insight token spending
  await resetCycleSpending();

  // Post cycle start message
  await ChatMessage.create({ content: getCycleStartChatHTML(nextCycle) });

  // Glitch notification (GM only)
  const glitch = getGlitchForCycle(nextCycle);
  if (glitch) {
    const dcLine = glitch.dcModifier > 0
      ? `<p style="margin: 4px 0; color: #ffcc88;">DC +${glitch.dcModifier} ко всем проверкам</p>`
      : '';
    const content = `
<div style="border-left: 4px solid #ff8c00; padding: 8px 12px; background: linear-gradient(135deg, #1a0a0a, #2a1a0a); border-radius: 4px; color: #e0e0e0; font-size: 17px;">
  <strong style="color: #ffaa44;">⚠ ${nextCycle >= 10 ? 'Последний цикл' : 'Глитчи'} — Цикл ${nextCycle}</strong>
  ${dcLine}
  <ul style="margin: 4px 0; padding-left: 16px;">${glitch.descriptions.map(d => `<li style="color: #cca; margin: 2px 0;">${d}</li>`).join('')}</ul>
</div>`;
    ChatMessage.create({ content, whisper: [game.user!.id] });
  }

  // Broadcast update
  game.socket!.emit(`module.${MODULE_ID}`, { action: 'cycleUpdate' });

  return newState;
}

/** Initialize the very first cycle (cycle 0 -> 1) */
export async function initializeFirstCycle(): Promise<CycleState> {
  await game.settings.set(MODULE_ID, 'cycleHistory', []);
  const state = createCycleState(1, [], 'fixed');
  // Override cycle to 0 temporarily so startNewCycle increments to 1
  const zeroState: CycleState = {
    ...state,
    cycle: 0,
  };
  await game.settings.set(MODULE_ID, 'cycleState', zeroState);
  return (await startNewCycle('manual'))!;
}

/** Full reset: wipe all state back to zero (as if module just installed) */
export async function fullReset(): Promise<void> {
  await game.settings.set(MODULE_ID, 'cycleHistory', []);
  await game.settings.set(MODULE_ID, 'cycleState', {
    cycle: 0,
    currentTime: DAY_START,
    events: [],
    unavailableEvents: [],
    keys: { matter: null, word: null, vision: null },
    floodPhase: 0,
    insightEarned: 0,
  });
  await game.settings.set(MODULE_ID, 'discoveryState', {
    towerSlots: { matter: false, word: false, vision: false },
    knownKeys: [],
    npcTrust: {},
    npcMemory: {},
    keyAttempts: {},
    notes: '',
  });
  await game.settings.set(MODULE_ID, 'playerSnapshots', []);
  // Reset all actor flags
  const actors = game.actors?.filter((a: any) => a.hasPlayerOwner) ?? [];
  for (const actor of actors) {
    await actor.unsetFlag(MODULE_ID, 'insightTokens');
    await actor.unsetFlag(MODULE_ID, 'insightSpentThisCycle');
  }
  game.socket!.emit(`module.${MODULE_ID}`, { action: 'reset' });
  ui.notifications?.info('Чернильный потоп — полный сброс выполнен');
}
