// v2 마이그레이션:
//  - ART 항목 제거 (의류/잡화만)
//  - 카테고리 통합: outer / shirts / pants / shoes / cap / accessory
//  - 제품명 영문화 (브랜드 표기 문법)
//  - 2026 발매(나이키 월드컵 에디션) 연도 수정
//  - image(단수) → images(배열) 스키마 전환 + 파일명 일괄 변경
import fs from 'node:fs';
import path from 'node:path';

const ARCHIVE = 'public/assets/archive';
const products = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));

const CAT_MAP = {
  outer: 'outer', pants: 'pants', shoes: 'shoes', cap: 'cap',
  top: 'shirts', acc: 'accessory', bag: 'accessory', socks: 'accessory',
};

// 2026.6.9 인스타 게시 — 올해 발매 컬렉션인데 2025로 잘못 들어간 것들
const YEAR_FIX = {
  '2025_outer_pmo-x-nike-anthem-jacket': 2026,
  '2025_outer_pmo-x-nike-club-puffer-jacket': 2026,
  '2025_pants_pmo-x-nike-el-chino-pants': 2026,
  '2025_shoes_pmo-x-nike-cryoshot-ctr-360': 2026,
  '2025_socks_pmo-x-nike-otc-soccer-socks': 2026,
  '2025_top_pmo-x-nike-club-venice-top': 2026,
};

// slug → 영문 제품명 (브랜드는 제품명을 영문 대문자로 쓴다)
const TITLES = {
  'pmo-x-nike-anthem-jacket': 'PMO X NIKE ANTHEM JACKET',
  'pmo-x-nike-club-puffer-jacket': 'PMO X NIKE CLUB PUFFER JACKET',
  'pmo-x-nike-el-chino-pants': 'PMO X NIKE EL CHINO PANTS',
  'pmo-x-nike-cryoshot-ctr-360': 'PMO X NIKE CRYOSHOT CTR 360',
  'pmo-x-nike-otc-soccer-socks': 'PMO X NIKE OTC SOCCER SOCKS',
  'pmo-x-nike-club-venice-top': 'PMO X NIKE CLUB VENICE TOP',
  'daisy-pendant': 'DAISY PENDANT NECKLACE',
  'musc-ravageur': 'MUSC RAVAGEUR X PEACEMINUSONE',
  'af1-archive': 'AF1 PARA-NOISE — JOOPITER ARCHIVE',
  'helinox-chair': 'PMO X HELINOX CHAIR ONE',
  'r-keyring': 'R KEYRING',
  'print-shorts': 'PRINT SHORTS',
  'ringer-tee': 'PEACE MINUSONE RINGER TEE',
  'daisy-bracelet': 'DAISY BRACELET',
  'daisy-earrings': 'DAISY EARRINGS',
  'black-denim-jacket': 'BLACK DENIM JACKET',
  'bandana-shirt': 'BANDANA SHIRT',
  'clip-keyrings': 'CLIP KEYRING',
  'smiley-daisy-pin': 'SMILEY DAISY PIN',
  'green-cap': 'GREEN CAP',
  'quilted-jacket': 'QUILTED JACKET',
  'denim-overall': 'DENIM OVERALL PANTS',
  'nike-kwondo-1': 'PMO X NIKE KWONDO 1',
  'striped-tank': 'STRIPED TANK TOP',
  'nike-af1-paranoise': 'PMO X NIKE AF1 PARA-NOISE',
  'red-hoodie': 'RED HOODIE',
  'access-cards': 'ACCESS CARD SET',
  'red-beanie': 'RED BEANIE',
  'daisy-brooch': 'DAISY BROOCH',
  'red-string-bracelet': 'RED STRING DAISY BRACELET',
  'lip-pouch': 'LIP POUCH',
  'sticker-backpack': 'STICKER BACKPACK',
  'seoul-olympic': 'SEOUL OLYMPIC CAP',
  'red-track': 'RED TRACK PANTS',
  'black-hoodie': 'BLACK HOODIE',
  'safety-pin-earring': 'SAFETY PIN EARRING',
  'long-strap-ballcap': 'LONG STRAP BALL CAP',
  'first-drop': 'BLACK BALL CAP #1',
  'colette-hoodie': 'WHITE HOODIE — COLETTE',
  'logo-tee': 'LOGO T-SHIRT',
  'logo-crewneck': 'LOGO CREWNECK',
  'bulldog-clip': 'BULLDOG CLIP',
  'clip-pouch': 'CLIP POUCH',
  'gold-chain': 'GOLD CHAIN NECKLACE',
  'logo-tote': 'LOGO TOTE BAG',
  'denim-jacket': 'DENIM JACKET',
  'earphones-red': 'RED EARPHONES',
  'wall-clock': 'WALL CLOCK',
};

const out = [];
let removed = 0;
let renamed = 0;

for (const p of products) {
  if (p.category === 'art') {
    // 아카이브에서 제외 — 파일도 정리
    if (p.image) {
      const f = path.join('public', p.image);
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    removed++;
    continue;
  }

  const year = YEAR_FIX[p.id] ?? p.year;
  const category = CAT_MAP[p.category] ?? 'accessory';
  const slug = p.id.replace(/^\d{4}_[a-z0-9-]+_/, '');
  const newId = `${year}_${category}_${slug}`;

  let images = [];
  if (p.image) {
    const oldFile = path.join('public', p.image);
    const newRel = `assets/archive/${newId}.jpg`;
    const newFile = path.join('public', newRel);
    if (p.image !== newRel && fs.existsSync(oldFile)) {
      fs.renameSync(oldFile, newFile);
      renamed++;
    }
    images = [newRel];
  }

  out.push({
    id: newId,
    year,
    category,
    title: TITLES[slug] ?? slug.replace(/-/g, ' ').toUpperCase(),
    caption: p.caption || '',
    images,
  });
}

out.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || a.id.localeCompare(b.id));
fs.writeFileSync('data/products.json', JSON.stringify(out, null, 2) + '\n');
console.log(`완료 — 총 ${out.length}개 (art 제거 ${removed}, 파일명 변경 ${renamed})`);
