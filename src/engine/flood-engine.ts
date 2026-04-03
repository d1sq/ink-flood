import type { CycleState, FloodPhaseNumber } from '../types';
import { MODULE_ID } from '../constants';
import { FLOOD_PHASES } from '../data/flood-phases';
import { getGlitchForCycle } from '../data/glitch-tables';

/**
 * Get current flood phase number for given time and cycle.
 * Returns 0 if flood hasn't started.
 */
export function getCurrentFloodPhase(cycle: number, currentTime: number): FloodPhaseNumber {
  const glitch = getGlitchForCycle(cycle);
  const shift = glitch?.floodTimeShift ?? 0;

  let phase: FloodPhaseNumber = 0;
  for (const fp of FLOOD_PHASES) {
    const adjustedTime = fp.defaultTime + shift;
    if (currentTime >= adjustedTime) {
      phase = fp.phase;
    }
  }
  return phase;
}

/** Get flood phase info for display */
export function getFloodPhaseInfo(phase: FloodPhaseNumber) {
  if (phase === 0) return null;
  return FLOOD_PHASES[phase - 1];
}

/** Check if the cycle should auto-end (flood phase 5 reached) */
export function shouldEndCycle(state: CycleState): boolean {
  return state.floodPhase >= 5;
}
