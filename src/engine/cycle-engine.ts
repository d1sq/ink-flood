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
import { getGlitchForCycle } from '../data/glitch-tables';
import { determineRotation } from './rotation-engine';

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

  const nextCycle = currentState.cycle + 1;
  if (nextCycle > MAX_CYCLES) {
    return null; // Game over
  }

  const updatedHistory = game.settings.get(MODULE_ID, 'cycleHistory') as CycleHistoryEntry[];
  const newState = createCycleState(nextCycle, updatedHistory, rotationMode);
  await game.settings.set(MODULE_ID, 'cycleState', newState);

  // Notify
  const glitch = getGlitchForCycle(nextCycle);
  if (glitch) {
    const content = `<div class="ink-flood-chat glitch-notice">
      <h3>Цикл ${nextCycle} — Глитчи активны</h3>
      <p><strong>DC ${glitch.dcModifier >= 0 ? '+' : ''}${glitch.dcModifier}</strong> ко всем проверкам</p>
      <ul>${glitch.descriptions.map(d => `<li>${d}</li>`).join('')}</ul>
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
