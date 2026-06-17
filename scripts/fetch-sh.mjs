// scripts/fetch-sh.mjs
// i-sh.co.kr 공고 목록 크롤러
// 실행: node scripts/fetch-sh.mjs
// 결과: public/data/sh.json

import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const SOURCE_URL =
  "https://www.i-sh.co.kr/main/lay2/program/S1T294C295/www/brd/m_241/list.do";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function clean(s) {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchHtml(url) {
  const r = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html,*/*" },
  });
  if (!r.ok) throw new Error(`SH fetch failed: ${r.status}`);
  return await r.text();
}

function parseListings(html) {
  // SH list table: 5 cols: 번호, 제목(link), 담당부서, 등록일, 조회수
  const tables = [...html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/g)];
  let listTable = null;
  for (const t of tables) {
    if (/조회수/.test(t[1]) && /등록일/.test(t[1])) {
      listTable = t[1];
      break;
    }
  }
  if (!listTable) return [];
  const rows = [...listTable.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)];
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i][1];
    const cells = [...row.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map(
      (m) => clean(m[1])
    );
    if (cells.length < 4) continue;
    const linkMatch = row.match(/<a[^>]+href=["']?([^"'\s>]+)["']?[^>]*>([\s\S]*?)<\/a>/);
    let title = "";
    let href = "";
    let seq = "";
    if (linkMatch) {
      title = clean(linkMatch[2]);
      href = linkMatch[1];
      // SH uses onclick="getDetailView('12345')" — extract seq
      const onclickMatch = row.match(/getDetailView\(['"](\d+)['"]\)/);
      if (onclickMatch) {
        seq = onclickMatch[1];
        href = `https://www.i-sh.co.kr/main/lay2/program/S1T294C295/www/brd/m_241/view.do?seq=${seq}`;
      } else {
        const seqMatch = row.match(/seq=(\d+)/);
        if (seqMatch) {
          seq = seqMatch[1];
        }
        if (href && !href.startsWith("http") && href !== "#") {
          href = new globalThis.URL(href, "https://www.i-sh.co.kr").toString();
        }
      }
    } else {
      title = cells[1] || "";
    }
    const postedAt = (cells[3] || cells[2] || "").replace(/\./g, "-");
    const views =
      parseInt((cells[cells.length - 1] || "0").replace(/,/g, ""), 10) || 0;
    out.push({
      id: `sh-${seq || Math.random().toString(36).slice(2)}`,
      source: "sh",
      type: "SH공고",
      title,
      url: href && href !== "#" ? href : "",
      region: "서울",
      hasAttachment: false,
      postedAt,
      deadlineAt: null,
      status: "open",
      statusText: "공고중",
      views,
    });
  }
  return out;
}

const html = await fetchHtml(SOURCE_URL);
const items = parseListings(html);
const out = {
  source: "sh",
  fetchedAt: new Date().toISOString(),
  count: items.length,
  items,
};

const outPath = new URL("../public/data/sh.json", import.meta.url);
await mkdir(dirname(outPath.pathname), { recursive: true });
await writeFile(outPath.pathname, JSON.stringify(out, null, 2), "utf-8");
console.log(`✅ SH: ${items.length}건 → ${outPath.pathname}`);
