#!/usr/bin/env bash
set -euo pipefail

STATUS="${1:-UNKNOWN}"
WORKFLOW_NAME="${2:-GitHub Workflow}"
BASE_URL="${3:-}"
DETAILS="${4:-}"
PARSE_MODE="${TELEGRAM_PARSE_MODE:-}"
MESSAGE_FILE="${TELEGRAM_MESSAGE_FILE:-}"

if [[ -z "${TELEGRAM_BOT_TOKEN:-}" || -z "${TELEGRAM_CHAT_ID:-}" ]]; then
  echo "::warning::Skipping Telegram notification: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing."
  exit 0
fi

RUN_URL="https://github.com/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}"
SHA_SHORT="$(echo "${GITHUB_SHA}" | cut -c1-8)"

if [[ -n "${MESSAGE_FILE}" && -f "${MESSAGE_FILE}" ]]; then
  MESSAGE="$(cat "${MESSAGE_FILE}")"
  if [[ "${PARSE_MODE}" == "HTML" ]]; then
    MESSAGE="${MESSAGE}

<b>Repo:</b> ${GITHUB_REPOSITORY}
<b>Branch:</b> ${GITHUB_REF_NAME}
<b>Commit:</b> ${SHA_SHORT}
<b>Run:</b> ${RUN_URL}"
  else
    MESSAGE="${MESSAGE}

Repo: ${GITHUB_REPOSITORY}
Branch: ${GITHUB_REF_NAME}
Commit: ${SHA_SHORT}
Run: ${RUN_URL}"
  fi
else
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
fi

MAX_TELEGRAM_LEN=3900
if (( ${#MESSAGE} > MAX_TELEGRAM_LEN )); then
  MESSAGE="${MESSAGE:0:$((MAX_TELEGRAM_LEN - 3))}..."
fi

CURL_ARGS=(
  -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage"
  -d "chat_id=${TELEGRAM_CHAT_ID}"
  --data-urlencode "text=${MESSAGE}"
  -d "disable_web_page_preview=true"
)

if [[ -n "${PARSE_MODE}" ]]; then
  CURL_ARGS+=(-d "parse_mode=${PARSE_MODE}")
fi

if ! RESPONSE="$(curl --silent --show-error "${CURL_ARGS[@]}")"; then
  echo "::warning::Telegram request failed: ${RESPONSE}"
  exit 0
fi

if ! grep -q '"ok":true' <<<"${RESPONSE}"; then
  echo "::warning::Telegram API error: ${RESPONSE}"
  exit 0
fi
