#!/usr/bin/env node
/**
 * Smoke pós-deploy.
 * Uso: node scripts/api-smoke.mjs https://seu-app.vercel.app
 */

const base = (process.argv[2] || process.env.SMOKE_BASE_URL || "")
  .trim()
  .replace(/\/$/, "");

if (!base) {
  console.error("Uso: node scripts/api-smoke.mjs <base-url>");
  process.exit(1);
}

async function check(path, { expectOkJson = false } = {}) {
  const url = `${base}${path}`;
  const res = await fetch(url, { redirect: "manual" });
  const status = res.status;
  let body = null;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    body = await res.json();
  } else {
    await res.text();
  }

  if (expectOkJson) {
    if (status !== 200 || !body || body.status !== "ok") {
      throw new Error(
        `health falhou: HTTP ${status} body=${JSON.stringify(body)}`,
      );
    }
    console.log(`✓ ${path} → ok (database=${body.database})`);
    return;
  }

  if (status >= 500) {
    throw new Error(`${path} → HTTP ${status}`);
  }
  console.log(`✓ ${path} → HTTP ${status}`);
}

try {
  await check("/api/v1/health", { expectOkJson: true });
  await check("/login");
  console.log("Smoke OK:", base);
  process.exit(0);
} catch (e) {
  console.error("Smoke FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
}
