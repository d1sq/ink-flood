// Add minimal mundane gear to living NPCs so each has something in inventory.
// Items are descriptive equipment without combat mechanics.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(__dirname, '../data/compendium/actors');

function load(file) { return JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')); }
function save(file, doc) { fs.writeFileSync(path.join(dir, file), JSON.stringify(doc, null, 2) + '\n', 'utf8'); }

function gear(id, name, img, desc) {
  return {
    _id: id.padEnd(16, '0').slice(0, 16),
    name,
    type: 'equipment',
    img,
    system: {
      description: { value: `<p>${desc}</p>` },
      equipped: true,
    },
  };
}

const GEAR = {
  'kel.json': [
    gear('kelClothesDirty', 'Грязная одежда', 'icons/equipment/chest/coat-trench-brown.webp', 'Заплатанная льняная рубаха и потёртые штаны. Босиком.'),
    gear('kelPouchScraps', 'Кожаный мешочек', 'icons/containers/bags/coinpouch-leather-grey.webp', 'Несколько медных монет, корка хлеба, стащенные обрезки.'),
  ],
  'brummel.json': [
    gear('bruRichCoat0001', 'Дорогой безвкусный камзол', 'icons/equipment/chest/coat-collared-red-gold.webp', 'Расшитая ткань, не по росту. На каждой пуговице — герб Реманской канцелярии.'),
    gear('bruWigPowder001', 'Напудренный парик', 'icons/equipment/head/hat-belted-grey.webp', 'Седой парик, белая пудра. Бруммель носит его с гордостью, считает что молодит.'),
    gear('bruRingGold0001', 'Кольца на каждом пальце', 'icons/equipment/finger/ring-ball-gold.webp', 'Дюжина золотых колец с печатками и самоцветами. Стоит около 50 зм.'),
    gear('bruKeyRing00001', 'Связка ключей резиденции', 'icons/sundries/misc/key-ring-gold.webp', 'Ключи от сейфа, винного погреба и черного хода. Бруммель с ними не расстаётся.'),
  ],
  'elza.json': [
    gear('elzGreyRobe0001', 'Серое платье до пят', 'icons/equipment/chest/robe-collared-blue.webp', 'Простая суконная ряса, подпоясанная верёвкой.'),
    gear('elzHeadscarf001', 'Чёрный платок', 'icons/equipment/head/hat-belted-grey.webp', 'Покрывает голову и плечи. Эльза снимает его только для молитвы наедине.'),
    gear('elzPenAndInk001', 'Перо и чернильница', 'icons/sundries/scrolls/scroll-bound-black-brown.webp', 'Видавшее виды гусиное перо. Чернила всегда чёрные. От письма у Эльзы пятна на руках.'),
  ],
  'olbrecht.json': [
    gear('olbBrownCoat001', 'Поношенный коричневый сюртук', 'icons/equipment/chest/coat-trench-brown.webp', 'Старомодный покрой, выцветший локоть. Карманы набиты мелочью лавки.'),
    gear('olbLedgerBook01', 'Учётная книга антиквара', 'icons/sundries/books/book-embossed-bound-brown.webp', 'Записи о каждой проданной вещи за двадцать лет. Без неё Ольбрехт чувствует себя голым.'),
    gear('olbBigGlasses01', 'Огромные круглые очки', 'icons/magic/perception/orb-eye-scrying.webp', 'Линзы толщиной с палец. Без них Ольбрехт почти ничего не видит вблизи.'),
  ],
  'konrad.json': [
    gear('konWoolCoat0001', 'Потёртая суконная куртка', 'icons/equipment/chest/coat-leather-blue.webp', 'Тёплая, ветрозащитная. Двадцать лет на верхотуре сделали её незаменимой.'),
    gear('konLeatherApron', 'Кожаный фартук смотрителя', 'icons/equipment/chest/breastplate-banded-leather-brown.webp', 'Рабочий фартук с карманами для тряпок и щёток. Запачкан чернильной пылью на груди.'),
    gear('konTowerKeys001', 'Связка ключей башни', 'icons/sundries/misc/key-ring-gold.webp', 'Ключи от двери башни, оружейного шкафа наверху и подземного склада. Конрад не доверяет их никому.'),
  ],
  'fritz.json': [
    gear('fritzWineCoat01', 'Мятый винно-красный камзол', 'icons/equipment/chest/coat-collared-red.webp', 'Дорогая ткань, дешёвый покрой. Под мышками — пятна пота.'),
    gear('fritzPouchSilv1', 'Кошелёк с серебром', 'icons/containers/bags/coinpouch-leather-red.webp', 'Около 8 серебряных монет. Фриц копил на сапоги получше — теперь не успеет.'),
  ],
  'sivern.json': [
    gear('sivOldRobe00001', 'Старая мантия арканиста', 'icons/equipment/chest/robe-layered-blue.webp', 'Тёмно-синяя ткань, серебряная вышивка. Семьдесят лет назад Сиверн носил её каждый день. Сейчас — только её отпечаток в чернилах.'),
    gear('sivPenInk000001', 'Чернильница и перо Сиверна', 'icons/sundries/scrolls/scroll-bound-black-brown.webp', 'То, чем он пишет в книге, лежащей на столе. Перо двигается само, без руки. Чернил в чернильнице больше, чем должно помещаться.'),
  ],
  'nagel.json': [
    gear('nagGreyCloak001', 'Серый дорожный плащ с капюшоном', 'icons/equipment/back/cape-layered-blue.webp', 'Скрывает лицо, силуэт, мысли. Из тех, кого не запоминают.'),
    gear('nagLeatherGlov1', 'Кожаные перчатки', 'icons/equipment/hand/gauntlet-armored-leather-brown.webp', 'Никогда не снимает. Даже когда ест. Даже когда спит.'),
  ],
};

for (const [file, items] of Object.entries(GEAR)) {
  const doc = load(file);
  const existingIds = new Set((doc.items || []).map((i) => i._id));
  const toAdd = items.filter((i) => !existingIds.has(i._id));
  doc.items = [...(doc.items || []), ...toAdd];
  save(file, doc);
  console.log(`gear: ${file} → +${toAdd.length}`);
}

console.log('\nDone.');
