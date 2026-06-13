// 어두운 피드 정리 후 products.json 동기화
import fs from 'node:fs';

const products = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));

const REMOVE = new Set([
  '2019_shirts_red-hoodie',
  '2016_outer_denim-jacket',
  '2016_accessory_earphones-red',
  // 이미지 없는 플레이스홀더도 일단 제외 — 전수 수집 때 실제 사진과 함께 복귀
  '2017_accessory_daisy-brooch',
  '2016_accessory_safety-pin-earring',
]);

const out = [];
for (const p of products) {
  if (REMOVE.has(p.id)) continue;
  if (p.id === '2016_accessory_clip-pouch') {
    out.push({
      ...p,
      id: '2016_cap_distressed-symbol-cap',
      category: 'cap',
      title: 'DISTRESSED SYMBOL BALL CAP',
      caption: '심볼 패치를 거칠게 덧댄 볼캡',
      images: ['assets/archive/2016_cap_distressed-symbol-cap.jpg'],
    });
    continue;
  }
  out.push(p);
}

out.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || a.id.localeCompare(b.id));
fs.writeFileSync('data/products.json', JSON.stringify(out, null, 2) + '\n');
console.log('총', out.length, '개 항목');
