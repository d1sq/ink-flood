import type { CycleState, FloodPhaseNumber, EventId } from '../types';
import { MODULE_ID, DAY_END } from '../constants';
import { FLOOD_PHASES } from '../data/flood-phases';
import { getGlitchForCycle } from '../data/glitch-tables';
import { getEvent, formatTime } from '../data/events';
import { getFloodChatHTML } from '../chat/flood-messages';

export { formatTime };

/** Get effective flood phase times for the current cycle */
export function getFloodTimes(cycle: number): number[] {
  const glitch = getGlitchForCycle(cycle);
  const shift = glitch?.floodTimeShift ?? 0;
  return FLOOD_PHASES.map(p => p.defaultTime + shift);
}

/** Advance clock by given minutes. Returns events that were triggered. */
export async function advanceTime(minutes: number): Promise<{
  missedEvents: EventId[];
  newFloodPhase: FloodPhaseNumber | null;
}> {
  const state = game.settings.get(MODULE_ID, 'cycleState') as CycleState;
  const oldTime = state.currentTime;
  const newTime = Math.min(oldTime + minutes, DAY_END);

  const floodTimes = getFloodTimes(state.cycle);

  // Check for missed events
  const missedEvents: EventId[] = [];
  const updatedEvents = state.events.map(ev => {
    if (ev.status !== 'available') return ev;
    const def = getEvent(ev.id);
    const eventEnd = ev.actualTime + def.duration;
    if (newTime > eventEnd) {
      missedEvents.push(ev.id);
      return { ...ev, status: 'missed' as const };
    }
    return ev;
  });

  // Check for flood phase transitions
  let newFloodPhase: FloodPhaseNumber | null = null;
  let currentFloodPhase = state.floodPhase;

  for (let i = 0; i < FLOOD_PHASES.length; i++) {
    const phaseNum = (i + 1) as FloodPhaseNumber;
    const phaseTime = floodTimes[i];
    if (oldTime < phaseTime && newTime >= phaseTime && phaseNum > currentFloodPhase) {
      currentFloodPhase = phaseNum;
      newFloodPhase = phaseNum;
    }
  }

  // Post flood message if needed
  if (newFloodPhase !== null) {
    const content = getFloodChatHTML(newFloodPhase);
    await ChatMessage.create({ content });
  }

  // Update state
  const updatedState: CycleState = {
    ...state,
    currentTime: newTime,
    events: updatedEvents,
    floodPhase: currentFloodPhase as FloodPhaseNumber,
  };

  await game.settings.set(MODULE_ID, 'cycleState', updatedState);

  // Sync with Foundry world time (SmallTime and other modules pick this up)
  try {
    await game.time.advance(minutes * 60);
  } catch (_) { /* SmallTime not installed or time system unavailable */ }

  // Broadcast
  game.socket!.emit(`module.${MODULE_ID}`, { action: 'timeUpdate' });

  return { missedEvents, newFloodPhase };
}

/** Mark an event as completed and record the key */
export async function completeEvent(eventId: EventId): Promise<void> {
  const state = game.settings.get(MODULE_ID, 'cycleState') as CycleState;
  const def = getEvent(eventId);

  const updatedEvents = state.events.map(ev => {
    if (ev.id === eventId) {
      return { ...ev, status: 'completed' as const };
    }
    return ev;
  });

  const updatedKeys = { ...state.keys };
  updatedKeys[def.slot] = def.keyId;

  const updatedState: CycleState = {
    ...state,
    events: updatedEvents,
    keys: updatedKeys,
    insightEarned: state.insightEarned + 1,
  };

  await game.settings.set(MODULE_ID, 'cycleState', updatedState);
  game.socket!.emit(`module.${MODULE_ID}`, { action: 'eventUpdate' });
}

/** Get minutes remaining until flood starts */
export function getMinutesUntilFlood(cycle: number, currentTime: number): number {
  const floodTimes = getFloodTimes(cycle);
  const firstFlood = floodTimes[0];
  return Math.max(0, firstFlood - currentTime);
}
