// One-shot script to:
// 1. Add attack block to weapon items missing it
// 2. Buff ink-creature stats (HP, AC, abilities, CR, weapon damage)
// 3. Add spell-like abilities (Bane, Misty Step, Toll the Dead, etc.) to ink creatures
// Living NPCs are touched by a separate script.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(__dirname, '../data/compendium/actors');

function load(file) { return JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')); }
function save(file, doc) { fs.writeFileSync(path.join(dir, file), JSON.stringify(doc, null, 2) + '\n', 'utf8'); }

// ========== STEP 1 — attack block ==========
for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith('.json')) continue;
  const doc = load(file);
  let changed = false;
  for (const item of (doc.items || [])) {
    if (item.type !== 'weapon') continue;
    if (!item.system.attack) {
      item.system.attack = { bonus: '', flat: false };
      changed = true;
    }
  }
  if (changed) { save(file, doc); console.log(`attack block: ${file}`); }
}

// ========== STEP 2 — ink creature buffs ==========
const INK_BUFFS = {
  'silhouette.json': {
    ac: 13, hp: { value: 26, max: 26, formula: '4d8 + 8' }, cr: 1,
    abilities: { str: 11, dex: 16, con: 14, int: 6, wis: 12, cha: 10 },
    weaponDamage: { 'Чернильное прикосновение': [['1d8 + 3', 'necrotic']] },
  },
  'chorus.json': {
    ac: 14, hp: { value: 55, max: 55, formula: '10d8 + 10' }, cr: 4,
    abilities: { str: 14, dex: 14, con: 13, int: 8, wis: 12, cha: 16 },
    weaponDamage: { 'Прикосновение хора': [['1d8 + 2', 'necrotic']] },
  },
  'echo-kel.json': {
    ac: 15, hp: { value: 65, max: 65, formula: '10d8 + 20' }, cr: 4,
    abilities: { str: 13, dex: 17, con: 14, int: 11, wis: 13, cha: 14 },
    weaponDamage: { 'Отчаянный нож': [['1d4 + 3', 'piercing'], ['2d6', 'necrotic']] },
  },
  'echo-elza.json': {
    ac: 14, hp: { value: 70, max: 70, formula: '11d8 + 22' }, cr: 4,
    abilities: { str: 13, dex: 14, con: 14, int: 11, wis: 16, cha: 14 },
    weaponDamage: { 'Чернильное прикосновение': [['1d8 + 2', 'necrotic']] },
  },
  'echo-fritz.json': {
    ac: 14, hp: { value: 60, max: 60, formula: '10d8 + 20' }, cr: 4,
    abilities: { str: 13, dex: 15, con: 14, int: 11, wis: 13, cha: 14 },
    weaponDamage: { 'Кинжал в дрожащей руке': [['1d4 + 3', 'piercing'], ['1d6', 'necrotic']] },
  },
  'echo-konrad.json': {
    ac: 15, hp: { value: 75, max: 75, formula: '12d8 + 24' }, cr: 4,
    abilities: { str: 15, dex: 14, con: 14, int: 11, wis: 13, cha: 12 },
    weaponDamage: { 'Чернильный осколок': [['1d8 + 2', 'piercing'], ['2d6', 'necrotic']] },
  },
  'echo-olbrecht.json': {
    ac: 13, hp: { value: 50, max: 50, formula: '9d8 + 18' }, cr: 3,
    abilities: { str: 9, dex: 13, con: 14, int: 16, wis: 13, cha: 14 },
    weaponDamage: { 'Чернильное прикосновение': [['1d8 + 1', 'necrotic']] },
  },
  'echo-brummel.json': {
    ac: 13, hp: { value: 65, max: 65, formula: '10d8 + 20' }, cr: 4,
    abilities: { str: 12, dex: 11, con: 14, int: 13, wis: 13, cha: 17 },
    weaponDamage: { 'Печать Отзыва': [['1d8 + 1', 'bludgeoning'], ['1d6', 'necrotic']] },
  },
  'echo-nagel.json': {
    ac: 16, hp: { value: 80, max: 80, formula: '12d8 + 24' }, cr: 5,
    abilities: { str: 13, dex: 18, con: 14, int: 11, wis: 13, cha: 14 },
    weaponDamage: { 'Нож с чернильной плёнкой': [['1d4 + 4', 'piercing'], ['2d6', 'necrotic']] },
  },
};

for (const [file, b] of Object.entries(INK_BUFFS)) {
  const doc = load(file);
  doc.system.attributes.ac.flat = b.ac;
  doc.system.attributes.hp = b.hp;
  doc.system.details.cr = b.cr;
  for (const [k, v] of Object.entries(b.abilities)) doc.system.abilities[k].value = v;
  doc.system.attributes.prof = b.cr >= 5 ? 3 : 2;
  for (const [name, parts] of Object.entries(b.weaponDamage || {})) {
    const item = (doc.items || []).find((i) => i.name === name);
    if (item) item.system.damage.parts = parts;
  }
  save(file, doc);
  console.log(`buff: ${file} → AC ${b.ac} / HP ${b.hp.value} / CR ${b.cr}`);
}

// ========== STEP 3 — spell-like feats ==========
const inkWhisper = (idSuffix) => ({
  _id: `inkWhisper${idSuffix}`.padEnd(16, '0').slice(0, 16),
  name: 'Чернильный Шёпот (1/бой)',
  type: 'feat',
  img: 'icons/magic/death/skull-energy-light-purple.webp',
  system: {
    description: { value: '<p>До 3 целей в 30 фт. Сейв Харизма DC 13. Провал — 1 минута: -1d4 на атаки и сейвы Концентрации. (Аналог Bane.)</p>' },
    activation: { type: 'action', cost: 1 },
    uses: { value: 1, max: '1', per: 'charges', recovery: '' },
    save: { ability: 'cha', dc: 13, scaling: 'flat' },
    target: { value: 3, type: 'creature' },
    range: { value: 30, units: 'ft' },
    type: { value: 'monster' },
  },
});

const mistyStep = (idSuffix) => ({
  _id: `mistyStep${idSuffix}`.padEnd(16, '0').slice(0, 16),
  name: 'Туманный шаг (1/бой)',
  type: 'feat',
  img: 'icons/magic/movement/abstract-ribbons-red.webp',
  system: {
    description: { value: '<p>Бонусным действием Оттиск исчезает в чернильной дымке и появляется в 30 фт от исходной точки. Игнорирует препятствия. (Misty Step.)</p>' },
    activation: { type: 'bonus', cost: 1 },
    uses: { value: 1, max: '1', per: 'charges', recovery: '' },
    type: { value: 'monster' },
  },
});

const SPELL_LIKES = {
  'silhouette.json': [{
    _id: 'silTollDecay0001',
    name: 'Звон Угасания',
    type: 'feat',
    img: 'icons/magic/death/projectile-skull-fire-purple.webp',
    system: {
      description: { value: '<p>Силуэт указывает пальцем на цель в 60 фт. Сейв Мудрость DC 12. Провал: 1d8 некротического урона. Если у цели HP меньше максимума — урон 1d12. Звучит как далёкий колокол. (Аналог Toll the Dead.)</p>' },
      activation: { type: 'action', cost: 1 },
      range: { value: 60, units: 'ft' },
      target: { value: 1, type: 'creature' },
      actionType: 'save',
      save: { ability: 'wis', dc: 12, scaling: 'flat' },
      damage: { parts: [['1d8', 'necrotic']] },
      type: { value: 'monster' },
    },
  }],
  'chorus.json': [
    {
      _id: 'chorViciousMock01',
      name: 'Хор Бессмыслицы',
      type: 'feat',
      img: 'icons/magic/sonic/projectile-sound-rings-wave.webp',
      system: {
        description: { value: '<p>Все цели в 30 фт от Хора слышат шёпот собственным голосом. Сейв Мудрость DC 13. Провал: 1d6 психического урона + помеха на следующую атаку. (Vicious Mockery, площадной.)</p>' },
        activation: { type: 'action', cost: 1 },
        range: { value: 30, units: 'ft' },
        target: { value: 30, type: 'radius' },
        actionType: 'save',
        save: { ability: 'wis', dc: 13, scaling: 'flat' },
        damage: { parts: [['1d6', 'psychic']] },
        type: { value: 'monster' },
      },
    },
    {
      _id: 'chorSilenceSphr1',
      name: 'Сфера Тишины (1/день)',
      type: 'feat',
      img: 'icons/svg/silenced.svg',
      system: {
        description: { value: '<p>20-фт сфера магической тишины с центром на Хоре. 10 минут. Внутри сферы вербальные компоненты невозможны, громкие звуки не слышны. Хор сам себя не слышит и атакует через сферу. (Silence 2nd lvl.)</p>' },
        activation: { type: 'action', cost: 1 },
        uses: { value: 1, max: '1', per: 'day', recovery: '' },
        type: { value: 'monster' },
      },
    },
  ],
  'echo-kel.json': [mistyStep('Kel'), inkWhisper('Kel')],
  'echo-elza.json': [
    {
      _id: 'echElzaCurse0001',
      name: 'Чернильное Проклятие (1/день)',
      type: 'feat',
      img: 'icons/magic/unholy/hand-marked-pink.webp',
      system: {
        description: { value: '<p>Цель в 30 фт. Сейв Мудрость DC 13. Провал — 1 минута: помеха на атаки против Эльзы и сейвы Мудрости. Концентрация. (Bestow Curse.)</p>' },
        activation: { type: 'action', cost: 1 },
        uses: { value: 1, max: '1', per: 'day', recovery: '' },
        save: { ability: 'wis', dc: 13, scaling: 'flat' },
        target: { value: 1, type: 'creature' },
        range: { value: 30, units: 'ft' },
        type: { value: 'monster' },
      },
    },
    inkWhisper('Elza'),
  ],
  'echo-fritz.json': [
    {
      _id: 'echFritzFear0001',
      name: 'Внушение Страха (1/бой)',
      type: 'feat',
      img: 'icons/magic/control/debuff-chains-purple.webp',
      system: {
        description: { value: '<p>Цель в 30 фт. Сейв Мудрость DC 13. Провал: 1 минута устрашена (помеха на атаки и проверки, пока видит источник). (Cause Fear.)</p>' },
        activation: { type: 'action', cost: 1 },
        uses: { value: 1, max: '1', per: 'charges', recovery: '' },
        save: { ability: 'wis', dc: 13, scaling: 'flat' },
        target: { value: 1, type: 'creature' },
        range: { value: 30, units: 'ft' },
        type: { value: 'monster' },
      },
    },
    inkWhisper('Fritz'),
  ],
  'echo-konrad.json': [
    {
      _id: 'echKonInkVolley1',
      name: 'Залп Осколков (1/день)',
      type: 'feat',
      img: 'icons/magic/death/projectile-skull-fire-purple.webp',
      system: {
        description: { value: '<p>3 чернильных осколка вылетают из тела Оттиска и автоматически попадают в выбранные цели в 60 фт. По 1d4+2 некротического каждый. Без атаки и без сейва. (Magic Missile.)</p>' },
        activation: { type: 'action', cost: 1 },
        uses: { value: 1, max: '1', per: 'day', recovery: '' },
        damage: { parts: [['3d4 + 6', 'necrotic']] },
        target: { value: 3, type: 'creature' },
        range: { value: 60, units: 'ft' },
        type: { value: 'monster' },
      },
    },
    inkWhisper('Kon'),
  ],
  'echo-olbrecht.json': [
    {
      _id: 'echOlbDisguise01',
      name: 'Маска Прообраза (1/день)',
      type: 'feat',
      img: 'icons/magic/perception/mask-stone-eyes-orange.webp',
      system: {
        description: { value: '<p>Оттиск меняет внешность на 1 час, копируя любого знакомого партии человека. Расследование DC 14 раскрывает обман. (Disguise Self.)</p>' },
        activation: { type: 'action', cost: 1 },
        uses: { value: 1, max: '1', per: 'day', recovery: '' },
        type: { value: 'monster' },
      },
    },
    inkWhisper('Olb'),
  ],
  'echo-brummel.json': [
    {
      _id: 'echBruCommand001',
      name: 'Приказ Власти (1/бой)',
      type: 'feat',
      img: 'icons/magic/control/control-influence-crown-gold.webp',
      system: {
        description: { value: '<p>Цель в 60 фт слышит чеканный голос Бруммеля. Сейв Мудрость DC 13. Провал: одно простое действие на следующем ходу (упасть, замереть, выронить, броситься, подойти). (Command.)</p>' },
        activation: { type: 'action', cost: 1 },
        uses: { value: 1, max: '1', per: 'charges', recovery: '' },
        save: { ability: 'wis', dc: 13, scaling: 'flat' },
        target: { value: 1, type: 'creature' },
        range: { value: 60, units: 'ft' },
        type: { value: 'monster' },
      },
    },
    inkWhisper('Bru'),
  ],
  'echo-nagel.json': [mistyStep('Nag'), inkWhisper('Nag')],
};

for (const [file, items] of Object.entries(SPELL_LIKES)) {
  const doc = load(file);
  const existingIds = new Set((doc.items || []).map((i) => i._id));
  const toAdd = items.filter((i) => !existingIds.has(i._id));
  doc.items = [...(doc.items || []), ...toAdd];
  save(file, doc);
  console.log(`spells: ${file} → +${toAdd.length} (skipped ${items.length - toAdd.length} existing)`);
}

console.log('\nDone.');
