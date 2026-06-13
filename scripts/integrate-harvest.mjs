// 수확 데이터 통합:
//  - catalog_draft + 이미지 청크 → 파일명 규칙대로 저장
//  - 기존 수동 항목과 병합 (중복은 수확본 우선)
//  - products.json 재생성 (date 필드 추가)
import fs from 'node:fs';
import path from 'node:path';

const ARCHIVE = 'public/assets/archive';
const catalog = JSON.parse(fs.readFileSync('data/catalog_draft.json', 'utf8'));
const manual = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));

// 이미지 청크 로드 (i → base64[])
const imgsByIndex = new Map();
for (let c = 1; c <= 5; c++) {
  const chunk = JSON.parse(fs.readFileSync(`data/pmo_imgs_c${c}.json`, 'utf8'));
  for (const item of chunk) imgsByIndex.set(item.i, item.imgs);
}

const slugify = (title) =>
  title
    .replace(/PMO®?[➖\-—]?\s*/g, '')
    .replace(/PEACEMINUSONE®?[➖\-—]?\s*/g, '')
    .replace(/[®™©]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 48)
    .replace(/-+$/, '') || 'item';

// ── 수확 제품 → 파일 저장 + 항목 생성 ──
const harvestProducts = [];
const usedIds = new Set();
let filesWritten = 0;

for (const p of catalog) {
  const imgs = imgsByIndex.get(p.i);
  if (!imgs || !imgs.length) continue;
  let id = `${p.year}_${p.category}_${slugify(p.title)}`;
  let n = 2;
  while (usedIds.has(id)) id = `${p.year}_${p.category}_${slugify(p.title)}-${n++}`;
  usedIds.add(id);

  const images = [];
  imgs.forEach((b64, k) => {
    if (!b64) return;
    const name = k === 0 ? `${id}.jpg` : `${id}_${k + 1}.jpg`;
    fs.writeFileSync(path.join(ARCHIVE, name), Buffer.from(b64, 'base64'));
    images.push(`assets/archive/${name}`);
    filesWritten++;
  });

  harvestProducts.push({
    id,
    year: p.year,
    date: p.date,
    category: p.category,
    title: p.title,
    caption: '',
    images,
  });
}

// ── 수동 항목 중 수확본과 중복인 것 제거 ──
const GENERIC = new Set(['PMO', 'X', 'NIKE', 'THE', 'SET', 'BLACK', 'WHITE', 'RED', 'BLUE', 'GREEN', 'JACKET', 'CAP', 'TEE', 'SHIRT', 'HOODIE', 'PANTS', 'BAG', 'POUCH', 'KEYRING', 'NECKLACE', 'BRACELET', 'PIN', 'CLIP', 'TOTE', 'BALL']);
const tokens = (t) => new Set(t.toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !GENERIC.has(w)));

const kept = [];
const dropped = [];
for (const m of manual) {
  const mt = tokens(m.title);
  const dup = harvestProducts.find((h) => {
    if (Math.abs((h.year ?? 0) - (m.year ?? 0)) > 1) return false;
    const ht = tokens(h.title);
    let shared = 0;
    for (const w of mt) if (ht.has(w)) shared++;
    return shared >= 1 && (h.category === m.category || shared >= 2);
  });
  if (dup) {
    dropped.push({ manual: m.id, harvest: dup.id });
    // 수동 파일 정리
    for (const img of m.images ?? []) {
      const f = path.join('public', img);
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
  } else {
    kept.push(m);
  }
}

const all = [...harvestProducts, ...kept].sort(
  (a, b) => (b.date ?? `${b.year}`).localeCompare(a.date ?? `${a.year}`) || a.id.localeCompare(b.id)
);
fs.writeFileSync('data/products.json', JSON.stringify(all, null, 2) + '\n');
fs.writeFileSync('data/merge_report.json', JSON.stringify(dropped, null, 2) + '\n');

console.log(`수확 ${harvestProducts.length} + 수동 유지 ${kept.length} = 총 ${all.length} | 이미지 파일 ${filesWritten}개 | 중복 제거 ${dropped.length}`);
