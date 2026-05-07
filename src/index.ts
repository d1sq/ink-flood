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
import { EncounterTrackerShell } from './apps/shells/EncounterTrackerShell.svelte';
import { registerChatCommands } from './chat/chat-commands';
import { cycleState as cycleStore, encounterState as encounterStore } from './stores';
import { deriveNpcStatusFromEvents } from './engine/encounter-engine';
import { getActiveActorNameMap } from './data/actor-translations';
import type { CycleState, EncounterState, CycleHistoryEntry } from './types';

function injectCampaignEndStyles(): void {
  if (document.getElementById('ink-campaign-end-css')) return;
  const style = document.createElement('style');
  style.id = 'ink-campaign-end-css';
  style.textContent = `
    .ink-campaign-end-overlay { position: fixed; inset: 0; z-index: 99999; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; }
    .ink-campaign-end-modal { position: relative; max-width: 90vw; max-height: 90vh; }
    .ink-campaign-end-gif { display: block; max-width: 90vw; max-height: 85vh; border-radius: 8px; box-shadow: 0 0 40px rgba(255,215,0,0.3); }
    .ink-campaign-end-close { position: absolute; top: -12px; right: -12px; width: 32px; height: 32px; background: #1a1a2e; border: 1px solid #555; color: #e0e0e0; border-radius: 50%; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; }
    .ink-campaign-end-close:hover { border-color: #ffd700; color: #ffd700; }
  `;
  document.head.appendChild(style);
}

function showCampaignEndOverlay(): void {
  if (document.querySelector('.ink-campaign-end-overlay')) return;
  injectCampaignEndStyles();
  const overlay = document.createElement('div');
  overlay.className = 'ink-campaign-end-overlay';
  overlay.innerHTML = `
    <div class="ink-campaign-end-modal">
      <video src="modules/ink-flood/assets/images/glorpy.mp4" autoplay loop playsinline class="ink-campaign-end-gif"></video>
      <button class="ink-campaign-end-close">✕</button>
    </div>
  `;
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  overlay.querySelector('.ink-campaign-end-close')!.addEventListener('click', () => overlay.remove());
  document.body.appendChild(overlay);
}

let dashboardApp: InstanceType<typeof DashboardShell> | null = null;
let clockApp: InstanceType<typeof ClockShell> | null = null;
let finaleApp: InstanceType<typeof FinaleShell> | null = null;
let playerTokensApp: InstanceType<typeof PlayerTokensShell> | null = null;
let encounterTrackerApp: InstanceType<typeof EncounterTrackerShell> | null = null;

Hooks.once('init', () => {
  console.log(`${MODULE_ID} | Initializing`);
  registerSettings();
});

async function applyActorLocalization(): Promise<void> {
  const map = getActiveActorNameMap();
  if (!map) return;

  // 1. Patch pack index entries so the compendium browser shows localized names.
  const pack = (game as any).packs.get(`${MODULE_ID}.actors`);
  if (pack) {
    try {
      await pack.getIndex();
      for (const entry of pack.index) {
        const localized = map[entry.name];
        if (localized) entry.name = localized;
      }
    } catch (e) {
      console.warn(`${MODULE_ID} | Failed to patch pack index for localization:`, e);
    }
  }

  // 2. Hook preCreateActor so tokens dropped onto a scene get the localized name.
  //    Guarded by our `flags.ink-flood` so we only touch our own actors.
  Hooks.on('preCreateActor', (actor: any, data: any) => {
    if (!data?.flags?.['ink-flood']) return;
    const localized = map[data.name];
    if (localized && data.name !== localized) {
      actor.updateSource({
        name: localized,
        'prototypeToken.name': localized,
      });
    }
  });
}

Hooks.once('ready', () => {
  console.log(`${MODULE_ID} | Ready`);
  syncFromSettings();
  void applyActorLocalization();

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
    openEncounterTracker: () => toggleEncounterTracker(),
    showCampaignEnd: () => {
      showCampaignEndOverlay();
      game.socket!.emit(`module.${MODULE_ID}`, { action: 'campaignEnd' });
    },
  };

  (game as any).modules.get(MODULE_ID).api = api;
  (globalThis as any).InkFlood = api;

  // Chat commands
  registerChatCommands();

  // Auto-derive NPC death state from event progression when GM is at the table.
  // Manual toggles are preserved by the engine (source='manual' wins).
  // Deferred via queueMicrotask so we don't write settings inside a Svelte
  // subscribe callback (which would re-trigger sync mid-update).
  if ((game as any).user?.isGM) {
    cycleStore.subscribe((cs) => {
      queueMicrotask(() => {
        try {
          const enc = (game as any).settings.get(MODULE_ID, 'encounterState') as EncounterState;
          if (!enc) return;
          const history = (game as any).settings.get(MODULE_ID, 'cycleHistory') as CycleHistoryEntry[];
          const next = deriveNpcStatusFromEvents(cs, history ?? [], enc);
          const changed = JSON.stringify(next.npcStatus) !== JSON.stringify(enc.npcStatus);
          if (changed) {
            encounterStore.set(next);
            void (game as any).settings.set(MODULE_ID, 'encounterState', next);
          }
        } catch (e) {
          console.warn(`${MODULE_ID} | NPC auto-derivation skipped:`, e);
        }
      });
    });
  }

  // Socket listener
  game.socket!.on(`module.${MODULE_ID}`, (data: { action?: string; type?: string }) => {
    syncFromSettings();
    if (data.action === 'showClock') {
      toggleClock();
    }
    if (data.action === 'campaignEnd') {
      showCampaignEndOverlay();
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

    // GM-only: encounter tracker (cycle 4+, when manifestations start)
    const cycleNow = (game as any).settings?.get(MODULE_ID, 'cycleState') as CycleState | undefined;
    if (cycleNow && cycleNow.cycle >= 4) {
      tokens.tools['ink-flood-encounters'] = {
        name: 'ink-flood-encounters',
        title: 'Чернильные манифестации',
        icon: 'fa-solid fa-droplet',
        button: true,
        onChange: () => toggleEncounterTracker(),
        order: 102,
      };
    }
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

function toggleEncounterTracker(): void {
  if (!encounterTrackerApp) {
    encounterTrackerApp = new EncounterTrackerShell();
  }
  if ((encounterTrackerApp as any).rendered) {
    (encounterTrackerApp as any).close();
    encounterTrackerApp = null;
  } else {
    (encounterTrackerApp as any).render(true, { focus: true });
  }
}
