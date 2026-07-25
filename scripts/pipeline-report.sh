#!/usr/bin/env bash
# Reporta run/step na API de pipeline do produto.
# Env: PIPELINE_API_BASE, PIPELINE_INGEST_SECRET (ou CRON_SECRET),
#      GITHUB_RUN_ID, GITHUB_WORKFLOW, GITHUB_REF_NAME, GITHUB_SHA,
#      GITHUB_EVENT_NAME, GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID
set -euo pipefail

BASE="${PIPELINE_API_BASE:?PIPELINE_API_BASE required}"
BASE="${BASE%/}"
SECRET="${PIPELINE_INGEST_SECRET:-${CRON_SECRET:-}}"
if [[ -z "$SECRET" ]]; then
  echo "PIPELINE_INGEST_SECRET or CRON_SECRET required" >&2
  exit 1
fi

ACTION="${1:?action: upsert-run|upsert-step}"
shift || true

hdr=(-H "Authorization: Bearer ${SECRET}" -H "Content-Type: application/json")

upsert_run() {
  local status="${1:?status}"
  local started="${2:-}"
  local finished="${3:-}"
  local url="${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}"
  local body
  body=$(jq -n \
    --arg eid "${GITHUB_RUN_ID}" \
    --arg wf "${GITHUB_WORKFLOW}" \
    --arg br "${GITHUB_REF_NAME:-}" \
    --arg sha "${GITHUB_SHA:-}" \
    --arg ev "${GITHUB_EVENT_NAME:-}" \
    --arg st "$status" \
    --arg url "$url" \
    --arg started "$started" \
    --arg finished "$finished" \
    '{
      provider: "GITHUB_ACTIONS",
      externalId: $eid,
      workflow: $wf,
      branch: (if $br == "" then null else $br end),
      commitSha: (if $sha == "" then null else $sha end),
      event: (if $ev == "" then null else $ev end),
      status: $st,
      url: $url
    }
    + (if $started == "" then {} else {startedAt: $started} end)
    + (if $finished == "" then {} else {finishedAt: $finished} end)')

  curl -fsS "${hdr[@]}" -X POST "$BASE/api/v1/platform/pipeline/runs" -d "$body"
}

upsert_step() {
  local run_id="${1:?run_id}"
  local name="${2:?name}"
  local order="${3:?order}"
  local status="${4:?status}"
  local summary="${5:-}"
  local started="${6:-}"
  local finished="${7:-}"
  local body
  body=$(jq -n \
    --arg name "$name" \
    --argjson order "$order" \
    --arg st "$status" \
    --arg summary "$summary" \
    --arg started "$started" \
    --arg finished "$finished" \
    '{
      name: $name,
      stepOrder: $order,
      status: $st,
      logSummary: (if $summary == "" then null else $summary end)
    }
    + (if $started == "" then {} else {startedAt: $started} end)
    + (if $finished == "" then {} else {finishedAt: $finished} end)')

  curl -fsS "${hdr[@]}" -X POST "$BASE/api/v1/platform/pipeline/runs/${run_id}/steps" -d "$body"
}

case "$ACTION" in
  upsert-run)
    upsert_run "$@"
    ;;
  upsert-step)
    upsert_step "$@"
    ;;
  *)
    echo "Unknown action: $ACTION" >&2
    exit 1
    ;;
esac
