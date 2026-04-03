import type { EventDefinition, SlotType, EventId } from '../types';

/** All 9 events. Times in minutes from midnight. */
export const EVENTS: EventDefinition[] = [
  {
    id: 'dawn',
    time: 510,  // 08:30
    duration: 30,
    location: 'port',
    keyId: 'dawn-lens',
    slot: 'vision',
    nameKey: 'INK_FLOOD.events.dawn',
    description: 'Набережная на рассвете. Солнце низкое, красное. Лучи бьют в старую стену причала — и на камне проступает мозаика, которую не видно ни в какое другое время. Стеклянные осколки в форме глаза. Цветная линза в центре горит, как маленькое солнце.',
    shortDescription: 'Порт, мозаика с линзой. До 09:00.',
  },
  {
    id: 'execution',
    time: 570,  // 09:30
    duration: 15,
    location: 'square',
    keyId: 'glass-key',
    slot: 'matter',
    nameKey: 'INK_FLOOD.events.execution',
    description: 'Площадь забита народом. Вокруг эшафота — четверо стражников. На помосте — палач и мальчишка с перебитым носом. На шее — стеклянная подвеска.',
    shortDescription: 'Площадь, казнь Келя. Подвеска на шее.',
  },
  {
    id: 'governor',
    time: 600,  // 10:00
    duration: 60,
    location: 'residence',
    keyId: 'seal',
    slot: 'matter',
    nameKey: 'INK_FLOOD.events.governor',
    description: 'Резиденция на холме. Запах хлеба и мяса. Бруммель завтракает, печать на столе рядом с тарелкой.',
    shortDescription: 'Резиденция. Печать на столе до 11:00.',
  },
  {
    id: 'temple',
    time: 660,  // 11:00
    duration: 15,
    location: 'temple',
    keyId: 'prayer',
    slot: 'word',
    nameKey: 'INK_FLOOD.events.temple',
    description: 'Храм. Мать Эльза у алтаря, молитва беззвучно. Кованая люстра над ней — тросы подпилены. В 11:15 падает.',
    shortDescription: 'Храм. Люстра падает в 11:15. Молитва Отмены.',
  },
  {
    id: 'market',
    time: 720,  // 12:00
    duration: 20,
    location: 'market',
    keyId: 'coin',
    slot: 'matter',
    nameKey: 'INK_FLOOD.events.market',
    description: 'Нижний Рынок в полдень. У прилавка рыбак продаёт чёрную монету. Башня на одной стороне, три символа треугольником на другой.',
    shortDescription: 'Рынок. Монета уйдёт за 2 серебряных в 12:20.',
  },
  {
    id: 'alley',
    time: 780,  // 13:00
    duration: 15,
    location: 'alley',
    keyId: 'confession',
    slot: 'word',
    nameKey: 'INK_FLOOD.events.alley',
    description: 'Переулок между складами. Фриц с конвертом, Нагель в сером плаще. В 13:15 — драка, письмо в канализацию.',
    shortDescription: 'Переулок. Фриц + Нагель. Письмо тонет в 13:15.',
  },
  {
    id: 'shop',
    time: 840,  // 14:00
    duration: 5,
    location: 'shop',
    keyId: 'truth-lens',
    slot: 'vision',
    nameKey: 'INK_FLOOD.events.shop',
    description: 'Лавка Ольбрехта. На витрине — стеклянный диск, светится изнутри. С улицы — крики мародёров. В 14:05 разобьют всё.',
    shortDescription: 'Лавка. Линза. Мародёры в 14:05.',
  },
  {
    id: 'chapel',
    time: 960,  // 16:00
    duration: 30,
    location: 'chapel',
    keyId: 'oath',
    slot: 'word',
    nameKey: 'INK_FLOOD.events.chapel',
    description: 'Часовня у кладбища. В четыре входит старик, садится и бормочет Клятву Хранителя. В 16:30 уходит.',
    shortDescription: 'Часовня. Старик с клятвой. 16:00–16:30.',
  },
  {
    id: 'lighthouse',
    time: 1020, // 17:00
    duration: 30,
    location: 'lighthouse',
    keyId: 'lighthouse-eye',
    slot: 'vision',
    nameKey: 'INK_FLOOD.events.lighthouse',
    description: 'Маяк на мысе. Конрад Вейс наверху чистит линзу. В 17:30 роняет — 60 футов, вдребезги.',
    shortDescription: 'Маяк. Конрад роняет линзу в 17:30.',
  },
];

/** Events grouped by slot type */
export const EVENTS_BY_SLOT: Record<SlotType, EventId[]> = {
  matter: ['execution', 'governor', 'market'],
  word: ['temple', 'alley', 'chapel'],
  vision: ['dawn', 'shop', 'lighthouse'],
};

/** Get event definition by ID */
export function getEvent(id: EventId): EventDefinition {
  return EVENTS.find(e => e.id === id)!;
}

/** Format minutes-from-midnight as HH:MM */
export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}
