// 임시 수신 서버: 브라우저 페이지에서 fetch POST로 이미지 데이터를 받아 파일로 저장.
// (크롬 다중 다운로드 차단 우회용 — 작업 후 종료)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('data');
fs.mkdirSync(OUT, { recursive: true });

const server = http.createServer((req, res) => {
  // CORS + Private Network Access 허용 (localhost 한정 수신)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, x-filename');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.method !== 'POST') { res.writeHead(405); res.end(); return; }

  const name = (req.headers['x-filename'] || 'upload.bin').toString().replace(/[^a-zA-Z0-9._-]/g, '');
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const buf = Buffer.concat(chunks);
    fs.writeFileSync(path.join(OUT, name), buf);
    console.log(`saved ${name} (${(buf.length / 1048576).toFixed(1)} MB)`);
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, name, bytes: buf.length }));
  });
});

server.listen(4399, '127.0.0.1', () => console.log('receiver on http://127.0.0.1:4399'));
