// 카탈로그 중 아직 통합 안 된 신규 항목의 인덱스 추출
import fs from 'node:fs';

const catalog = JSON.parse(fs.readFileSync('data/catalog_draft.json', 'utf8'));
const products = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));
const existing = new Set(products.map((p) => p.id));

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

const news = catalog.filter((p) => !existing.has(`${p.year}_${p.category}_${slugify(p.title)}`));
console.log('신규:', news.length, '| 이미지:', news.reduce((s, p) => s + p.imageCount, 0));
news.forEach((p) => console.log(' ', p.date, p.category.padEnd(9), p.title.slice(0, 55)));
fs.writeFileSync('data/new_indices.json', JSON.stringify(news.map((p) => p.i)));
