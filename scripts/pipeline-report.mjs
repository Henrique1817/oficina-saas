#!/usr/bin/env node
/**
 * Reporta run/step da pipeline para o painel admin.
 *
 * Uso:
 *   node scripts/pipeline-report.mjs run --status RUNNING
 *   node scripts/pipeline-report.mjs step --name lint --status SUCCESS --order 1
 *   node scripts/pipeline-report.mjs run --status SUCCESS --finished
 *
 * Env:
 *   PIPELINE_INGEST_URL, PIPELINE_INGEST_SECRET
 *   GITHUB_RUN_ID, GITHUB_WORKFLOW, GITHUB_REF_NAME, GITHUB_SHA,
 *   GITHUB_EVENT_NAME, GITHUB_SERVER_URL, GITHUB_REPOSITORY
 *
 * Sem URL/secret → exit 0 (skip).
 */

function env(name, fallback = "") {
  return process.env[name] || fallback;
}

function parseFlags(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      out[key] = true;
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

const base = env("PIPELINE_INGEST_URL").replace(/\/$/, "");
const secret = env("PIPELINE_INGEST_SECRET");

if (!base || !secret) {
  console.log("[pipeline-report] skip: PIPELINE_INGEST_URL ou SECRET ausente");
  process.exit(0);
}

const args = process.argv.slice(2);
const cmd = args[0];
const flags = parseFlags(args.slice(1));

const externalId = String(env("GITHUB_RUN_ID") || flags.externalId || "");
if (!externalId) {
  console.error("[pipeline-report] GITHUB_RUN_ID obrigatório");
  process.exit(1);
}

const runUrl = `${env("GITHUB_SERVER_URL", "https://github.com")}/${env("GITHUB_REPOSITORY")}/actions/runs/${externalId}`;

async function post(path, body) {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`[pipeline-report] ${res.status} ${path}: ${text}`);
    process.exit(1);
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

if (cmd === "run") {
  const body = {
    provider: "GITHUB_ACTIONS",
    externalId,
    workflow: env("GITHUB_WORKFLOW", typeof flags.workflow === "string" ? flags.workflow : "unknown"),
    branch: env("GITHUB_REF_NAME") || null,
    commitSha: env("GITHUB_SHA") || null,
    event: env("GITHUB_EVENT_NAME") || null,
    status: typeof flags.status === "string" ? flags.status : "RUNNING",
    url: runUrl,
  };
  if (typeof flags.deploymentUrl === "string") {
    body.deploymentUrl = flags.deploymentUrl;
  }
  if (flags.finished === true || flags.finished === "true") {
    body.finished = true;
  }
  const data = await post("/api/v1/platform/pipeline/runs", body);
  console.log("[pipeline-report] run ok", data?.id || "");
  process.exit(0);
}

if (cmd === "step") {
  if (typeof flags.name !== "string") {
    console.error("[pipeline-report] --name obrigatório");
    process.exit(1);
  }
  const body = {
    provider: "GITHUB_ACTIONS",
    externalId,
    name: flags.name,
    status: typeof flags.status === "string" ? flags.status : "RUNNING",
    order: typeof flags.order === "string" ? Number(flags.order) : 0,
  };
  if (typeof flags.log === "string") {
    body.logSummary = flags.log.slice(0, 8000);
  }
  const data = await post(
    `/api/v1/platform/pipeline/runs/${encodeURIComponent(externalId)}/steps`,
    body,
  );
  console.log("[pipeline-report] step ok", data?.name || flags.name);
  process.exit(0);
}

console.error("Uso: pipeline-report.mjs run|step [flags]");
process.exit(1);
