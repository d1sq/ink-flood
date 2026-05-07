import type { EncounterDefinition, NpcId } from '../types';

/**
 * Definitions for the 9 ink manifestations.
 *
 * Spawn windows reflect the canonical schedule from
 * `Готовые/Чернильный потоп/05 Энкаунтеры и статблоки.md`:
 *
 * - 1-3: nothing (loop is intact)
 * - 4-5: 1 silhouette in a shaded location during inter-scene gaps
 * - 6: silhouettes + a daytime "rooftop dash" + flood-window touch
 * - 7-8: chorus breaks into a daytime scene; silhouettes in alleys
 * - 9: an echo of a dead NPC stands at their place of death
 * - 10: ambient-only — manifestations are everywhere, no first-strike
 *
 * Day window is 510-1020 (08:30-17:00); flood window is 1050-1170 (17:30-19:30).
 * Locations match `TRAVEL_MATRIX` keys in `src/constants.ts`.
 */
export const ENCOUNTER_DEFINITIONS: EncounterDefinition[] = [
  {
    id: 'silhouette',
    type: 'silhouette',
    name: 'Ink Silhouette',
    nameRu: 'Чернильный Силуэт',
    cycleRange: [4, 10],
    spawnWindows: [
      { cycleMin: 4, timeRange: [690, 720], location: 'alley', note: 'Полуденный затенённый переулок между складами' },
      { cycleMin: 5, timeRange: [840, 960], location: 'shop', note: 'После погрома в лавке антиквара, в сумраке между полок' },
      { cycleMin: 6, timeRange: [600, 660], location: 'temple', note: 'В нижних ярусах храма, силуэт перебегает в боковом проходе' },
      { cycleMin: 7, timeRange: [1050, 1170], location: 'alley', note: 'Окно потопа: силуэт по пояс в чернилах у канализационного стока' },
      { cycleMin: 8, timeRange: [510, 1020], note: 'Серое небо, любая локация. Силуэт перебегает крышу храма и пропадает' },
      { cycleMin: 10, timeRange: [510, 900], note: 'Стоит как декорация в любой локации. Не атакует первым' },
    ],
    compendiumActor: 'Ink Silhouette',
    portrait: 'modules/ink-flood/assets/actors/Чернильный Силуэт.png',
  },
  {
    id: 'chorus',
    type: 'chorus',
    name: 'Ink Chorus',
    nameRu: 'Чернильный Хор',
    cycleRange: [7, 10],
    spawnWindows: [
      { cycleMin: 7, timeRange: [720, 750], location: 'market', note: 'Шепчет посреди рынка, торговцы замерли' },
      { cycleMin: 8, timeRange: [660, 720], location: 'temple', note: 'Стоит в центральном проходе храма, свечи гнутся к нему' },
      { cycleMin: 9, timeRange: [990, 1050], location: 'wall', note: 'Мост у канала на закате — отражение в воде одиночное' },
      { cycleMin: 9, timeRange: [1050, 1170], note: 'В наводнении вместе с силуэтами' },
    ],
    compendiumActor: 'Ink Chorus',
    portrait: 'modules/ink-flood/assets/actors/Чернильный Хор.png',
  },
  {
    id: 'echo-kel',
    type: 'echo',
    echoOf: 'kel',
    name: 'Echo of Kel',
    nameRu: 'Оттиск Келя',
    cycleRange: [9, 10],
    spawnWindows: [
      { cycleMin: 9, timeRange: [600, 1020], location: 'square', note: 'У эшафота, после казни. Сидит на коньке крыши как дворовая ворона' },
      { cycleMin: 10, timeRange: [510, 900], location: 'square', note: 'Стоит у фонтана, протягивает стеклянную подвеску (см. Цикл 10 в финале)' },
    ],
    defaultLocation: 'square',
    compendiumActor: 'Echo of Kel',
    portrait: 'modules/ink-flood/assets/actors/Кель Чернильный.png',
  },
  {
    id: 'echo-elza',
    type: 'echo',
    echoOf: 'elza',
    name: 'Echo of Elza',
    nameRu: 'Оттиск Эльзы',
    cycleRange: [9, 10],
    spawnWindows: [
      { cycleMin: 9, timeRange: [600, 1020], location: 'temple', note: 'У алтаря, лицом к зрителю. Свеча в руке горит синим' },
      { cycleMin: 10, timeRange: [510, 900], location: 'temple', note: 'Концентрический круг чернил у её ног' },
    ],
    defaultLocation: 'temple',
    compendiumActor: 'Echo of Elza',
    portrait: 'modules/ink-flood/assets/actors/Эльза Чернильный.png',
  },
  {
    id: 'echo-fritz',
    type: 'echo',
    echoOf: 'fritz',
    name: 'Echo of Fritz',
    nameRu: 'Оттиск Фрица',
    cycleRange: [9, 10],
    spawnWindows: [
      { cycleMin: 9, timeRange: [780, 1020], location: 'alley', note: 'Прижался спиной к стене переулка, в руке размокшее письмо' },
    ],
    defaultLocation: 'alley',
    compendiumActor: 'Echo of Fritz',
    portrait: 'modules/ink-flood/assets/actors/Фриц Чернильный.png',
  },
  {
    id: 'echo-konrad',
    type: 'echo',
    echoOf: 'konrad',
    name: 'Echo of Konrad',
    nameRu: 'Оттиск Конрада',
    cycleRange: [9, 10],
    spawnWindows: [
      { cycleMin: 9, timeRange: [600, 1020], location: 'lighthouse', note: 'На парапете башни, готов метнуть осколок' },
    ],
    defaultLocation: 'lighthouse',
    compendiumActor: 'Echo of Konrad',
    portrait: 'modules/ink-flood/assets/actors/Конрад Чернильный.png',
  },
  {
    id: 'echo-olbrecht',
    type: 'echo',
    echoOf: 'olbrecht',
    name: 'Echo of Olbrecht',
    nameRu: 'Оттиск Ольбрехта',
    cycleRange: [9, 10],
    spawnWindows: [
      { cycleMin: 9, timeRange: [600, 1020], location: 'shop', note: 'За прилавком разорённой лавки + полупрозрачный двойник' },
    ],
    defaultLocation: 'shop',
    compendiumActor: 'Echo of Olbrecht',
    portrait: 'modules/ink-flood/assets/actors/Ольбрехт Чернильный.png',
  },
  {
    id: 'echo-brummel',
    type: 'echo',
    echoOf: 'brummel',
    name: 'Echo of Brummel',
    nameRu: 'Оттиск Бруммеля',
    cycleRange: [9, 10],
    spawnWindows: [
      { cycleMin: 10, timeRange: [510, 900], location: 'square', note: 'У ступеней Тёмной башни, сжимает печать' },
    ],
    defaultLocation: 'square',
    compendiumActor: 'Echo of Brummel',
    portrait: 'modules/ink-flood/assets/actors/Бруммель Чернильный.png',
  },
  {
    id: 'echo-nagel',
    type: 'echo',
    echoOf: 'nagel',
    name: 'Echo of Nagel',
    nameRu: 'Оттиск Нагеля',
    cycleRange: [9, 10],
    spawnWindows: [
      { cycleMin: 9, timeRange: [780, 1020], location: 'alley', note: 'Тот же переулок, где он стоял; «отпечаток» на стене у Фрица' },
    ],
    defaultLocation: 'alley',
    compendiumActor: 'Echo of Nagel',
    portrait: 'modules/ink-flood/assets/actors/Нагель Чернильный.png',
  },
];

/** Map encounter id → definition for O(1) lookup */
export const ENCOUNTER_BY_ID: Record<string, EncounterDefinition> = Object.fromEntries(
  ENCOUNTER_DEFINITIONS.map((e) => [e.id, e])
);

/** Ordered list of NPC ids — useful for UI rendering */
export const NPC_IDS: NpcId[] = ['kel', 'brummel', 'elza', 'nagel', 'olbrecht', 'konrad', 'fritz'];

/** NPC display names (Russian, for UI) */
export const NPC_NAMES_RU: Record<NpcId, string> = {
  kel: 'Кель',
  brummel: 'Хайнц Бруммель',
  elza: 'Мать Эльза',
  nagel: 'Виктор Нагель',
  olbrecht: 'Ольбрехт',
  konrad: 'Конрад Вейс',
  fritz: 'Фриц Гамм',
};
