#!/usr/bin/env bash
set -euo pipefail

STATUS="${1:-UNKNOWN}"
WORKFLOW_NAME="${2:-GitHub Workflow}"
BASE_URL="${3:-}"
DETAILS="${4:-}"
PARSE_MODE="${TELEGRAM_PARSE_MODE:-HTML}"
MESSAGE_FILE="${TELEGRAM_MESSAGE_FILE:-}"

if [[ -z "${TELEGRAM_BOT_TOKEN:-}" || -z "${TELEGRAM_CHAT_ID:-}" ]]; then
  echo "::warning::Skipping Telegram notification: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing."
  exit 0
fi

RUN_URL="https://github.com/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}"
SHA_SHORT="$(echo "${GITHUB_SHA}" | cut -c1-8)"

to_lower() {
  echo "${1}" | tr '[:upper:]' '[:lower:]'
}

html_escape() {
  local input="${1:-}"
  input="${input//&/&amp;}"
  input="${input//</&lt;}"
  input="${input//>/&gt;}"
  input="${input//\"/&quot;}"
  input="${input//\'/&#39;}"
  echo "${input}"
}

PARSE_MODE_NORM="$(to_lower "${PARSE_MODE}")"
case "${PARSE_MODE_NORM}" in
  html)
    PARSE_MODE="HTML"
    ;;
  markdownv2)
    PARSE_MODE="MarkdownV2"
    ;;
  markdown)
    PARSE_MODE="Markdown"
    ;;
esac

STATUS_NORM="$(to_lower "${STATUS}")"
STATUS_ICON="⚪"
STATUS_LABEL="$(echo "${STATUS}" | tr '[:lower:]' '[:upper:]')"
case "${STATUS_NORM}" in
  success)
    STATUS_ICON="🟢"
    STATUS_LABEL="SUCCESS"
    ;;
  failure)
    STATUS_ICON="🔴"
    STATUS_LABEL="FAILURE"
    ;;
  cancelled)
    STATUS_ICON="🟠"
    STATUS_LABEL="CANCELLED"
    ;;
  skipped)
    STATUS_ICON="🟡"
    STATUS_LABEL="SKIPPED"
    ;;
esac

SAFE_WORKFLOW_NAME="$(html_escape "${WORKFLOW_NAME}")"
SAFE_REPOSITORY="$(html_escape "${GITHUB_REPOSITORY}")"
SAFE_BRANCH="$(html_escape "${GITHUB_REF_NAME}")"
SAFE_SHA_SHORT="$(html_escape "${SHA_SHORT}")"
SAFE_RUN_URL="$(html_escape "${RUN_URL}")"
SAFE_BASE_URL="$(html_escape "${BASE_URL}")"
SAFE_DETAILS="$(html_escape "${DETAILS}")"

if [[ -n "${MESSAGE_FILE}" && -f "${MESSAGE_FILE}" ]]; then
  MESSAGE="$(cat "${MESSAGE_FILE}")"
  if [[ "${PARSE_MODE}" == "HTML" ]]; then
    MESSAGE="${MESSAGE}

<b>Metadata</b>
📦 <b>Repo:</b> ${SAFE_REPOSITORY}
🌿 <b>Branch:</b> ${SAFE_BRANCH}
🔖 <b>Commit:</b> <code>${SAFE_SHA_SHORT}</code>
🔗 <b>Run:</b> <a href=\"${SAFE_RUN_URL}\">Open workflow run</a>"
  else
    MESSAGE="${MESSAGE}

Repo: ${GITHUB_REPOSITORY}
Branch: ${GITHUB_REF_NAME}
Commit: ${SHA_SHORT}
Run: ${RUN_URL}"
  fi
else
  if [[ "${PARSE_MODE}" == "HTML" ]]; then
    MESSAGE="<b>🔐 ${SAFE_WORKFLOW_NAME}</b>
${STATUS_ICON} <b>Status:</b> ${STATUS_LABEL}

<b>Metadata</b>
📦 <b>Repo:</b> ${SAFE_REPOSITORY}
🌿 <b>Branch:</b> ${SAFE_BRANCH}
🔖 <b>Commit:</b> <code>${SAFE_SHA_SHORT}</code>
🔗 <b>Run:</b> <a href=\"${SAFE_RUN_URL}\">Open workflow run</a>"

    if [[ -n "${BASE_URL}" ]]; then
      MESSAGE="${MESSAGE}
🎯 <b>Target:</b> ${SAFE_BASE_URL}"
    fi

    if [[ -n "${DETAILS}" ]]; then
      MESSAGE="${MESSAGE}
🧾 <b>Details:</b> ${SAFE_DETAILS}"
    fi
  else
    MESSAGE="${WORKFLOW_NAME}
${STATUS_ICON} Status: ${STATUS_LABEL}

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
