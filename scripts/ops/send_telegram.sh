#!/usr/bin/env bash
set -euo pipefail

STATUS="${1:-UNKNOWN}"
WORKFLOW_NAME="${2:-GitHub Workflow}"
BASE_URL="${3:-}"
DETAILS="${4:-}"

if [[ -z "${TELEGRAM_BOT_TOKEN:-}" || -z "${TELEGRAM_CHAT_ID:-}" ]]; then
  echo "::error::Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID."
  exit 1
fi

RUN_URL="https://github.com/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}"
SHA_SHORT="$(echo "${GITHUB_SHA}" | cut -c1-8)"

MESSAGE="${WORKFLOW_NAME}
Status: ${STATUS}
Repo: ${GITHUB_REPOSITORY}
Branch: ${GITHUB_REF_NAME}
Commit: ${SHA_SHORT}
Run: ${RUN_URL}"

if [[ -n "${BASE_URL}" ]]; then
  MESSAGE="${MESSAGE}
Target: ${BASE_URL}"
fi

if [[ -n "${DETAILS}" ]]; then
  MESSAGE="${MESSAGE}
Details: ${DETAILS}"
fi

RESPONSE="$(curl --silent --show-error \
  -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d "chat_id=${TELEGRAM_CHAT_ID}" \
  --data-urlencode "text=${MESSAGE}" \
  -d "disable_web_page_preview=true")"

if ! grep -q '"ok":true' <<<"${RESPONSE}"; then
  echo "::error::Telegram API error: ${RESPONSE}"
  exit 1
fi
