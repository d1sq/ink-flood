import { MODULE_ID } from '../constants';
import { advanceTime, formatTime } from '../engine/clock-engine';
import { startNewCycle, fullReset } from '../engine/cycle-engine';
import { syncFromSettings } from '../stores';
import type { CycleState } from '../types';

/**
 * Register chat commands: /ink-time, /ink-cycle, /ink-status
 */
export function registerChatCommands(): void {
  Hooks.on('chatMessage', (_chatLog: any, message: string, _chatData: any) => {
    const cmd = message.trim().toLowerCase();

    // /ink-time <minutes>
    if (cmd.startsWith('/ink-time')) {
      const parts = cmd.split(/\s+/);
      const mins = parseInt(parts[1]);
      if (isNaN(mins) || mins <= 0) {
        ui.notifications?.warn('Использование: /ink-time <минуты>');
        return false;
      }
      advanceTime(mins).then(() => {
        syncFromSettings();
        ui.notifications?.info(`Время продвинуто на ${mins} мин`);
      });
      return false; // Prevent message from appearing in chat
    }

    // /ink-cycle
    if (cmd === '/ink-cycle') {
      startNewCycle().then((state) => {
        syncFromSettings();
        if (!state) {
          ui.notifications?.error('Цикл 10 завершён — игра окончена');
        }
      });
      return false;
    }

    // /ink-status
    if (cmd === '/ink-status') {
      const state = game.settings.get(MODULE_ID, 'cycleState') as CycleState;
      const keys = [state.keys.matter, state.keys.word, state.keys.vision].filter(Boolean).length;
      const content = `
<div style="border-left: 4px solid #5c7cfa; padding: 8px 12px; background: #0a0a1a; border-radius: 4px; color: #e0e0e0;">
  <strong style="color: #c0c0ff;">Статус — Цикл ${state.cycle}/10</strong>
  <p style="margin: 4px 0;">Время: <strong>${formatTime(state.currentTime)}</strong> | Ключи: <strong>${keys}/3</strong> | Потоп: фаза ${state.floodPhase}/5</p>
</div>`;
      ChatMessage.create({ content, whisper: [game.user!.id] });
      return false;
    }

    // /ink-reset
    if (cmd === '/ink-reset') {
      fullReset().then(() => syncFromSettings());
      return false;
    }

    return true; // Not our command, pass through
  });
}
