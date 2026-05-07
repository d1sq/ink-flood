/**
 * Locale-driven translation overlay for compendium actor names.
 *
 * Canonical actor names in the pack are English (e.g. "Kel", "Ink Silhouette").
 * When Foundry's locale is set to Russian, we patch the pack index and any
 * actor created from the pack so the GM sees Russian names in the compendium
 * browser, the actor sheet, and tokens dropped onto a scene.
 *
 * Item names inside actors are already authored in Russian (the canonical
 * adventure language) and don't need a translation overlay.
 */

/** lang code → { english actor name → localized name } */
export const ACTOR_NAME_TRANSLATIONS: Record<string, Record<string, string>> = {
  ru: {
    // Living NPCs
    'Kel': 'Кель',
    'Heinz Brummel': 'Хайнц Бруммель',
    'Mother Elza': 'Мать Эльза',
    'Victor Nagel': 'Виктор Нагель',
    'Olbrecht': 'Ольбрехт',
    'Konrad Weiss': 'Конрад Вейс',
    'Fritz Gamm': 'Фриц Гамм',
    'Erwin Sivern': 'Эрвин Сиверн',
    // Ink manifestations
    'Ink Silhouette': 'Чернильный Силуэт',
    'Ink Chorus': 'Чернильный Хор',
    'Echo of Kel': 'Оттиск Келя',
    'Echo of Elza': 'Оттиск Эльзы',
    'Echo of Fritz': 'Оттиск Фрица',
    'Echo of Konrad': 'Оттиск Конрада',
    'Echo of Olbrecht': 'Оттиск Ольбрехта',
    'Echo of Brummel': 'Оттиск Бруммеля',
    'Echo of Nagel': 'Оттиск Нагеля',
  },
};

/** Get the active translation map for the current Foundry locale, or null */
export function getActiveActorNameMap(): Record<string, string> | null {
  const lang = (game as any)?.i18n?.lang;
  if (!lang) return null;
  return ACTOR_NAME_TRANSLATIONS[lang] ?? null;
}
