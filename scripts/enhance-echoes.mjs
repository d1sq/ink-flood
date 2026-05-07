// Add variety + difficulty to Echoes:
// 1. Universal "Ink Summon" — every Echo can spawn 1 Ink Silhouette per fight.
// 2. Nagel: ranged attack + updated Multiattack (melee or ranged).
// 3. One personal twist per Echo for tactical variety.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(__dirname, '../data/compendium/actors');

function load(file) { return JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')); }
function save(file, doc) { fs.writeFileSync(path.join(dir, file), JSON.stringify(doc, null, 2) + '\n', 'utf8'); }

// ========== Universal: Ink Summon ==========
const inkSummon = (suffix) => ({
  _id: `inkSummon${suffix}`.padEnd(16, '0').slice(0, 16),
  name: 'Чернильный Призыв (1/бой)',
  type: 'feat',
  img: 'icons/magic/death/hand-undead-skeleton-fire-pink.webp',
  system: {
    description: { value: '<p>Действием. Из ближайшей чернильной лужи / тёмной поверхности в 30 фт поднимается <strong>1 Чернильный Силуэт</strong> с половинной угрозой (HP 13, AC 13, +4 1d8+3 некрот). Действует на инициативе Оттиска. Максимум 2 активных призванных Силуэта одновременно — если попытаться призвать третьего, ближайший рассыпается. (См. Ink Silhouette в компендиуме.)</p>' },
    activation: { type: 'action', cost: 1 },
    uses: { value: 1, max: '1', per: 'charges', recovery: '' },
    target: { value: 1, type: 'creature' },
    range: { value: 30, units: 'ft' },
    type: { value: 'monster' },
  },
});

// ========== Personal twists ==========
const TWISTS = {
  'echo-kel.json': [{
    _id: 'echKelCunning001',
    name: 'Воровская Ловкость',
    type: 'feat',
    img: 'icons/skills/movement/figure-running-gray.webp',
    system: {
      description: { value: '<p>Бонусным действием совершает действие <strong>Отход</strong>, <strong>Скрытность</strong> или <strong>Рывок</strong>. Не тратит обычное действие. (Cunning Action.)</p>' },
      activation: { type: 'bonus', cost: 1 },
      type: { value: 'monster' },
    },
  }],
  'echo-elza.json': [{
    _id: 'echElzaSmite001',
    name: 'Тёмная Кара (1/бой)',
    type: 'feat',
    img: 'icons/magic/symbols/cross-circle-blue.webp',
    system: {
      description: { value: '<p>Когда Эльза попадает атакой ближнего боя, как часть атаки тратит этот эффект — наносит дополнительные <strong>2d8 некротического урона</strong>. Объявить до броска урона.</p>' },
      activation: { type: 'special', cost: null },
      uses: { value: 1, max: '1', per: 'charges', recovery: '' },
      damage: { parts: [['2d8', 'necrotic']] },
      type: { value: 'monster' },
    },
  }],
  'echo-fritz.json': [{
    _id: 'echFritzPanic01',
    name: 'Каскад Паники',
    type: 'feat',
    img: 'icons/magic/perception/eye-tendrils-web-purple.webp',
    system: {
      description: { value: '<p><em>Пассивная.</em> Когда Оттиск Фрица получает урон, все враждебные существа в 10 фт делают сейв <strong>Мудрость DC 13</strong>. Провал — <strong>1d6 психического урона</strong> (Фриц паникует громко, и его страх передаётся).</p>' },
      activation: { type: 'special', cost: null },
      save: { ability: 'wis', dc: 13, scaling: 'flat' },
      damage: { parts: [['1d6', 'psychic']] },
      type: { value: 'monster' },
    },
  }],
  'echo-konrad.json': [{
    _id: 'echKonBeacon001',
    name: 'Маяковая Вспышка (1/бой)',
    type: 'feat',
    img: 'icons/magic/light/beam-explosion-pink-purple.webp',
    system: {
      description: { value: '<p>Действием Оттиск раскрывает грудь — наружу вырывается чернильный свет. Конус 30 фт. Все существа в зоне делают сейв <strong>Ловкость DC 13</strong>. Провал: <strong>4d6 излучения</strong> + <strong>ослеплены</strong> до конца своего следующего хода. Успех: половина урона, без ослепления.</p>' },
      activation: { type: 'action', cost: 1 },
      uses: { value: 1, max: '1', per: 'charges', recovery: '' },
      save: { ability: 'dex', dc: 13, scaling: 'flat' },
      damage: { parts: [['4d6', 'radiant']] },
      target: { value: 30, type: 'cone' },
      type: { value: 'monster' },
    },
  }],
  'echo-olbrecht.json': [{
    _id: 'echOlbWeakness1',
    name: 'Каталог Слабостей (1/день)',
    type: 'feat',
    img: 'icons/sundries/books/book-eye-pink.webp',
    system: {
      description: { value: '<p>Действием. Цель в 60 фт <em>помечается</em> Оттиском. Все источники урона по этой цели наносят дополнительные <strong>+1d6 некротического</strong> урона на 1 минуту. Концентрация. (Ольбрехт «опознал» слабость прообраза.)</p>' },
      activation: { type: 'action', cost: 1 },
      uses: { value: 1, max: '1', per: 'day', recovery: '' },
      target: { value: 1, type: 'creature' },
      range: { value: 60, units: 'ft' },
      type: { value: 'monster' },
    },
  }],
  'echo-brummel.json': [{
    _id: 'echBruAura00001',
    name: 'Аура Власти',
    type: 'feat',
    img: 'icons/magic/control/control-influence-rally-purple.webp',
    system: {
      description: { value: '<p><em>Пассивная.</em> Все союзные чернильные существа (Силуэты, Хор, другие Оттиски) в 10 фт от Бруммеля получают <strong>+1 к броскам атаки</strong>. Бруммель привык, что вокруг него подчиняются — это передаётся даже его двойнику.</p>' },
      activation: { type: 'special', cost: null },
      type: { value: 'monster' },
    },
  }],
};

// ========== Nagel: ranged + updated Multiattack ==========
const NAGEL_RANGED = {
  _id: 'echNagThrow00001',
  name: 'Метательный нож',
  type: 'weapon',
  img: 'icons/weapons/thrown/dart-feathered.webp',
  system: {
    description: { value: '<p>Чернильный нож, брошенный из тени. Если цель не видела Оттиска до броска — <strong>+2d6 скрытной атаки</strong> (1/ход).</p>' },
    activation: { type: 'action', cost: 1 },
    range: { value: 20, long: 60, units: 'ft' },
    target: { value: 1, type: 'creature' },
    actionType: 'rwak',
    attack: { bonus: '', flat: false },
    damage: { parts: [['1d4 + 4', 'piercing'], ['1d6', 'necrotic']] },
    weaponType: 'simpleR',
    proficient: true,
    equipped: true,
    ability: 'dex',
    properties: { fin: true, lgt: true, thr: true },
  },
};

// Apply twists + Ink Summon to all Echoes
const echoFiles = ['echo-kel.json', 'echo-elza.json', 'echo-fritz.json', 'echo-konrad.json', 'echo-olbrecht.json', 'echo-brummel.json', 'echo-nagel.json'];
const suffixMap = {
  'echo-kel.json': 'Kel', 'echo-elza.json': 'Elza', 'echo-fritz.json': 'Fritz',
  'echo-konrad.json': 'Konrad', 'echo-olbrecht.json': 'Olbreht',
  'echo-brummel.json': 'Brummel', 'echo-nagel.json': 'Nagel',
};

for (const file of echoFiles) {
  const doc = load(file);
  const existingIds = new Set((doc.items || []).map((i) => i._id));
  const adds = [];

  // Universal: Ink Summon
  const summon = inkSummon(suffixMap[file]);
  if (!existingIds.has(summon._id)) adds.push(summon);

  // Personal twist
  for (const twist of (TWISTS[file] || [])) {
    if (!existingIds.has(twist._id)) adds.push(twist);
  }

  doc.items = [...(doc.items || []), ...adds];
  save(file, doc);
  console.log(`${file} → +${adds.length}`);
}

// ========== Nagel-specific: ranged + Multiattack rewrite ==========
{
  const file = 'echo-nagel.json';
  const doc = load(file);
  const existingIds = new Set(doc.items.map((i) => i._id));

  // Add ranged knife
  if (!existingIds.has(NAGEL_RANGED._id)) {
    doc.items.push(NAGEL_RANGED);
  }

  // Update Multiattack description: melee OR ranged combinations
  const ma = doc.items.find((i) => i._id === 'echNagMulti00001');
  if (ma) {
    ma.system.description.value = '<p>Оттиск Нагеля делает <strong>две атаки</strong> за действие — любую комбинацию ножа в ближнем и метательного ножа в дальнем. Не сводит дистанцию; идеален в укрытиях.</p>';
  }

  save(file, doc);
  console.log('echo-nagel.json → ranged knife + multiattack rewritten');
}

console.log('\nDone.');
