import { MODULE_ID } from './constants';
import { registerSettings } from './settings';
import { startNewCycle, initializeFirstCycle } from './engine/cycle-engine';
import { advanceTime, completeEvent, formatTime } from './engine/clock-engine';
import { earnToken, spendTokens, getTokens, getSpentThisCycle, resetCycleSpending } from './engine/insight-engine';
import { getGlitchForCycle, getInkTraceTier, getWatcherMarkTier } from './engine/glitch-engine';
import { syncFromSettings } from './stores';
import { DashboardShell } from './apps/shells/DashboardShell';
import { ClockShell } from './apps/shells/ClockShell';
import type { CycleState } from './types';

let dashboardApp: DashboardShell | null = null;
let clockApp: ClockShell | null = null;

Hooks.once('init', () => {
  console.log(`${MODULE_ID} | Initializing Ink Flood module`);
  registerSettings();
});

Hooks.once('ready', () => {
  console.log(`${MODULE_ID} | Ink Flood ready`);

  // Sync stores from current settings
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
  game.socket!.on(`module.${MODULE_ID}`, (_data: { action: string }) => {
    syncFromSettings();
  });

  // Open clock for all users on ready
  toggleClock();
});

// Add scene control button (GM only)
Hooks.on('getSceneControlButtons', (controls: any[]) => {
  const tokenControls = controls.find((c: any) => c.name === 'token');
  if (tokenControls && game.user!.isGM) {
    tokenControls.tools.push({
      name: 'ink-flood-dashboard',
      title: 'Чернильный потоп',
      icon: 'fas fa-water',
      onClick: () => toggleDashboard(),
      button: true,
    });
  }
});

function toggleDashboard(): void {
  if (dashboardApp) {
    if (dashboardApp.rendered) {
      dashboardApp.close();
      dashboardApp = null;
    } else {
      dashboardApp.render(true, { focus: true });
    }
  } else {
    dashboardApp = new DashboardShell();
    dashboardApp.render(true, { focus: true });
  }
}

function toggleClock(): void {
  if (clockApp) {
    if (clockApp.rendered) {
      clockApp.close();
      clockApp = null;
    } else {
      clockApp.render(true);
    }
  } else {
    clockApp = new ClockShell();
    clockApp.render(true);
  }
}
