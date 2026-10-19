#!/bin/sh
# Gọi API xuất bản bài hẹn giờ mỗi 5 phút
: "${CRON_SECRET:?Cần CRON_SECRET (giống biến trên service web)}"
: "${CRON_BASE_URL:=http://web:3000}"
echo "[cron] ${CRON_BASE_URL}/api/cron/publish-scheduled mỗi 300s"
while true; do
  if curl -sS -f -H "Authorization: Bearer ${CRON_SECRET}" \
    "${CRON_BASE_URL}/api/cron/publish-scheduled" >/dev/null; then
    echo "[cron] ok"
  else
    echo "[cron] lỗi (kiểm tra web & CRON_SECRET)" >&2
  fi
  sleep 300
done
