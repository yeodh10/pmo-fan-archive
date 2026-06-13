# PEACEMINUSONE — Unofficial Fan Archive

브랜드가 지나온 길(전시 → 설립 → 협업)과 제품을 기록하는 다크 톤의 아카이브 사이트.
쇼핑몰이 아니라 **"기록관"** 입니다.

> ⚠️ **비공식 팬 메이드 프로젝트입니다.** PEACEMINUSONE / G-DRAGON과 아무런 제휴 관계가 없으며,
> 개인 소장·포트폴리오 설명 용도로만 제작했습니다. 상업적 사용·공개 배포는 하지 않습니다.
> 모든 이미지의 저작권은 원저작자에게 있습니다.

## 콘셉트

- **다크 베이스 + 타이포그래피 중심**, 여백으로 말하기
- **"minus one"을 레이아웃 언어로** — 아카이브 그리드에서 한 칸을 의도적으로 비움
- **Shop은 평소 `NO SIGNAL`** — 공식몰의 기습 드롭 문법을 UI로 번역
- 절제된 스크롤 기반 등장 애니메이션 (GSAP + ScrollTrigger)

## 페이지

| 페이지 | 내용 |
|--------|------|
| Home | 데이지 + 워드마크 히어로 → 2015 전시 풀스크린 챕터 → 셀렉티드 그리드 |
| Archive | 전 제품 그리드(연도·카테고리 필터), 클릭 시 게시물 캐러셀 전체를 보는 상세 |
| Timeline | 2013 심볼 → 2015 전시 → 2016 설립 → 협업 → 현재, 스크롤 챕터 |
| Philosophy | 브랜드 의미(이상과 현실의 교차점)를 시처럼 한 페이지로 |
| Shop | 기본 `NO SIGNAL` 화면 |

## 기술 스택

- [Astro](https://astro.build) — 정적 사이트
- [GSAP](https://gsap.com) + ScrollTrigger — 스크롤 애니메이션
- 콘텐츠/코드 분리: `data/products.json`, `data/timeline.json`

## 개발

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # 정적 빌드 → dist/
npm run scan     # public/assets/archive/ 스캔 → products.json 갱신
```

## 에셋 파이프라인

이미지는 `public/assets/archive/`에 파일명 규칙대로 넣으면 자동 반영됩니다.

```
{연도}_{카테고리}_{이름}.jpg          ← 대표(첫) 이미지
{연도}_{카테고리}_{이름}_2.jpg, _3.jpg ← 같은 제품의 추가 이미지(캐러셀)
```

- 카테고리: `outer` / `shirts` / `pants` / `shoes` / `cap` / `accessory`
- `npm run scan` 한 번이면 `products.json`이 갱신됩니다 (수동 편집한 제목/캡션은 보존)
- 이미지가 없는 항목은 다크 플레이스홀더로 표시 → 사이트는 항상 완성 상태 유지

제품 데이터(275종)는 공식 인스타그램 게시물에서 수집·정리한 것입니다.

---

*개인 소장 / 포트폴리오 설명용. 공개 배포·상업적 사용 안 함.*
