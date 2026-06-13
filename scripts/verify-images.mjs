// 데이터 무결성: 모든 제품의 images[]를 실제 파일과 대조.
//  - 존재하지 않는 이미지 참조 제거
//  - 대표(첫) 이미지가 사라졌으면 남은 이미지를 앞으로 당김
//  - 이미지가 0장 남은 항목은 카탈로그에서 제거 (검정 칸 원천 차단)
import fs from 'node:fs';

const products = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));

let fixedRefs = 0;
let dropped = 0;
const kept = [];

for (const p of products) {
  const existing = (p.images ?? []).filter((img) => fs.existsSync('public/' + img));
  if (existing.length !== (p.images ?? []).length) fixedRefs += (p.images?.length ?? 0) - existing.length;
  if (existing.length === 0) {
    console.log('제거(이미지 0장):', p.id);
    dropped++;
    continue;
  }
  kept.push({ ...p, images: existing });
}

kept.sort((a, b) => (b.date ?? `${b.year}`).localeCompare(a.date ?? `${a.year}`) || a.id.localeCompare(b.id));
fs.writeFileSync('data/products.json', JSON.stringify(kept, null, 2) + '\n');
console.log(`깨진 이미지 참조 ${fixedRefs}개 제거, 항목 ${dropped}개 제거 → 총 ${kept.length}개`);
