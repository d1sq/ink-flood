import { MODULE_ID } from './constants';
import { registerSettings } from './settings';
import { startNewCycle, initializeFirstCycle } from './engine/cycle-engine';
import { advanceTime, completeEvent, formatTime } from './engine/clock-engine';
import { earnToken, spendTokens, getTokens, getSpentThisCycle, resetCycleSpending } from './engine/insight-engine';
import { getGlitchForCycle, getInkTraceTier, getWatcherMarkTier } from './engine/glitch-engine';
import { syncFromSettings } from './stores';
import { DashboardShell } from './apps/shells/DashboardShell.svelte';
import { ClockShell } from './apps/shells/ClockShell.svelte';
import type { CycleState } from './types';

let dashboardApp: InstanceType<typeof DashboardShell> | null = null;
let clockApp: InstanceType<typeof ClockShell> | null = null;

Hooks.once('init', () => {
  console.log(`${MODULE_ID} | Initializing`);
  registerSettings();
});

Hooks.once('ready', () => {
  console.log(`${MODULE_ID} | Ready`);
  syncFromSettings();

  // Expose API
  const api = {
    newCycle: startNewCycle,
    initFirstCycle: initializeFirstCycle,
    advanceTime,
    completeEvent,
    earnToken,
    spendTokens,
    getTokens,
    getSpentThisCycle,
    resetCycleSpending,
    getGlitchForCycle,
    getInkTraceTier,
    getWatcherMarkTier,
    formatTime,
    getState: () => game.settings.get(MODULE_ID, 'cycleState') as CycleState,
    getHistory: () => game.settings.get(MODULE_ID, 'cycleHistory'),
    openDashboard: () => toggleDashboard(),
    openClock: () => toggleClock(),
  };

  (game as any).modules.get(MODULE_ID).api = api;
  (globalThis as any).InkFlood = api;

  // Socket listener
  game.socket!.on(`module.${MODULE_ID}`, () => {
    syncFromSettings();
  });
});

// Scene control button (v13 format)
Hooks.on('getSceneControlButtons', (controls: any[]) => {
  if (!(game as any).user?.isGM) return;
  controls.push({
    name: 'ink-flood',
    title: 'Чернильный потоп',
    icon: 'fas fa-water',
    tools: [
      {
        name: 'open-dashboard',
        title: 'Открыть панель ГМ',
        icon: 'fas fa-water',
        onClick: () => toggleDashboard(),
      },
      {
        name: 'open-clock',
        title: 'Открыть часы',
        icon: 'fas fa-clock',
        onClick: () => toggleClock(),
      },
    ],
    activeTool: 'open-dashboard',
  });
});

function toggleDashboard(): void {
  if (!dashboardApp) {
    dashboardApp = new DashboardShell();
  }
  if ((dashboardApp as any).rendered) {
    (dashboardApp as any).close();
    dashboardApp = null;
  } else {
    (dashboardApp as any).render(true, { focus: true });
  }
}

function toggleClock(): void {
  if (!clockApp) {
    clockApp = new ClockShell();
  }
  if ((clockApp as any).rendered) {
    (clockApp as any).close();
    clockApp = null;
  } else {
    (clockApp as any).render(true);
  }
}
