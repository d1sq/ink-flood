import { MODULE_ID } from './constants';
import { registerSettings } from './settings';
import { startNewCycle, initializeFirstCycle, fullReset } from './engine/cycle-engine';
import { snapshotAllPlayers, restoreAllPlayers, hasSnapshots } from './engine/snapshot-engine';
import { advanceTime, completeEvent, formatTime } from './engine/clock-engine';
import { earnToken, spendTokens, getTokens, getSpentThisCycle, resetCycleSpending } from './engine/insight-engine';
import { getGlitchForCycle, getInkTraceTier, getWatcherMarkTier } from './engine/glitch-engine';
import { syncFromSettings } from './stores';
import { DashboardShell } from './apps/shells/DashboardShell.svelte';
import { ClockShell } from './apps/shells/ClockShell.svelte';
import { FinaleShell } from './apps/shells/FinaleShell.svelte';
import { PlayerTokensShell } from './apps/shells/PlayerTokensShell.svelte';
import { registerChatCommands } from './chat/chat-commands';
import type { CycleState } from './types';

let dashboardApp: InstanceType<typeof DashboardShell> | null = null;
let clockApp: InstanceType<typeof ClockShell> | null = null;
let finaleApp: InstanceType<typeof FinaleShell> | null = null;
let playerTokensApp: InstanceType<typeof PlayerTokensShell> | null = null;

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
    fullReset,
    openDashboard: () => toggleDashboard(),
    openClock: () => toggleClock(),
    openFinale: () => toggleFinale(),
    snapshotPlayers: snapshotAllPlayers,
    restorePlayers: restoreAllPlayers,
    hasSnapshots,
    openPlayerTokens: () => togglePlayerTokens(),
  };

  (game as any).modules.get(MODULE_ID).api = api;
  (globalThis as any).InkFlood = api;

  // Chat commands
  registerChatCommands();

  // Socket listener
  game.socket!.on(`module.${MODULE_ID}`, (data: { action: string }) => {
    syncFromSettings();
    if (data.action === 'showClock') {
      toggleClock();
    }
  });
});

// Scene control buttons (v13: controls is an object, not array)
Hooks.on('getSceneControlButtons', (controls: any) => {
  const tokens = controls.tokens;
  if (!tokens) return;

  // GM: dashboard button
  if ((game as any).user?.isGM) {
    tokens.tools['ink-flood-dashboard'] = {
      name: 'ink-flood-dashboard',
      title: 'Чернильный потоп',
      icon: 'fa-solid fa-water',
      button: true,
      onChange: () => toggleDashboard(),
      order: 100,
    };
  }

  // All users: insight tokens button (only after cycle 1 ends = cycle >= 2)
  const cycleState = (game as any).settings?.get(MODULE_ID, 'cycleState') as CycleState | undefined;
  if (cycleState && cycleState.cycle >= 2) {
    tokens.tools['ink-flood-tokens'] = {
      name: 'ink-flood-tokens',
      title: 'Токены Прозрения',
      icon: 'fa-solid fa-eye',
      button: true,
      onChange: () => togglePlayerTokens(),
      order: 101,
    };
  }
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

function toggleFinale(): void {
  if (!finaleApp) {
    finaleApp = new FinaleShell();
  }
  if ((finaleApp as any).rendered) {
    (finaleApp as any).close();
    finaleApp = null;
  } else {
    (finaleApp as any).render(true, { focus: true });
  }
}

function togglePlayerTokens(): void {
  if (!playerTokensApp) {
    playerTokensApp = new PlayerTokensShell();
  }
  if ((playerTokensApp as any).rendered) {
    (playerTokensApp as any).close();
    playerTokensApp = null;
  } else {
    (playerTokensApp as any).render(true, { focus: true });
  }
}
