# 청약 (cheongyak)

한국 공공임대 청약 캘린더 + 지도

- **데이터 소스**: LH (`apply.lh.or.kr`), SH (`i-sh.co.kr`)
- **스택**: Astro 6 + Leaflet + CARTO Dark + fuse.js
- **디자인**: Toss (토스) 톤
- **호스팅**: Vercel
- **URL**: https://cheongyak.vercel.app

## 개발

```bash
npm install
npm run fetch-lh   # apply.lh.or.kr 임대주택 크롤
npm run fetch-sh   # i-sh.co.kr SH 공고 크롤
npm run dev        # http://localhost:4321
```

## 데이터

- `public/data/lh.json` — LH 임대/분양 공고 목록
- `public/data/sh.json` — SH 공고 목록

## 디자인 토큰

- Primary: `#3182F6` (Toss Blue)
- Bg: `#FFFFFF` / Dark `#0B0E14`
- Text: `#191F28` / Dark `#E8E8E8`
- Font: `Pretendard` (한글 본문), `SF Pro Display` (숫자)
- Radius: `12px` 카드, `8px` 버튼
