// scripts/build-listings.mjs
// public/data/lh.json + sh.json → src/data/listings.json 통합본 생성
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const lh = JSON.parse(readFileSync(resolve("public/data/lh.json"), "utf-8"));
const sh = JSON.parse(readFileSync(resolve("public/data/sh.json"), "utf-8"));
const items = [...(lh.items || []), ...(sh.items || [])];
const fetchedAt = lh.fetchedAt > sh.fetchedAt ? lh.fetchedAt : sh.fetchedAt;
const outPath = resolve("src/data/listings.json");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify({ fetchedAt, count: items.length, items }, null, 2), "utf-8");
console.log(`✅ listings.json: ${items.length}건 → ${outPath}`);
