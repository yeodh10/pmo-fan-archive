// 임시: _raw 이미지들로 컨택트 시트 생성 (큐레이션용)
import fs from 'node:fs';

const meta = JSON.parse(fs.readFileSync('data/pmo_ig_meta.json', 'utf8'));
const files = fs.readdirSync('public/_raw').filter((f) => f.endsWith('.jpg')).sort();

const rows = files.map((f) => {
  const i = parseInt(f.match(/ig_(\d+)/)[1], 10);
  const m = meta.find((p) => p.i === i);
  const date = m ? (m.alt.match(/on (\w+ \d{2}, \d{4})/) || [, '?'])[1] : '?';
  return `<div class=c><img src="${f}" loading=eager><span>${i} · ${date}</span></div>`;
});

const html = `<!doctype html><style>
body{background:#111;color:#eee;font:12px monospace;margin:0}
.g{display:grid;grid-template-columns:repeat(10,1fr)}
.c{position:relative}
img{width:100%;display:block}
span{position:absolute;bottom:2px;left:2px;background:#000a;padding:1px 3px}
</style><div class=g>${rows.join('')}</div>`;

fs.writeFileSync('public/_raw/contact.html', html);
console.log('contact sheet:', rows.length, 'cells');
