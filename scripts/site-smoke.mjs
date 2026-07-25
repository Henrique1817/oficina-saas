#!/usr/bin/env node
/**
 * Smoke genérico (admin / marketing) — paths < 500.
 * Uso: node scripts/site-smoke.mjs https://site.vercel.app [/login /]
 */

const base = (process.argv[2] || process.env.SMOKE_BASE_URL || "")
  .trim()
  .replace(/\/$/, "");
const paths = process.argv.slice(3);
const targets = paths.length > 0 ? paths : ["/", "/login"];

if (!base) {
  console.error("Uso: node scripts/site-smoke.mjs <base-url> [paths...]");
  process.exit(1);
}

async function check(path) {
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, { redirect: "manual" });
  if (res.status >= 500) {
    throw new Error(`${path} → HTTP ${res.status}`);
  }
  console.log(`✓ ${path} → HTTP ${res.status}`);
}

try {
  for (const p of targets) {
    await check(p);
  }
  console.log("Site smoke OK:", base);
  process.exit(0);
} catch (e) {
  console.error("Site smoke FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
}
