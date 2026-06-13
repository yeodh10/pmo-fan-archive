// 신규(2016 런칭 카탈로그) 22건 통합:
//  - 제목 꼬리 정리(DETAILS:/SOLD AT/EXCLUSIVE)
//  - 같은 제품의 디테일 컷 게시물은 한 항목으로 병합 (이미지 합침)
//  - 기존 수동 항목과 중복되면 수확본 우선
import fs from 'node:fs';
import path from 'node:path';

const ARCHIVE = 'public/assets/archive';
const catalog = JSON.parse(fs.readFileSync('data/catalog_draft.json', 'utf8'));
const products = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));
const newIdx = new Set(JSON.parse(fs.readFileSync('data/new_indices.json', 'utf8')));
const chunk = JSON.parse(fs.readFileSync('data/pmo_imgs_new.json', 'utf8'));
const imgsByIndex = new Map(chunk.map((c) => [c.i, c.imgs]));

const cleanTail = (t) =>
  t
    .replace(/\s*DETAILS?:.*$/i, '')
    .replace(/\s*SOLD AT.*$/i, '')
    .replace(/\s*PMO ONLINE EXCLUSIVE.*$/i, '')
    .replace(/\s*HAND ?MADE\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

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

// 같은 정리-제목끼리 병합
const groups = new Map();
for (const p of catalog) {
  if (!newIdx.has(p.i)) continue;
  const title = cleanTail(p.title);
  const key = `${p.category}|${title}`;
  if (!groups.has(key)) groups.set(key, { ...p, title, members: [] });
  const g = groups.get(key);
  g.members.push(p.i);
  if (p.date < g.date) { g.date = p.date; g.year = p.year; } // 가장 이른 게시일
}

const existingIds = new Set(products.map((p) => p.id));
let added = 0;
let files = 0;

for (const g of groups.values()) {
  let id = `${g.year}_${g.category}_${slugify(g.title)}`;
  let n = 2;
  while (existingIds.has(id)) id = `${g.year}_${g.category}_${slugify(g.title)}-${n++}`;
  existingIds.add(id);

  const images = [];
  for (const i of g.members.sort((a, b) => a - b)) {
    for (const b64 of imgsByIndex.get(i) ?? []) {
      if (!b64) continue;
      const k = images.length;
      const name = k === 0 ? `${id}.jpg` : `${id}_${k + 1}.jpg`;
      fs.writeFileSync(path.join(ARCHIVE, name), Buffer.from(b64, 'base64'));
      images.push(`assets/archive/${name}`);
      files++;
    }
  }

  products.push({ id, year: g.year, date: g.date, category: g.category, title: g.title, caption: '', images });
  added++;
}

// 수동 항목 중 이번 신규와 겹치는 것 정리 (SHOELACE CAP ↔ long-strap/first-drop 등)
const DROP_MANUAL = ['2016_cap_long-strap-ballcap', '2016_cap_first-drop', '2016_shirts_logo-tee', '2016_accessory_gold-chain'];
const out = products.filter((p) => {
  if (DROP_MANUAL.includes(p.id)) {
    for (const img of p.images ?? []) {
      const f = path.join('public', img);
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    return false;
  }
  return true;
});

out.sort((a, b) => (b.date ?? `${b.year}`).localeCompare(a.date ?? `${a.year}`) || a.id.localeCompare(b.id));
fs.writeFileSync('data/products.json', JSON.stringify(out, null, 2) + '\n');
console.log(`신규 ${added}개 추가 (파일 ${files}), 수동 중복 ${DROP_MANUAL.length}개 정리 → 총 ${out.length}개`);
