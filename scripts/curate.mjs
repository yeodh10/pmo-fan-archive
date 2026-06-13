// 인스타그램 수집본(_raw) → 에셋 파이프라인 폴더로 선별 복사 + 캡션 주입
// 한 번 실행하고 나면 products.json은 scan-assets.mjs가 관리한다.
import fs from 'node:fs';
import path from 'node:path';

const RAW = 'public/_raw';
const ARCHIVE = 'public/assets/archive';
const CHAPTERS = 'public/assets/chapters';

// ── 챕터 (타임라인/홈 풀스크린) ──
const chapters = {
  'ig_0717.jpg': '2013_symbol.jpg',
  'ig_0709.jpg': '2015_exhibition.jpg',
  'ig_0650.jpg': '2016_plus82.jpg',
  'ig_0617.jpg': '2016_founding.jpg',
  'ig_0411.jpg': '2017_motte.jpg',
  'ig_0305.jpg': '2019_drop.jpg',
  'ig_0248.jpg': '2020_nike.jpg',
  'ig_0024.jpg': 'now_collab.jpg',
};

// ── 아카이브 제품/아트 [raw, 파일명, 제목, 캡션] ──
const items = [
  // 2015 — 전시
  ['ig_0710.jpg', '2015_art_neon-i-promise.jpg', '네온 ‘I promise to love you’', 'Beyond the Stage 전시작 — 브랜드 이전의 언어'],
  ['ig_0705.jpg', '2015_art_neon-install.jpg', '네온 인스톨레이션', '서울시립미술관, 2015 전시 전경'],
  // 2016 — 런칭 전후
  ['ig_0656.jpg', '2016_art_plus82-paris.jpg', '+82 +33 파리', '런칭 전 파티 시리즈 — 르 퐁퐁, 2016.1.23'],
  ['ig_0653.jpg', '2016_top_colette-hoodie.jpg', '콜레트 후디', '파리 콜레트 입점 당시의 화이트 후디'],
  ['ig_0637.jpg', '2016_art_d-1.jpg', 'D-1', '오픈 카운트다운 — 공지는 타이포 한 장'],
  ['ig_0610.jpg', '2016_cap_first-drop.jpg', '퍼스트 드롭 캡', '2016.10.1 — 첫 발매의 검정 볼캡'],
  ['ig_0612.jpg', '2016_cap_long-strap-ballcap.jpg', '롱 스트랩 볼캡', '브랜드 초기를 정의한 실루엣 — 길게 늘어뜨린 스트랩'],
  ['ig_0608.jpg', '2016_top_logo-tee.jpg', '로고 티', '첫 드롭의 화이트 티 — 와이어에 매달린 채 촬영하는 문법'],
  ['ig_0596.jpg', '2016_top_logo-crewneck.jpg', '로고 크루넥', '심볼 자수 스웻셔츠'],
  ['ig_0613.jpg', '2016_acc_bulldog-clip.jpg', '불독 클립', '제품을 매달던 집게, 그 자체가 제품이 되다'],
  ['ig_0594.jpg', '2016_bag_clip-pouch.jpg', '클립 파우치', '집게로 여미는 미니 백'],
  ['ig_0572.jpg', '2016_acc_gold-chain.jpg', '골드 체인 네크리스', '레터링 펜던트 주얼리 라인'],
  ['ig_0579.jpg', '2016_bag_logo-tote.jpg', '로고 토트', '블랙 캔버스 토트'],
  ['ig_0585.jpg', '2016_outer_denim-jacket.jpg', '데님 재킷', '2016 겨울 — 데님 라인'],
  ['ig_0590.jpg', '2016_acc_earphones-red.jpg', '레드 이어폰', '음악가의 브랜드다운 오브제'],
  ['ig_0642.jpg', '2016_acc_wall-clock.jpg', '월 클락', '심볼이 바늘이 되는 시계'],
  // 2017 — 폭발
  ['ig_0440.jpg', '2017_top_black-hoodie.jpg', '블랙 후디', '2017 봄 드롭'],
  ['ig_0399.jpg', '2017_bag_lip-pouch.jpg', '립 파우치', 'MOTTE 머치 — 입술 모양 레드 파우치'],
  ['ig_0343.jpg', '2017_cap_seoul-olympic.jpg', '서울올림픽 캡', '8.18 — 생일 드롭의 레트로 캡'],
  ['ig_0331.jpg', '2017_acc_red-string-bracelet.jpg', '레드 스트링 브레이슬릿', '데이지 한 송이를 묶은 붉은 실'],
  ['ig_0337.jpg', '2017_pants_red-track.jpg', '레드 트랙 팬츠', '2017 가을'],
  ['ig_0348.jpg', '2017_bag_sticker-backpack.jpg', '스티커 백팩', '아카이브 스티커로 뒤덮인 백팩'],
  // 2018 — 공백기
  ['ig_0316.jpg', '2018_acc_access-cards.jpg', '액세스 카드 세트', 'ARTIST / STAFF / ALL ACCESS / V.I.P'],
  ['ig_0311.jpg', '2018_cap_red-beanie.jpg', '레드 비니', '공백기 직전의 드롭'],
  // 2019 — 복귀
  ['ig_0306.jpg', '2019_art_mickey-daisy.jpg', '미키 × 데이지', '복귀를 알린 그래픽'],
  ['ig_0295.jpg', '2019_top_red-hoodie.jpg', '레드 후디', '2019.4.19 복귀 드롭'],
  ['ig_0248.jpg', '2019_shoes_nike-af1-paranoise.jpg', 'Nike AF1 Para-Noise', '나이키 협업의 시작 — 칠해진 그림이 벗겨지는 신발'],
  // 2020 — 나이키 시대
  ['ig_0180.jpg', '2020_shoes_nike-kwondo-1.jpg', 'Nike Kwondo 1', '두 번째 협업 풋웨어'],
  ['ig_0183.jpg', '2020_outer_quilted-jacket.jpg', '퀼티드 재킷', '2020 가을'],
  ['ig_0227.jpg', '2020_acc_smiley-daisy-pin.jpg', '스마일리 데이지 핀', '데이지가 캐릭터가 되다'],
  ['ig_0201.jpg', '2020_acc_clip-keyrings.jpg', '클립 키링', '컬러 클립 시리즈'],
  ['ig_0213.jpg', '2020_cap_green-cap.jpg', '그린 캡', '여름 컬러 드롭'],
  ['ig_0194.jpg', '2020_top_striped-tank.jpg', '스트라이프 탱크', '2020 여름'],
  ['ig_0173.jpg', '2020_pants_denim-overall.jpg', '데님 오버올', '2020 겨울'],
  // 2021
  ['ig_0117.jpg', '2021_acc_daisy-bracelet.jpg', '데이지 브레이슬릿', '시그니처 주얼리'],
  ['ig_0118.jpg', '2021_acc_daisy-earrings.jpg', '데이지 이어링', '블루 에나멜'],
  ['ig_0109.jpg', '2021_outer_black-denim-jacket.jpg', '블랙 데님 재킷', '2021 가을'],
  ['ig_0112.jpg', '2021_top_bandana-shirt.jpg', '반다나 셔츠', '레드 페이즐리'],
  // 2022
  ['ig_0066.jpg', '2022_top_ringer-tee.jpg', '링거 티', 'Peace minusone 레터링'],
  ['ig_0064.jpg', '2022_pants_print-shorts.jpg', '프린트 쇼츠', '2022 여름'],
  ['ig_0061.jpg', '2022_acc_r-keyring.jpg', 'Ⓡ 키링', '등록상표 기호의 오브제화'],
  // 2023— 아카이브의 시대
  ['ig_0027.jpg', '2023_acc_helinox-chair.jpg', 'Helinox 체어', '캠핑 기어 협업 — 레드 에디션'],
  ['ig_0026.jpg', '2023_art_guardians-of-daisy.jpg', 'Guardians of Daisy', '데이지로 그린 심볼'],
  ['ig_0025.jpg', '2024_acc_musc-ravageur.jpg', 'Musc Ravageur 데이지', '프레데릭 말 향수 에디션'],
  ['ig_0021.jpg', '2024_shoes_af1-archive.jpg', 'AF1 아카이브', 'JOOPITER 경매에 오른 한 켤레'],
  ['ig_0023.jpg', '2024_art_joopiter-auction.jpg', 'NOTHING BUT A ‘G’ THANG', '퍼렐의 JOOPITER가 연 G-DRAGON 아카이브 경매'],
  ['ig_0020.jpg', '2024_art_anniversary-frame.jpg', '2016.10.01 12:00PM', '런칭 공지가 액자에 담겨 돌아오다'],
  ['ig_0012.jpg', '2025_acc_daisy-pendant.jpg', '데이지 펜던트', '2025 주얼리'],
];

let copied = 0;
for (const [src, dst] of Object.entries(chapters)) {
  fs.copyFileSync(path.join(RAW, src), path.join(CHAPTERS, dst));
  copied++;
}
for (const [src, dst] of items) {
  fs.copyFileSync(path.join(RAW, src), path.join(ARCHIVE, dst));
  copied++;
}
console.log('copied', copied, 'files');

// 캡션 테이블 저장 → scan 후 주입용
const captions = {};
for (const [, dst, title, caption] of items) {
  captions[dst.replace(/\.jpg$/, '')] = { title_ko: title, caption };
}
fs.writeFileSync('data/captions.json', JSON.stringify(captions, null, 2));
console.log('captions table:', Object.keys(captions).length);
