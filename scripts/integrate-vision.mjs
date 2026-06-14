// 비전 검사로 찾은 누락 제품 통합 (pmo_keep.json + keep_list.json)
import fs from 'node:fs';
import path from 'node:path';

const ARCHIVE = 'public/assets/archive';
const products = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));
const bundle = JSON.parse(fs.readFileSync('data/pmo_keep.json', 'utf8'));
const keep = JSON.parse(fs.readFileSync('data/keep_list.json', 'utf8'));
const metaByI = new Map(keep.map((k) => [k.i, k]));
const harvest = JSON.parse(fs.readFileSync('data/pmo_harvest.json', 'utf8'));

const slugify = (t) =>
  t.replace(/PMO\s*®?\s*[➖\-—]?\s*/gi, '').replace(/PEACEMINUSONE\s*®?/gi, '')
    .replace(/[®™©️]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .toLowerCase().slice(0, 52).replace(/-+$/, '') || 'item';

const existingIds = new Set(products.map((p) => p.id));
let added = 0, files = 0;
const newEntries = [];

for (const item of bundle) {
  const meta = metaByI.get(item.i);
  if (!meta) continue;
  const imgsB64 = item.imgs.filter(Boolean);
  if (!imgsB64.length) continue;

  const year = harvest[item.i]?.ts ? new Date(harvest[item.i].ts * 1000).getUTCFullYear() : null;
  const date = harvest[item.i]?.ts ? new Date(harvest[item.i].ts * 1000).toISOString().slice(0, 10) : null;
  const category = meta.cat;
  const title = meta.title.trim();

  let id = `${year}_${category}_${slugify(title)}`;
  let n = 2;
  while (existingIds.has(id)) id = `${year}_${category}_${slugify(title)}-${n++}`;
  existingIds.add(id);

  const images = [];
  imgsB64.forEach((b64, k) => {
    const name = k === 0 ? `${id}.jpg` : `${id}_${k + 1}.jpg`;
    fs.writeFileSync(path.join(ARCHIVE, name), Buffer.from(b64, 'base64'));
    images.push(`assets/archive/${name}`);
    files++;
  });

  newEntries.push({ id, code: meta.code, year, date, category, title, caption: '', images });
  added++;
}

const all = [...products, ...newEntries].sort(
  (a, b) => (b.date ?? `${b.year}`).localeCompare(a.date ?? `${a.year}`) || a.id.localeCompare(b.id)
);
fs.writeFileSync('data/products.json', JSON.stringify(all, null, 2) + '\n');
console.log(`비전 신규 ${added}개 (이미지 ${files}) → 총 ${all.length}개`);
newEntries.forEach((e) => console.log('  +', e.id, `(${e.images.length}img)`));
