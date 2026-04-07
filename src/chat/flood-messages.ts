import type { FloodPhaseNumber, EventId } from '../types';
import { FLOOD_PHASES, getFloodClosingText } from '../data/flood-phases';
import type { EventDefinition } from '../types';

/** Generate styled chat HTML for a flood phase */
export function getFloodChatHTML(phase: FloodPhaseNumber, cycle: number = 1): string {
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
  const closingText = getFloodClosingText(cycle);

  return `
<div style="border-left: 4px solid ${borderColor}; padding: 8px 12px; margin: 4px 0; background: linear-gradient(135deg, #0a0a1a, #1a1a2e); border-radius: 4px; color: #e0e0e0; font-family: serif; font-size: 18px; font-weight: 500;">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
    <strong style="color: ${borderColor}; font-size: 1.1em;">Чернильный Потоп — Фаза ${phase}/5</strong>
    <span style="font-size: 0.8em; color: #888;">${fp.phase === 1 ? '17:30' : fp.phase === 2 ? '18:00' : fp.phase === 3 ? '18:30' : fp.phase === 4 ? '19:00' : '19:30'}</span>
  </div>
  <p style="margin: 4px 0; font-style: italic; color: #c0c0e0;">${fp.description}</p>
  <p style="margin: 4px 0; font-size: 0.9em; color: #ff8c44; border-top: 1px solid #333; padding-top: 4px;">⚙ ${fp.effects}</p>
  ${isLast ? `<hr style="border-color: #333; margin: 8px 0;">
  <p style="margin: 4px 0; font-style: italic; color: #8888aa; font-size: 0.95em;">${closingText.replace('\n', '<br>')}</p>
  <p style="text-align: center; margin-top: 8px;"><strong style="color: #cc1111;">☠ Цикл завершён</strong></p>` : ''}
</div>`.trim();
}

/** Chat message for cycle start */
export function getCycleStartChatHTML(cycle: number): string {
  let flavorText: string;
  let tagline: string;

  if (cycle === 1) {
    flavorText = 'Свет в щели ставен. Жёсткие койки, скрип половиц, запах дыма и сырого камня из-за ставен. Колокола отбивают восемь. Незнакомый город за окном — вы приехали вчера вечером, едва успев бросить вещи. Новый день.';
    tagline = '<strong>Новый день.</strong>';
  } else if (cycle === 2) {
    flavorText = 'Свет в щели ставен. Жёсткие койки, скрип половиц, запах дыма и сырого камня из-за ставен. Колокола отбивают восемь.';
    tagline = '<strong>Кажется, это уже было.</strong>';
  } else if (cycle <= 3) {
    flavorText = 'Свет в щели ставен. Жёсткие койки, скрип половиц, запах дыма и сырого камня из-за ставен. Колокола отбивают восемь.';
    tagline = '<strong>Тот же день. Вы помните всё.</strong>';
  } else {
    // Cycles 4+: short version
    flavorText = 'Восемь ударов. Пыльная Подкова. Тот же день.';
    tagline = '<strong>Вы помните всё.</strong>';
  }

  return `
<div style="border-left: 4px solid #5c7cfa; padding: 8px 12px; background: linear-gradient(135deg, #0a0a1a, #16213e); border-radius: 4px; color: #e0e0e0; font-family: serif; font-size: 18px; font-weight: 500;">
  <strong style="color: #c0c0ff; font-size: 1.1em;">Цикл ${cycle}</strong>
  <p style="margin: 4px 0; font-style: italic; color: #aab;">${flavorText}</p>
  <p style="margin: 4px 0; color: #c0c0e0;">${tagline}</p>
</div>`.trim();
}

/** Chat message for event read-aloud (sent to all players) */
export function getEventReadAloudHTML(def: EventDefinition, short: boolean): string {
  const text = short ? def.shortDescription : def.description;
  return `
<div style="border-left: 4px solid #5c7cfa; padding: 8px 12px; background: linear-gradient(135deg, #0a0a1a, #1a1a2e); border-radius: 4px; color: #e0e0e0; font-family: serif; font-size: 18px; font-weight: 500;">
  <p style="margin: 0; font-style: italic; color: #c0c0e0; line-height: 1.5;">${text}</p>
</div>`.trim();
}

/** Briefing hints for morning summary (one per event) */
export const BRIEFING_HINTS: Record<EventId, string> = {
  dawn: 'Постоялец за соседним столом бормочет: «Стена у ворот опять блестела на рассвете... Старики говорят — глаз стража.»',
  execution: 'На площади готовят эшафот — будет казнь.',
  governor: 'Слуга губернатора заходил за свежим хлебом — Бруммель завтракает.',
  temple: 'В храме звонят к утренней службе.',
  market: 'Купцы на Нижнем Рынке ругаются из-за какой-то странной монеты.',
  alley: 'Кто-то из работяг упоминает нервного типа с конвертом у складов.',
  shop: 'Лавка антиквара уже открыта — старик расставляет хлам в витрине.',
  chapel: 'Кладбищенский сторож проходит мимо: «Опять этот старик придёт бормотать...»',
  lighthouse: 'Обозник ворчит: «Конрад опять полезет чистить свою линзу.»',
};

/** Generate morning briefing HTML (GM whisper) */
export function getBriefingChatHTML(
  cycle: number,
  availableEventIds: EventId[],
  firstKeyDirection?: string,
): string {
  const hints = availableEventIds
    .map(id => BRIEFING_HINTS[id])
    .filter(Boolean)
    .map(h => `<li style="color: #ccc; margin: 3px 0;">${h}</li>`)
    .join('');

  const ozziLine = cycle >= 5 && firstKeyDirection
    ? `<p style="margin: 8px 0 0; font-style: italic; color: #7788cc;">Чернильный след Оззи покалывает — тянет ${firstKeyDirection}.</p>`
    : '';

  return `
<div style="border-left: 4px solid #5c7cfa; padding: 8px 12px; background: linear-gradient(135deg, #0a0a1a, #16213e); border-radius: 4px; color: #e0e0e0; font-size: 17px; font-weight: 500;">
  <strong style="color: #c0c0ff; font-size: 1.1em;">Утренняя сводка — Цикл ${cycle}</strong>
  <p style="margin: 4px 0; color: #aab;">За завтраком вы слышите город:</p>
  <ul style="margin: 4px 0; padding-left: 18px;">${hints}</ul>
  ${ozziLine}
</div>`.trim();
}
