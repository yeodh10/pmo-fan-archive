// captions.json의 제목/캡션을 products.json에 주입 (1회성 보조 스크립트)
import fs from 'node:fs';

const products = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));
const captions = JSON.parse(fs.readFileSync('data/captions.json', 'utf8'));

let applied = 0;
for (const p of products) {
  const c = captions[p.id];
  if (c) {
    p.title_ko = c.title_ko;
    p.caption = c.caption;
    applied++;
  }
}
fs.writeFileSync('data/products.json', JSON.stringify(products, null, 2) + '\n');
console.log('captions applied:', applied, '/', products.length);
