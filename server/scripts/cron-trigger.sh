#!/bin/bash
# ==============================================================================
# cPanel Cron Job Script for Shogun Projects Background Workers
# ==============================================================================
# Schedule via cPanel > Advanced > Cron Jobs (e.g. Daily at midnight: `0 0 * * *`)
#
# Direct Cron Command format:
#   curl -s -X POST https://yourdomain.com/api/cron/recurring-tasks -H "X-Cron-Secret: YOUR_CRON_SECRET" >/dev/null 2>&1
# ==============================================================================

DOMAIN="${1:-https://yourdomain.com}"
SECRET="${2:-shogun_cron_task_secret_998877}"

echo "⏰ [cPanel Cron] Triggering recurring task processor at ${DOMAIN}/api/cron/recurring-tasks..."

curl -s -X POST "${DOMAIN}/api/cron/recurring-tasks" \
  -H "X-Cron-Secret: ${SECRET}" \
  -H "Content-Type: application/json" \
  >/dev/null 2>&1

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ [cPanel Cron] Recurring task processor triggered successfully."
else
  echo "❌ [cPanel Cron] Failed to trigger recurring tasks. Exit code: ${EXIT_CODE}"
fi

exit $EXIT_CODE
