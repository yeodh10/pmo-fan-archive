// 인스타 전수 수집(data/pmo_harvest.json) → 제품 카탈로그 생성 (v3, 포괄적)
//  - PMO 공식 제품 접두사(PMO®➖ / PEACEMINUSONE® / PMO X)를 1차 제품 신호로
//  - 카테고리 키워드 대폭 보강, 미분류 PMO 제품은 accessory로 수용(누락 0)
//  - 진짜 에디토리얼/뉴스/행사만 제외
import fs from 'node:fs';

const harvest = JSON.parse(fs.readFileSync('data/pmo_harvest.json', 'utf8'));

// 카테고리 (제목에서 가장 늦게 매치되는 머리명사 채택; accessory가 포괄 catch-all)
const RULES = [
  ['shoes', /\b(KWONDO ?\d?|AF-?1|AIR ?FORCE|FORCE ?1|PARA-?NOISE|CTR ?360|CRYOSHOT|SNEAKERS?|SHOES?|FOOTWEAR|SLIDES?|SLIPPERS?|BOOTS?|ZANOTTI)\b/g],
  ['cap', /\b(CAPS?|BEANIES?|BUCKET ?HATS?|BUCKETS?|HATS?|VISORS?|BALACLAVAS?|SNAP ?BACKS?)\b/g],
  ['outer', /\b(JACKETS?|JACEKT|COATS?|PUFFERS?|PARKAS?|DOWN|VESTS?|BLOUSONS?|WINDBREAKERS?|ANORAKS?|ZIP[- ]?UPS?|FLEECE|BOMBERS?|ROBES?)\b/g],
  ['pants', /\b(PANTS|SHORTS|JEANS|TROUSERS?|SWEATPANTS|OVERALLS?|LEGGINGS?|SKIRTS?|CHINO)\b/g],
  ['shirts', /\b(T-?SHIRTS?|TEES?|SHIRTS?|HOODIES?|HOODY|HOOD(?:ED)?|SWEATSHIRTS?|CREW ?NECKS?|CREWNECKS?|KNITS?|SWEATERS?|TANKS?|LONG ?SLEEVES?|TURTLENECKS?|JERSEYS?|PULLOVERS?|POLOS?|TOPS?|THERMAL|RASH ?GUARDS?|RINGER)\b/g],
  ['accessory', /\b(BRACELETS?|NECKLACES?|RINGS?|EARRINGS?|KEYRINGS?|KEY ?CHAINS?|CLIPS?|BAGS?|POUCH(?:ES)?|TOTES?|BACKPACKS?|WALLETS?|CARD ?(?:HOLDERS?|CASES?)|PASSPORT|SOCKS?|SCARF|SCARVES|BANDANAS?|MUFFLERS?|GLOVES?|PINS?|BROOCH(?:ES)?|TOWELS?|UMBRELLAS?|LIGHTERS?|CLOCKS?|MIRRORS?|PHONE ?CASES?|AIRPODS?|CHAIRS?|TABLES?|PERFUMES?|CANDLES?|STICKERS?|STICKY ?NOTES?|PATCH(?:ES)?|BELTS?|CHARMS?|PENDANTS?|USB|EARPHONES?|HEADPHONES?|HEADBANDS?|SOUNDBANDS?|TAGS?|HOLDERS?|CUSHIONS?|BLANKETS?|MASKS?|ANKLETS?|HELINOX|MATS?|TAPES?|NOTEPADS?|NOTES?|CALENDARS?|CORSAGES?|LANYARDS?|PASS|CASES?|CONVENI|WATCH(?:ES)?|HIGHBALL|BEOPLAY)\b/g],
];

// PMO 공식 제품 접두사 → 무조건 제품 (미분류여도 accessory로 수용)
const PMO_PREFIX = /^\s*(PMO\s*®?\s*[➖\-—]|PMO\s*®|PEACEMINUSONE\s*®|PMO\s+X\b|PEACEMINUSONE\s+X\b|PMO\s+DAISY|PMO\s+RED)/i;
// 콜라보: "[브랜드] X PEACEMINUSONE/PMO" 또는 "PMO/PEACEMINUSONE X [브랜드]"
const COLLAB = /\bX\s+(PEACEMINUSONE|PMO)\b|\b(PEACEMINUSONE|PMO)\s+X\b/i;

// 진짜 비제품: 뉴스/음악/행사/매거진/리포스트/액티비즘
const EDITORIAL = /#PMONEWS|#PMOMUSIC|\bVOGUE\b|EXHIBITION|MAMA ?AWARDS|GUARDIANS[ _]?OF[ _]?DAISY|JUSPEACE|#REPOST|\bPARTY\b|PRESENTATION|\bMAGAZINE\b|INTERVIEW|\bTOUR\b|\bTICKET|OPENING|\bCONCERT\b|\+82|BEYOND THE STAGE/i;

const norm = (s) =>
  s.toUpperCase().replace(/[“”„‟"']/g, '').replace(/\s+/g, ' ').trim();

function firstMeaningfulLine(caption) {
  const lines = caption.split('\n').map((l) => l.trim()).filter(Boolean);
  // 모든 토큰이 #해시태그 / @멘션 / 이모지인 줄은 건너뛰고 제품명 줄을 찾음
  for (const l of lines) {
    const tokens = l.split(/\s+/).filter(Boolean);
    const allTags = tokens.every((t) => /^[#@]/.test(t) || /^[\p{Emoji}‍®️\u{FE0F}]+$/u.test(t));
    if (allTags) continue;
    return l;
  }
  return lines[0] ?? '';
}

function cleanTitle(line) {
  return norm(line)
    .replace(/\s*#\d+\b/g, '')
    .replace(/\s*\bRE-?STOCK(ED)?\b.*$/i, '')
    .replace(/\s*\bAVAILABLE.*$/i, '')
    .replace(/\s*\bSOLD ?OUT.*$/i, '')
    .replace(/\s*DETAILS?:.*$/i, '')
    .replace(/\s*SOLD AT.*$/i, '')
    .replace(/\s*(PMO )?ONLINE EXCLUSIVE.*$/i, '')
    .replace(/\s*HAND ?MADE\s*/gi, ' ')
    .replace(/[.!]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const products = [];
const skipped = [];

for (const [i, p] of Object.entries(harvest)) {
  if (!p || p.err || !p.urls?.length) { skipped.push({ i: +i, why: p?.err ?? 'no media' }); continue; }
  const cap = p.caption ?? '';
  const rawFirst = firstMeaningfulLine(cap);
  const firstLine = cleanTitle(rawFirst);
  const upperCap = norm(cap);

  const hasPmoPrefix = PMO_PREFIX.test(rawFirst) || COLLAB.test(firstLine);
  const isEditorial = EDITORIAL.test(upperCap) && !hasPmoPrefix;

  if (isEditorial) { skipped.push({ i: +i, why: 'editorial', head: firstLine.slice(0, 60) }); continue; }

  // 카테고리: 제목에서 가장 늦게 매치
  let category = null, bestPos = -1;
  for (const [c, re] of RULES) {
    re.lastIndex = 0; let m;
    while ((m = re.exec(firstLine)) !== null) if (m.index > bestPos) { bestPos = m.index; category = c; }
  }
  if (!category) {
    for (const [c, re] of RULES) { re.lastIndex = 0; if (re.test(upperCap)) { category = c; break; } }
  }
  if (/HELINOX/.test(firstLine)) category = 'accessory';

  // 제품 판정: PMO 접두사가 있으면 카테고리 없어도 accessory로 수용; 아니면 키워드 필요
  let isProduct = false;
  if (hasPmoPrefix) { isProduct = true; if (!category) category = 'accessory'; }
  else if (category && firstLine.length >= 3 && firstLine.length <= 80 && !/^[#@]/.test(rawFirst)) isProduct = true;

  if (!isProduct) { skipped.push({ i: +i, why: 'non-product', head: firstLine.slice(0, 60) }); continue; }

  const date = new Date(p.ts * 1000);
  products.push({
    i: +i, code: p.code, year: date.getUTCFullYear(), date: date.toISOString().slice(0, 10),
    category, title: firstLine, imageCount: p.urls.length, video: !!p.video,
  });
}

// 동일 제품 병합(제목+카테고리, 이미지 많은 쪽)
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
