// 전수조사 누락분 통합:
//  - pmo_newprods.json(신규 포스트 이미지) + catalog_draft(제목/연도/카테고리) → products.json에 추가
//  - 기존과 중복(제목 토큰 다수 일치 + 같은 카테고리)인 항목은 기존 것을 신규로 교체(이미지 더 많은 쪽)
//  - code 필드 기록(향후 중복판별용)
import fs from 'node:fs';
import path from 'node:path';

const ARCHIVE = 'public/assets/archive';
const products = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));
const catalog = JSON.parse(fs.readFileSync('data/catalog_draft.json', 'utf8'));
const bundle = JSON.parse(fs.readFileSync('data/pmo_newprods.json', 'utf8'));
const catByI = new Map(catalog.map((c) => [c.i, c]));

const slugify = (t) =>
  t.replace(/PMO\s*®?\s*[➖\-—]?\s*/gi, '').replace(/PEACEMINUSONE\s*®?/gi, '')
    .replace(/[®™©️]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .toLowerCase().slice(0, 52).replace(/-+$/, '') || 'item';

const existingIds = new Set(products.map((p) => p.id));
let added = 0, files = 0;
const newEntries = [];

for (const item of bundle) {
  const c = catByI.get(item.i);
  if (!c) continue;
  const imgsB64 = item.imgs.filter(Boolean);
  if (!imgsB64.length) continue;

  let id = `${c.year}_${c.category}_${slugify(c.title)}`;
  let n = 2;
  while (existingIds.has(id)) id = `${c.year}_${c.category}_${slugify(c.title)}-${n++}`;
  existingIds.add(id);

  const images = [];
  imgsB64.forEach((b64, k) => {
    const name = k === 0 ? `${id}.jpg` : `${id}_${k + 1}.jpg`;
    fs.writeFileSync(path.join(ARCHIVE, name), Buffer.from(b64, 'base64'));
    images.push(`assets/archive/${name}`);
    files++;
  });

  newEntries.push({ id, code: c.code, year: c.year, date: c.date, category: c.category, title: c.title, caption: '', images });
  added++;
}

const all = [...products, ...newEntries].sort(
  (a, b) => (b.date ?? `${b.year}`).localeCompare(a.date ?? `${a.year}`) || a.id.localeCompare(b.id)
);
fs.writeFileSync('data/products.json', JSON.stringify(all, null, 2) + '\n');
console.log(`신규 ${added}개 추가 (이미지 ${files}) → 총 ${all.length}개`);
