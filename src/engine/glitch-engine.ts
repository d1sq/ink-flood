import type { GlitchEffect, MarkTier } from '../types';
import { getGlitchForCycle } from '../data/glitch-tables';

export { getGlitchForCycle };

/** Get the Ink Trace tier for Ozzi based on cycle number */
export function getInkTraceTier(cycle: number): MarkTier {
  if (cycle <= 3) return 0;
  if (cycle <= 6) return 1;
  if (cycle <= 8) return 2;
  return 3;
}

/** Get the Watcher Mark tier for Igrit based on cycle number */
export function getWatcherMarkTier(cycle: number): MarkTier {
  if (cycle <= 3) return 0;
  if (cycle <= 6) return 1;
  if (cycle <= 8) return 2;
  return 3;
}

/** Ink Trace effect descriptions by tier */
export const INK_TRACE_EFFECTS: Record<MarkTier, string> = {
  0: 'Покалывание рядом с ключами. Направление неточное.',
  1: 'Прожилки темнеют. Вспышки «черновиков» — мир без потопа. Подсказки.',
  2: 'Шёпот. Обрывки на неизвестном языке. Расшифровать — Аркана, 15.',
  3: 'Пульсация. Шёпот непрерывный. Мудрость 15 в начале цикла — провал: помеха на Концентрацию.',
};

/** Watcher Mark effect descriptions by tier */
export const WATCHER_MARK_EFFECTS: Record<MarkTier, string> = {
  0: 'Дежавю. Мир — декорация.',
  1: 'Тени прошлых циклов. НИП повторяют жесты с точностью до секунды.',
  2: 'Эхо. Может предсказать фразу НИП (преимущество на Проницательность).',
  3: 'Метка болит. Контуры башни видны сквозь стены.',
};
