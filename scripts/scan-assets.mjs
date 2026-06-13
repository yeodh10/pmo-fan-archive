/**
 * 에셋 파이프라인 v2: public/assets/archive/ 폴더를 스캔해서
 * data/products.json 초안을 생성/갱신한다.
 *
 * 파일명 규칙: {연도}_{카테고리}_{이름}.jpg          ← 대표(첫) 이미지
 *             {연도}_{카테고리}_{이름}_2.jpg, _3.jpg ← 같은 제품의 추가 이미지
 *   카테고리: outer | shirts | pants | shoes | cap | accessory (그 외는 accessory로 수용)
 *
 * 동작 원칙:
 *  - 직접 수정한 title/caption은 절대 덮어쓰지 않음
 *  - 이미지가 모두 사라진 항목은 삭제하지 않고 images: [] (플레이스홀더 표시)
 *
 * 사용: npm run scan
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARCHIVE_DIR = path.join(root, 'public', 'assets', 'archive');
const OUT_FILE = path.join(root, 'data', 'products.json');

const IMG_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const NAME_RULE = /^(\d{4})_([a-z0-9-]+?)_(.+?)(?:_(\d+))?$/i;
const CATEGORIES = new Set(['outer', 'shirts', 'pants', 'shoes', 'cap', 'accessory']);

let existing = [];
if (fs.existsSync(OUT_FILE)) {
  try {
    existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  } catch {
    console.warn('! 기존 products.json 파싱 실패 — 새로 생성합니다.');
  }
}
const byId = new Map(existing.map((p) => [p.id, p]));

const files = fs.existsSync(ARCHIVE_DIR)
  ? fs.readdirSync(ARCHIVE_DIR).filter((f) => IMG_EXTS.has(path.extname(f).toLowerCase()))
  : [];

// id별로 이미지 그룹핑 (_n 접미사는 같은 제품의 n번째 이미지)
const groups = new Map(); // id → [{ n, file }]
for (const file of files) {
  const base = path.basename(file, path.extname(file));
  const m = base.match(NAME_RULE);
  let id = base;
  let n = 1;
  if (m && m[4]) {
    id = base.replace(/_\d+$/, '');
    n = Number(m[4]);
  }
  if (!groups.has(id)) groups.set(id, []);
  groups.get(id).push({ n, file });
}

let added = 0;
const seenIds = new Set();

for (const [id, imgs] of groups) {
  seenIds.add(id);
  imgs.sort((a, b) => a.n - b.n);
  const m = id.match(/^(\d{4})_([a-z0-9-]+)_(.+)$/i);
  if (!m) console.warn(`! 파일명 규칙 불일치: ${id}`);

  const rawCat = m ? m[2].toLowerCase() : 'accessory';
  const category = CATEGORIES.has(rawCat) ? rawCat : 'accessory';
  if (m && !CATEGORIES.has(rawCat)) console.warn(`! 미지원 카테고리 '${rawCat}' → accessory: ${id}`);

  const prev = byId.get(id);
  byId.set(id, {
    id,
    year: m ? Number(m[1]) : prev?.year ?? null,
    category,
    title: prev?.title || (m ? m[3].replace(/-/g, ' ').toUpperCase() : id.toUpperCase()),
    caption: prev?.caption || '',
    images: imgs.map((i) => `assets/archive/${i.file}`),
  });
  if (!prev) added++;
}

// 이미지가 사라진 항목 보존 (플레이스홀더)
let orphaned = 0;
for (const p of byId.values()) {
  if (p.images?.length && !seenIds.has(p.id)) {
    p.images = [];
    orphaned++;
  }
}

const products = [...byId.values()].sort(
  (a, b) => (b.year ?? 0) - (a.year ?? 0) || a.id.localeCompare(b.id)
);

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(products, null, 2) + '\n');

const multi = products.filter((p) => p.images?.length > 1).length;
console.log(
  `✓ products.json 갱신 — 총 ${products.length}개 (추가 ${added}, 멀티이미지 ${multi}, 이미지 없음 ${products.filter((p) => !p.images?.length).length}${orphaned ? `, 이번에 사라짐 ${orphaned}` : ''})`
);
