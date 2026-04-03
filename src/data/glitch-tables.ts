import type { GlitchEffect, EventId } from '../types';

/**
 * Glitch definitions per cycle range.
 * From "06 Глитчи и финал.md"
 */
export const GLITCH_TABLE: GlitchEffect[] = [
  {
    minCycle: 7,
    dcModifier: 1,
    floodTimeShift: 0,
    eventTimeShifts: {},
    descriptions: [
      'НИП замирают на 1-2 секунды, потом продолжают как ни в чём не бывало',
      'Чернильные кляксы на стенах — мелкие, незаметные',
      'Тени падают не в ту сторону',
      'Запах чернил у башни',
      'Одно событие сдвигается на ±15 мин (выбор ГМ)',
    ],
  },
  {
    minCycle: 8,
    dcModifier: 1,
    floodTimeShift: 0,
    eventTimeShifts: {
      execution: -30,   // 09:30 → 09:00 (Кель уже мёртв)
      temple: -30,      // 11:00 → 10:30 (люстра в 10:40)
    },
    descriptions: [
      'DC +1 для всех сцен',
      'Казнь перенесена на 09:00 — Кель уже мёртв к приходу',
      'Служба в 10:30, люстра падает в 10:40',
      'Остальные события сдвигаются на 10-15 мин раньше',
      'НИП замирают на 5-10 сек, иногда говорят задом наперёд',
      'Свет тусклый, небо жёлто-серое',
      'Кляксы повсюду',
    ],
  },
  {
    minCycle: 9,
    dcModifier: 2,
    floodTimeShift: -30,  // Потоп в 17:00
    eventTimeShifts: {
      execution: -30,
      temple: -30,
    },
    descriptions: [
      'DC +2 для всех сцен',
      'Потоп начинается в 17:00 (на 30 мин раньше)',
      'Казнь и Служба ОДНОВРЕМЕННО в 09:30 — партия должна разделиться',
      'Вывески размыты, нечитаемы',
      'Рисунки на стенах — сцены из прошлых циклов',
      'НИП помнят фрагменты — каждый может произнести одну фразу из прошлого цикла',
      'Одна локация «наложилась» на другую (бросок d6 ГМ)',
    ],
  },
  {
    minCycle: 10,
    dcModifier: 3,
    floodTimeShift: -150, // Потоп в 15:00
    eventTimeShifts: {
      execution: -30,
      temple: -30,
    },
    descriptions: [
      'DC +3 для всех сцен',
      'Потоп начинается в 15:00 (только 7 часов на всё)',
      'Один ключ уничтожен до начала дня (выбор ГМ)',
      'Новые пути через трещины в реальности',
      'Призраки чернил — силуэты погибших из прошлых циклов',
      'Цвет уходит из мира — светятся только ключи',
      'Локации частично разрушаются',
    ],
  },
];

/** Get active glitch for a given cycle number */
export function getGlitchForCycle(cycle: number): GlitchEffect | null {
  // Find the highest-minCycle glitch that applies
  let result: GlitchEffect | null = null;
  for (const g of GLITCH_TABLE) {
    if (cycle >= g.minCycle) {
      result = g;
    }
  }
  return result;
}
