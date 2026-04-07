import type { FloodPhase } from '../types';

/** Default flood phases (times in minutes from midnight) */
export const FLOOD_PHASES: FloodPhase[] = [
  {
    phase: 1,
    defaultTime: 1050, // 17:30
    description:
      'Чернила сочатся из стоков и трещин в мостовой. Лужицы — густые, тёмные. Горожане не замечают.',
    effects: 'Нет механических эффектов. Атмосфера.',
  },
  {
    phase: 2,
    defaultTime: 1080, // 18:00
    description:
      'По щиколотку. Холодные, вязкие, пахнут старой бумагой. Паника на улицах. Люди бегут к домам.',
    effects: 'Паника НИП. Труднопроходимая местность в низких зонах.',
  },
  {
    phase: 3,
    defaultTime: 1110, // 18:30
    description:
      'По пояс. Скорость уполовинена. Стены теряют цвет — краска стекает в чернила. Буквы на вывесках расплываются.',
    effects: 'Скорость ×0.5. КС Телосложения 16 или 1 уровень истощения.',
  },
  {
    phase: 4,
    defaultTime: 1140, // 19:00
    description:
      'По грудь. Дышать всё труднее. Чернила лезут в рот, в глаза. Мир теряет очертания.',
    effects: 'КС Телосложения 16 каждые 10 мин или истощение. 1d4 некротического урона за раунд контакта.',
  },
  {
    phase: 5,
    defaultTime: 1170, // 19:30
    description:
      'Полное погружение. Темнота. Последнее — Тёмная башня посреди чёрного озера. Потом — ничего.',
    effects: 'Смерть. Ресет цикла.',
  },
];

/**
 * Flood closing read-aloud text by cycle range (posted at phase 5).
 * From "01 Правила цикла.md"
 */
export const FLOOD_CLOSING_TEXTS: { maxCycle: number; text: string }[] = [
  {
    maxCycle: 3,
    text: 'Чернила поднимаются. Не вода — гуще, холоднее. Цвет уходит из вывесок, потом из лиц. Буквы расплываются. Последнее — Тёмная башня посреди чёрного озера.\nТемнота. Восемь ударов.',
  },
  {
    maxCycle: 6,
    text: 'Чернила. Опять. Город тонет. Вы это уже знаете.\nТемнота. Восемь ударов.',
  },
  {
    maxCycle: 9,
    text: 'Чернила поднимаются — но не снизу. Они проступают из стен, из вывесок, из лиц горожан. Горожане не бегут. Стоят неподвижно, по пояс в чернилах, и смотрят на башню. Все одновременно. Тишина.\nТемнота. Восемь ударов. Тише, чем обычно.',
  },
  {
    maxCycle: 10,
    text: 'Темнота. Восемь ударов.',
  },
];

/** Get flood closing text appropriate for the current cycle */
export function getFloodClosingText(cycle: number): string {
  for (const entry of FLOOD_CLOSING_TEXTS) {
    if (cycle <= entry.maxCycle) return entry.text;
  }
  return FLOOD_CLOSING_TEXTS[FLOOD_CLOSING_TEXTS.length - 1].text;
}

/** @deprecated Use getFloodClosingText(cycle) instead */
export const FLOOD_CLOSING_TEXT =
  'Чернила поднимаются. Не вода — гуще, холоднее. Цвет уходит из вывесок, потом из лиц. Буквы расплываются. Последнее — Тёмная башня посреди чёрного озера.\nТемнота. Восемь ударов.';
