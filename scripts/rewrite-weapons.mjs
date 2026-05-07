// Rewrite all weapon items to dnd5e 5.x schema with `activities`.
// Old (pre-5.x) format used flat actionType + damage.parts at system level;
// new format uses system.damage.base + system.activities.X.attack/damage.
// Also: replace Ink Summon with self-copy summon for Kel and Nagel echoes.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(__dirname, '../data/compendium/actors');

function load(file) { return JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')); }
function save(file, doc) { fs.writeFileSync(path.join(dir, file), JSON.stringify(doc, null, 2) + '\n', 'utf8'); }

/** Parse "1d4 + 4" into { number, denomination, bonus } */
function parseFormula(formula) {
  const m = String(formula).trim().match(/^(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?$/);
  if (!m) return { number: null, denomination: null, bonus: String(formula).trim() };
  const [, n, d, sign, b] = m;
  const bonus = b ? `${sign === '-' ? '-' : '+'}${b}` : '';
  return { number: parseInt(n), denomination: parseInt(d), bonus };
}

function emptyDamageDie() {
  return {
    number: null, denomination: null, bonus: '', types: [],
    custom: { enabled: false, formula: '' },
    scaling: { mode: '', number: null, formula: '' },
  };
}

function damageDie(formula, types) {
  const p = parseFormula(formula);
  return {
    number: p.number, denomination: p.denomination, bonus: p.bonus,
    types: Array.isArray(types) ? types : [types],
    custom: { enabled: false, formula: '' },
    scaling: { mode: '', number: null, formula: '' },
  };
}

/**
 * Convert a single weapon item from old to new schema.
 * Mutates in-place.
 */
function convertWeapon(item) {
  const sys = item.system;
  const oldActionType = sys.actionType; // 'mwak' | 'rwak' | 'msak' | 'rsak'
  const oldDamageParts = (sys.damage && Array.isArray(sys.damage.parts)) ? sys.damage.parts : [];
  const oldRange = sys.range || { value: 5, units: 'ft' };
  const oldAbility = sys.ability || 'dex';
  const oldWeaponType = sys.weaponType || 'simpleM';
  const oldProperties = sys.properties || {};
  const oldProficient = sys.proficient;

  // New top-level fields
  sys.type = { value: oldWeaponType, baseItem: '' };
  sys.proficient = oldProficient === true ? 1 : (oldProficient === false ? 0 : oldProficient ?? 1);
  sys.magicalBonus = null;
  sys.mastery = '';
  sys.identifier = (item.name || '').toLowerCase().replace(/[^a-zа-я0-9]+/giu, '-').slice(0, 32);

  // Convert properties from object {fin:true, lgt:true} to array ["fin","lgt"]
  if (oldProperties && typeof oldProperties === 'object' && !Array.isArray(oldProperties)) {
    sys.properties = Object.entries(oldProperties).filter(([, v]) => v).map(([k]) => k);
  }

  // Damage: first part becomes base, rest go into activity parts
  let basePart = oldDamageParts[0];
  let extraParts = oldDamageParts.slice(1);
  sys.damage = {
    versatile: emptyDamageDie(),
    base: basePart ? damageDie(basePart[0], basePart[1]) : emptyDamageDie(),
  };

  // Activity (attack-type)
  const attackTypeValue = oldActionType === 'rwak' ? 'ranged' : oldActionType === 'rsak' ? 'ranged' : 'melee';
  const activityRange = oldActionType?.startsWith('r')
    ? { value: String(oldRange.value ?? 20), long: String(oldRange.long ?? 60), units: oldRange.units || 'ft', reach: null }
    : { value: String(oldRange.value ?? 5), units: oldRange.units || 'ft' };

  sys.activities = {
    dnd5eactivity000: {
      _id: 'dnd5eactivity000',
      type: 'attack',
      activation: { type: 'action', value: 1, condition: '', override: false },
      consumption: { targets: [], scaling: { allowed: false, max: '' }, spellSlot: true },
      description: { chatFlavor: '' },
      duration: { concentration: false, value: '', units: '', special: '', override: false },
      effects: [],
      range: { ...activityRange, special: '', override: false },
      target: {
        template: { count: '', contiguous: false, type: '', size: '', width: '', height: '', units: '' },
        affects: { count: '1', type: 'creature', choice: false, special: '' },
        prompt: true, override: false,
      },
      uses: { spent: 0, max: '', recovery: [] },
      attack: {
        ability: oldAbility,
        bonus: (sys.attack && sys.attack.bonus) || '',
        critical: { threshold: null },
        flat: (sys.attack && sys.attack.flat) || false,
        type: { value: attackTypeValue, classification: 'weapon' },
      },
      damage: {
        critical: { bonus: '' },
        includeBase: true,
        parts: extraParts.map(([formula, type]) => damageDie(formula, type)),
      },
      sort: 0,
    },
  };

  // Range stays at item level too (for display)
  sys.range = oldActionType?.startsWith('r')
    ? { value: oldRange.value ?? 20, long: oldRange.long ?? 60, units: oldRange.units || 'ft', reach: null }
    : { value: null, long: null, units: 'ft', reach: oldRange.value ?? null };

  // Clean up obsolete top-level fields
  delete sys.actionType;
  delete sys.attack;
  delete sys.weaponType;
  delete sys.activation;
  delete sys.target;

  // Add fields modern dnd5e expects
  sys.quantity = sys.quantity ?? 1;
  sys.weight = sys.weight ?? { value: 0, units: 'lb' };
  sys.price = sys.price ?? { value: 0, denomination: 'gp' };
  sys.attunement = sys.attunement ?? '';
  sys.attuned = sys.attuned ?? false;
  sys.rarity = sys.rarity ?? '';
  sys.identified = sys.identified ?? true;
  sys.cover = sys.cover ?? null;
  sys.uses = sys.uses ?? { max: '', recovery: [], spent: 0 };
  sys.armor = sys.armor ?? { value: 10 };
  sys.hp = sys.hp ?? { value: 0, max: 0, dt: null, conditions: '' };
  sys.unidentified = sys.unidentified ?? { description: '' };
  sys.container = sys.container ?? null;
  sys.crewed = sys.crewed ?? false;
  sys.ammunition = sys.ammunition ?? {};
}

// ========== STEP 1 — convert all weapon items ==========
let converted = 0;
for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith('.json')) continue;
  const doc = load(file);
  let changed = false;
  for (const item of (doc.items || [])) {
    if (item.type !== 'weapon') continue;
    if (item.system.activities) continue; // already migrated
    convertWeapon(item);
    changed = true;
    converted++;
  }
  if (changed) save(file, doc);
}
console.log(`Converted ${converted} weapon items to dnd5e 5.x schema`);

// ========== STEP 2 — replace Ink Summon with self-copy for Kel and Nagel ==========
const SELF_COPY = {
  'echo-kel.json': {
    targetId: 'inkSummonKel0000',
    replacement: {
      _id: 'echKelSelfCopy01',
      name: 'Двойник Себя (1/бой)',
      type: 'feat',
      img: 'icons/magic/perception/silhouette-stealth-shadow.webp',
      system: {
        description: {
          value: '<p>Действием Оттиск разделяется надвое. Из чернильной лужи в 5 фт от него поднимается <strong>идентичная копия</strong> с теми же параметрами, кроме HP (33 — половина) и без своих 1/бой-абилок (Туманный шаг, Чернильный Шёпот, Двойник). Действует на инициативе оригинала. Копия рассыпается на 0 HP с тем же лор-эффектом «Распад». Партия не отличает оригинал от копии без проверки <strong>Восприятие DC 14</strong>.</p>',
        },
        activation: { type: 'action', cost: 1 },
        uses: { value: 1, max: '1', per: 'charges', recovery: '' },
        target: { value: 1, type: 'creature' },
        range: { value: 5, units: 'ft' },
        type: { value: 'monster' },
      },
    },
  },
  'echo-nagel.json': {
    targetId: 'inkSummonNagel00',
    replacement: {
      _id: 'echNagSelfCopy01',
      name: 'Двойник Себя (1/бой)',
      type: 'feat',
      img: 'icons/magic/perception/shadow-stealth-eyes-purple.webp',
      system: {
        description: {
          value: '<p>Из тени за плечом Оттиска бесшумно выходит <strong>идентичный двойник</strong>. Те же параметры, кроме HP (40 — половина) и без 1/бой-абилок. Двойник не имеет ножа в руке — атакует <em>метательными ножами на дальней дистанции</em>, пока оригинал работает в ближнем (или наоборот). Действует на инициативе оригинала. Партия не отличает оригинал от копии без <strong>Восприятие DC 14</strong>. Один раз увидев двойника, ПС получают преимущество на этот сейв в дальнейшем.</p>',
        },
        activation: { type: 'action', cost: 1 },
        uses: { value: 1, max: '1', per: 'charges', recovery: '' },
        target: { value: 1, type: 'creature' },
        range: { value: 5, units: 'ft' },
        type: { value: 'monster' },
      },
    },
  },
};

for (const [file, { targetId, replacement }] of Object.entries(SELF_COPY)) {
  const doc = load(file);
  const idx = (doc.items || []).findIndex((i) => i._id === targetId);
  if (idx >= 0) {
    doc.items[idx] = replacement;
    save(file, doc);
    console.log(`${file} → replaced ${targetId} with ${replacement.name}`);
  } else {
    // Maybe already replaced? Check if replacement already exists
    const has = doc.items.some((i) => i._id === replacement._id);
    if (has) console.log(`${file} → already has ${replacement._id}`);
    else console.log(`${file} → no match for ${targetId}; skipping`);
  }
}

console.log('\nDone.');
