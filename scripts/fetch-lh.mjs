// scripts/fetch-lh.mjs
// apply.lh.or.kr 임대주택 공고 목록 크롤러
// 실행: node scripts/fetch-lh.mjs
// 결과: public/data/lh.json

import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const SOURCE_URL =
  "https://apply.lh.or.kr/lhapply/apply/wt/wrtanc/selectWrtancList.do?mi=1026";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function clean(s) {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseStatus(s) {
  if (/정정공고중/.test(s)) return "fixed";
  if (/접수마감/.test(s)) return "closed";
  if (/공고중|접수중/.test(s)) return "open";
  return "open";
}

async function fetchHtml(url) {
  const r = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html,*/*" },
  });
  if (!r.ok) throw new Error(`LH fetch failed: ${r.status}`);
  return await r.text();
}

function buildDetailUrl(id1, id2, id3, id4) {
  // LH detail URL: selectWrtancInfoView.do?pblancId=...&...
  // id1 = pblancId, id2 = ?, id3 = ?, id4 = ?
  const params = new globalThis.URLSearchParams({
    pblancId: id1,
    mi: "1026",
  });
  return `https://apply.lh.or.kr/lhapply/apply/wt/wrtanc/selectWrtancInfoView.do?${params.toString()}`;
}

function parseListings(html) {
  const tbody = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/);
  if (!tbody) return [];
  const rows = [...tbody[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)];
  const out = [];
  for (const row of rows) {
    const body = row[1];
    const cells = [
      ...body.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g),
    ].map((m) => clean(m[1]));
    if (cells.length < 9) continue;
    // [번호, 유형, 제목(cell 2), 지역, 첨부, 게시일, 마감일, 상태, 조회수]
    // Find wrtancInfoBtn to extract detail URL params
    const btn = body.match(/<a[^>]+class=["']wrtancInfoBtn["'][^>]*>/);
    let detailUrl = "";
    if (btn) {
      const id1 = btn[0].match(/data-id1=["']([^"']+)/)?.[1] || "";
      const id2 = btn[0].match(/data-id2=["']([^"']+)/)?.[1] || "";
      const id3 = btn[0].match(/data-id3=["']([^"']+)/)?.[1] || "";
      const id4 = btn[0].match(/data-id4=["']([^"']+)/)?.[1] || "";
      if (id1) detailUrl = buildDetailUrl(id1, id2, id3, id4);
    }
    out.push({
      id: `lh-${btn?.[0].match(/data-id1=["']([^"']+)/)?.[1] || ""}`,
      source: "lh",
      type: cells[1], // 매입임대 / 행복주택 / 공공분양 / 신혼희망타운 등
      title: cells[2], // already cleaned of HTML
      url: detailUrl,
      region: cells[3],
      hasAttachment: /있음/.test(cells[4]),
      postedAt: cells[5].replace(/\./g, "-"),
      deadlineAt: cells[6].replace(/\./g, "-"),
      status: parseStatus(cells[7]),
      statusText: cells[7],
      views: parseInt(cells[8].replace(/,/g, ""), 10) || 0,
    });
  }
  return out;
}

const html = await fetchHtml(SOURCE_URL);
const items = parseListings(html);
const out = {
  source: "lh",
  fetchedAt: new Date().toISOString(),
  count: items.length,
  items,
};

const outPath = new URL("../public/data/lh.json", import.meta.url);
await mkdir(dirname(outPath.pathname), { recursive: true });
await writeFile(outPath.pathname, JSON.stringify(out, null, 2), "utf-8");
console.log(`✅ LH: ${items.length}건 → ${outPath.pathname}`);
