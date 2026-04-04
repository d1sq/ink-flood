import type { FloodPhaseNumber } from '../types';
import { FLOOD_PHASES, FLOOD_CLOSING_TEXT } from '../data/flood-phases';

/** Generate styled chat HTML for a flood phase */
export function getFloodChatHTML(phase: FloodPhaseNumber): string {
  if (phase === 0) return '';
  const fp = FLOOD_PHASES[phase - 1];
  const isLast = phase === 5;

  const phaseColors: Record<number, string> = {
    1: '#4a4a6e',
    2: '#5555aa',
    3: '#7744aa',
    4: '#aa3333',
    5: '#cc1111',
  };

  const borderColor = phaseColors[phase] ?? '#333';

  return `
<div style="border-left: 4px solid ${borderColor}; padding: 8px 12px; margin: 4px 0; background: linear-gradient(135deg, #0a0a1a, #1a1a2e); border-radius: 4px; color: #e0e0e0; font-family: serif; font-size: 18px; font-weight: 500;">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
    <strong style="color: ${borderColor}; font-size: 1.1em;">Чернильный Потоп — Фаза ${phase}/5</strong>
    <span style="font-size: 0.8em; color: #888;">${fp.phase === 1 ? '17:30' : fp.phase === 2 ? '18:00' : fp.phase === 3 ? '18:30' : fp.phase === 4 ? '19:00' : '19:30'}</span>
  </div>
  <p style="margin: 4px 0; font-style: italic; color: #c0c0e0;">${fp.description}</p>
  <p style="margin: 4px 0; font-size: 0.9em; color: #ff8c44; border-top: 1px solid #333; padding-top: 4px;">⚙ ${fp.effects}</p>
  ${isLast ? `<hr style="border-color: #333; margin: 8px 0;">
  <p style="margin: 4px 0; font-style: italic; color: #8888aa; font-size: 0.95em;">${FLOOD_CLOSING_TEXT.replace('\n', '<br>')}</p>
  <p style="text-align: center; margin-top: 8px;"><strong style="color: #cc1111;">☠ Цикл завершён</strong></p>` : ''}
</div>`.trim();
}

/** Chat message for cycle start */
export function getCycleStartChatHTML(cycle: number): string {
  const flavorText = cycle === 1
    ? 'Свет в щели ставен. Жёсткие койки, скрип половиц, запах дыма и сырого камня из-за ставен. Колокола отбивают восемь. Незнакомый город за окном — вы приехали вчера вечером, едва успев бросить вещи. Новый день.'
    : 'Свет в щели ставен. Жёсткие койки, скрип половиц, запах дыма и сырого камня из-за ставен. Колокола отбивают восемь.';

  const tagline = cycle === 1
    ? '<strong>Новый день.</strong>'
    : cycle === 2
    ? '<strong>Кажется, это уже было.</strong>'
    : '<strong>Тот же день. Вы помните всё.</strong>';

  return `
<div style="border-left: 4px solid #5c7cfa; padding: 8px 12px; background: linear-gradient(135deg, #0a0a1a, #16213e); border-radius: 4px; color: #e0e0e0; font-family: serif; font-size: 18px; font-weight: 500;">
  <strong style="color: #c0c0ff; font-size: 1.1em;">Цикл ${cycle}</strong>
  <p style="margin: 4px 0; font-style: italic; color: #aab;">${flavorText}</p>
  <p style="margin: 4px 0; color: #c0c0e0;">${tagline}</p>
</div>`.trim();
}
