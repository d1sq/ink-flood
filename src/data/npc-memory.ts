import type { NpcInteractionId } from '../types';

export interface NpcInteractionDef {
  id: NpcInteractionId;
  npc: string;
  label: string;
  /** Hints shown when count reaches threshold */
  hints: { minCount: number; text: string }[];
}

export const NPC_INTERACTIONS: NpcInteractionDef[] = [
  // === Кель ===
  {
    id: 'kel-saved',
    npc: 'Кель',
    label: 'Спасён',
    hints: [
      { minCount: 2, text: 'В момент спасения зажмуривается, будто знает, что сейчас произойдёт — но тут же «забывает».' },
    ],
  },
  {
    id: 'kel-ignored',
    npc: 'Кель',
    label: 'Казнён / проигнорирован',
    hints: [
      { minCount: 2, text: 'Каждый раз один и тот же крик: «Я ничего не сделал!» Именно одинаковость должна царапать игроков.' },
    ],
  },

  // === Бруммель ===
  {
    id: 'governor-flattered',
    npc: 'Бруммель',
    label: 'Льстили',
    hints: [
      { minCount: 3, text: 'При первом комплименте морщится: «Да-да, я великолепен. Дальше.» Привычная лесть не работает с первого слова.' },
    ],
  },
  {
    id: 'governor-robbed',
    npc: 'Бруммель',
    label: 'Обворовывали',
    hints: [
      { minCount: 1, text: 'Утром проверяет печать чаще, вертит в руках. Не помнит, но руки помнят.' },
    ],
  },
  {
    id: 'governor-honest',
    npc: 'Бруммель',
    label: 'Обращались честно',
    hints: [
      { minCount: 1, text: 'При встрече задерживает взгляд на партии на секунду дольше, чем на других гостей.' },
    ],
  },

  // === Мать Эльза ===
  {
    id: 'elza-saved',
    npc: 'Мать Эльза',
    label: 'Спасена от люстры',
    hints: [
      { minCount: 2, text: 'В момент падения не кричит. Стоит неподвижно, будто ждёт. Если спасут — тихо: «Спасибо. Я знала, что кто-то придёт.»' },
    ],
  },
  {
    id: 'elza-died',
    npc: 'Мать Эльза',
    label: 'Погибла',
    hints: [
      { minCount: 2, text: 'Перед падением смотрит вверх — секунда тишины, будто прислушивается к чему-то.' },
    ],
  },
  {
    id: 'elza-prayer-learned',
    npc: 'Мать Эльза',
    label: 'Молитва выучена',
    hints: [
      { minCount: 3, text: 'Произносит чуть по-другому. Одно слово не то. Восприятие 18 — слово правильное, это в прошлых циклах она ошибалась. Петля шлифует.' },
    ],
  },

  // === Нагель ===
  {
    id: 'nagel-fought',
    npc: 'Нагель',
    label: 'Дрались',
    hints: [
      { minCount: 2, text: 'В начале боя смотрит на оружие того, кто его ранил в прошлом цикле. Инстинктивно держит дистанцию.' },
    ],
  },
  {
    id: 'nagel-spared',
    npc: 'Нагель',
    label: 'Отпустили',
    hints: [
      { minCount: 1, text: 'Чуть медлит перед ударом по Фрицу. Секунда. Потом бьёт как обычно.' },
    ],
  },
  {
    id: 'nagel-killed',
    npc: 'Нагель',
    label: 'Убит',
    hints: [
      { minCount: 2, text: 'Умирает молча. Но если хотя бы раз отпускали — в момент смерти бросает взгляд на того, кто его тогда пощадил.' },
    ],
  },

  // === Ольбрехт ===
  {
    id: 'olbrecht-defended',
    npc: 'Ольбрехт',
    label: 'Лавку защитили',
    hints: [
      { minCount: 2, text: 'При появлении партии улыбается, хотя видит их впервые. Списывает на хорошие лица.' },
    ],
  },
  {
    id: 'olbrecht-lens-broken',
    npc: 'Ольбрехт',
    label: 'Линзу разбили / украли',
    hints: [
      { minCount: 1, text: 'Гладит Клару перед тем, как поставить на витрину. «Сегодня ты останешься целой, правда?» Говорит вещам, не людям.' },
    ],
  },

  // === Конрад ===
  {
    id: 'konrad-persuaded',
    npc: 'Конрад',
    label: 'Убедили не снимать',
    hints: [
      { minCount: 2, text: 'Руки задерживаются на механизме. Ворчит тише. Не снимает — но не потому что убедили. Просто сегодня почему-то не хочется.' },
    ],
  },
  {
    id: 'konrad-lens-fell',
    npc: 'Конрад',
    label: 'Линза упала',
    hints: [
      { minCount: 1, text: 'Утром трогает линзу осторожнее. Протирает дольше. «Двадцать лет...» — бормочет без причины.' },
    ],
  },
  {
    id: 'konrad-respected',
    npc: 'Конрад',
    label: 'Проявили уважение',
    hints: [
      { minCount: 1, text: 'При встрече не гонит сразу. Пауза. Потом всё равно: «Башня — не экскурсия.» Но пауза была.' },
    ],
  },

  // === Фриц ===
  {
    id: 'fritz-saved',
    npc: 'Фриц',
    label: 'Спасён',
    hints: [
      { minCount: 1, text: 'Потеет сильнее, оглядывается чаще. Не помнит, но тело в тревоге.' },
      { minCount: 3, text: 'Не кричит при виде партии. Молча протягивает конверт. Не знает почему.' },
    ],
  },
  {
    id: 'fritz-died',
    npc: 'Фриц',
    label: 'Погиб',
    hints: [
      { minCount: 3, text: 'На лице — обречённость, которой раньше не было. Будто знает, чем всё кончится.' },
    ],
  },
];

/** Which NPC interactions are relevant to which event */
export const EVENT_NPC_MAP: Record<string, NpcInteractionId[]> = {
  execution: ['kel-saved', 'kel-ignored'],
  governor: ['governor-flattered', 'governor-robbed', 'governor-honest'],
  temple: ['elza-saved', 'elza-died', 'elza-prayer-learned'],
  alley: ['nagel-fought', 'nagel-spared', 'nagel-killed', 'fritz-saved', 'fritz-died'],
  shop: ['olbrecht-defended', 'olbrecht-lens-broken'],
  lighthouse: ['konrad-persuaded', 'konrad-lens-fell', 'konrad-respected'],
  chapel: [],
  dawn: [],
  market: [],
};

/** Get active hints relevant to a specific event */
export function getHintsForEvent(eventId: string, memory: Record<string, number>): { npc: string; text: string }[] {
  const relevantIds = EVENT_NPC_MAP[eventId] ?? [];
  if (relevantIds.length === 0) return [];

  const hints: { npc: string; text: string }[] = [];
  for (const id of relevantIds) {
    const def = NPC_INTERACTIONS.find(d => d.id === id);
    if (!def) continue;
    const count = memory[id] ?? 0;
    if (count === 0) continue;
    let best: { minCount: number; text: string } | undefined;
    for (const h of def.hints) {
      if (count >= h.minCount && (!best || h.minCount > best.minCount)) {
        best = h;
      }
    }
    if (best) hints.push({ npc: def.npc, text: best.text });
  }
  return hints;
}

/** Group interactions by NPC name */
export function getInteractionsByNpc(): Map<string, NpcInteractionDef[]> {
  const map = new Map<string, NpcInteractionDef[]>();
  for (const def of NPC_INTERACTIONS) {
    if (!map.has(def.npc)) map.set(def.npc, []);
    map.get(def.npc)!.push(def);
  }
  return map;
}

/** Get active hints for current memory state */
export function getActiveHints(memory: Record<string, number>): { npc: string; text: string }[] {
  const hints: { npc: string; text: string }[] = [];
  for (const def of NPC_INTERACTIONS) {
    const count = memory[def.id] ?? 0;
    if (count === 0) continue;
    // Find the highest applicable hint
    let best: { minCount: number; text: string } | undefined;
    for (const h of def.hints) {
      if (count >= h.minCount && (!best || h.minCount > best.minCount)) {
        best = h;
      }
    }
    if (best) hints.push({ npc: def.npc, text: best.text });
  }
  return hints;
}
