// 인스타 전수 수집(data/pmo_harvest.json) → 제품 카탈로그 생성
//  - 캡션에서 제품 게시물 판별 + 영문 제품명 정리
//  - 카테고리: outer / shirts / pants / shoes / cap / accessory
//  - 캐러셀 이미지 매니페스트(data/download_manifest.json) 생성
import fs from 'node:fs';

const harvest = JSON.parse(fs.readFileSync('data/pmo_harvest.json', 'utf8'));

// ── 카테고리 키워드 — 제목에서 "가장 늦게" 매치되는 규칙 채택 (머리 명사가 보통 뒤에 옴) ──
const RULES = [
  ['shoes', /\b(KWONDO ?\d?|AF1|AIR ?FORCE|FORCE ?1|PARA-?NOISE|CTR ?360|CRYOSHOT|SNEAKERS?|SHOES?|FOOTWEAR|SLIDES?|SLIPPERS?|BOOTS?)\b/g],
  ['cap', /\b(CAPS?|BEANIES?|BUCKET ?HATS?|HATS?|VISORS?|BALACLAVAS?)\b/g],
  ['outer', /\b(JACKETS?|COATS?|PUFFERS?|PARKAS?|DOWN|VESTS?|BLOUSONS?|WINDBREAKERS?|ANORAKS?|ZIP[- ]?UPS?|FLEECE|BOMBERS?)\b/g],
  ['pants', /\b(PANTS|SHORTS|JEANS|TROUSERS?|SWEATPANTS|OVERALLS?|LEGGINGS?|SKIRTS?)\b/g],
  ['shirts', /\b(T-?SHIRTS?|TEES?|SHIRTS?|HOODIES?|HOODY|HOOD(?:ED)?|SWEATSHIRTS?|CREWNECKS?|KNITS?|SWEATERS?|TANKS?|LONG ?SLEEVES?|TURTLENECKS?|JERSEYS?|PULLOVERS?|POLOS?|TOPS?)\b/g],
  ['accessory', /\b(BRACELETS?|NECKLACES?|RINGS?|EARRINGS?|KEYRINGS?|KEY ?CHAINS?|CLIPS?|BAGS?|POUCH(?:ES)?|TOTES?|BACKPACKS?|WALLETS?|CARD ?(?:HOLDERS?|CASES?)|SOCKS?|SCARF|SCARVES|BANDANAS?|MUFFLERS?|GLOVES?|PINS?|BROOCH(?:ES)?|TOWELS?|UMBRELLAS?|LIGHTERS?|CLOCKS?|MIRRORS?|PHONE ?CASES?|AIRPODS?|CHAIRS?|TABLES?|PERFUMES?|CANDLES?|STICKERS?|PATCH(?:ES)?|BELTS?|CHARMS?|PENDANTS?|USB|EARPHONES?|HEADBANDS?|SOUNDBANDS?|TAGS?|HOLDERS?|CUSHIONS?|BLANKETS?|MASKS?|ANKLETS?|HELINOX)\b/g],
];

// 제품이 아닌 게시물 신호 (@/#는 \b 없이 직접)
const NON_PRODUCT = /\b(POP[- ]?UP|PARTY|PRESENTATION|EXHIBITION|THANK ?YOU|CONGRATULATIONS|MAGAZINE|INTERVIEW|EDITORIAL|AWARDS?|CONCERT|TOUR|TICKET|OPEN(?:ING)?|LAUNCH(?:ING)?|REPOST)\b|@|#(?!\d)|HTTP/i;

const norm = (s) =>
  s.toUpperCase()
    .replace(/[“”„‟"']/g, '')
    .replace(/\s+/g, ' ')
    .trim();

// 제품명 정리: 첫 줄에서 잡음 제거
function cleanTitle(caption) {
  let line = caption.split('\n').map((l) => l.trim()).filter(Boolean)[0] ?? '';
  line = norm(line)
    .replace(/\s*#\d+\s*$/, '')          // 뒤의 #N 넘버 태그
    .replace(/\s*\bRE-?STOCK(ED)?\b.*$/, '')
    .replace(/\s*\bAVAILABLE.*$/, '')
    .replace(/[.!]+$/, '')
    .trim();
  return line;
}

const products = [];
const skipped = [];

for (const [i, p] of Object.entries(harvest)) {
  if (!p || p.err || !p.urls?.length) { skipped.push({ i, why: p?.err ?? 'no media' }); continue; }
  const cap = p.caption ?? '';
  const upper = norm(cap);
  const firstLine = cleanTitle(cap);

  // 제목(첫 줄)에서 가장 늦게 등장하는 키워드의 카테고리 선택 ("DOWN SCARF" → accessory)
  let category = null;
  let bestPos = -1;
  for (const [c, re] of RULES) {
    re.lastIndex = 0;
    let m2;
    while ((m2 = re.exec(firstLine)) !== null) {
      if (m2.index > bestPos) { bestPos = m2.index; category = c; }
    }
  }
  // 제목에 키워드가 없으면 캡션 전체에서 첫 매치로 폴백
  if (!category) {
    for (const [c, re] of RULES) {
      re.lastIndex = 0;
      if (re.test(upper)) { category = c; break; }
    }
  }
  // 콜라보 기물 보정
  if (/HELINOX/.test(firstLine)) category = 'accessory';

  // 제품 판정: 카테고리 키워드가 있고, 첫 줄이 제품명답게 짧으며, 행사/홍보 캡션이 아님
  const looksProduct = category && firstLine.length >= 3 && firstLine.length <= 70 && !NON_PRODUCT.test(firstLine);
  if (!looksProduct) { skipped.push({ i, why: 'non-product', head: firstLine.slice(0, 60) }); continue; }

  const date = new Date(p.ts * 1000);
  products.push({
    i: Number(i),
    code: p.code,
    year: date.getUTCFullYear(),
    date: date.toISOString().slice(0, 10),
    category,
    title: firstLine,
    imageCount: p.urls.length,
    video: !!p.video,
  });
}

// ── 동일 제품(재입고 등) 병합: 같은 제목+카테고리 → 이미지 많은 쪽 ──
const byKey = new Map();
for (const p of products) {
  const key = `${p.category}|${p.title}`;
  const prev = byKey.get(key);
  if (!prev || p.imageCount > prev.imageCount) byKey.set(key, p);
}
const finalList = [...byKey.values()].sort((a, b) => b.date.localeCompare(a.date));

fs.writeFileSync('data/catalog_draft.json', JSON.stringify(finalList, null, 2) + '\n');
fs.writeFileSync('data/catalog_skipped.json', JSON.stringify(skipped, null, 2) + '\n');

const byCat = {};
for (const p of finalList) byCat[p.category] = (byCat[p.category] ?? 0) + 1;
console.log('제품:', finalList.length, '| 중복 병합:', products.length - finalList.length, '| 제외:', skipped.length);
console.log('카테고리:', JSON.stringify(byCat));
console.log('총 이미지:', finalList.reduce((s, p) => s + p.imageCount, 0));
