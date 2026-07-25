#!/usr/bin/env node
/**
 * Smoke HTTP da API pública pós-deploy.
 * Uso: node scripts/api-smoke.mjs https://seu-app.vercel.app
 * Exit 0 = ok; 1 = falha.
 */

const base = (process.argv[2] || process.env.SMOKE_BASE_URL || "").replace(/\/$/, "");

if (!base) {
  console.error("Usage: node scripts/api-smoke.mjs <baseUrl>");
  process.exit(1);
}

async function check(path, { expectStatus = 200, expectJson } = {}) {
  const url = `${base}${path}`;
  const res = await fetch(url, { redirect: "manual" });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* plain */
  }

  if (res.status !== expectStatus) {
    throw new Error(`${path}: expected HTTP ${expectStatus}, got ${res.status} — ${text.slice(0, 200)}`);
  }
  if (expectJson) {
    expectJson(json);
  }
  console.log(`✓ ${path} (${res.status})`);
}

async function main() {
  console.log(`Smoke against ${base}`);

  await check("/api/v1/health", {
    expectStatus: 200,
    expectJson: (body) => {
      if (!body || body.status !== "ok") {
        throw new Error(`health status not ok: ${JSON.stringify(body)}`);
      }
      if (body.database !== "connected") {
        throw new Error(`database not connected: ${JSON.stringify(body)}`);
      }
    },
  });

  await check("/login", {
    expectStatus: 200,
  });

  console.log("Smoke OK");
}

main().catch((err) => {
  console.error("Smoke FAILED:", err.message || err);
  process.exit(1);
});
