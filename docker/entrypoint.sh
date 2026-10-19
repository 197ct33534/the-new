#!/bin/sh
set -e
echo "[entrypoint] Đang đồng bộ schema (prisma db push)..."
npx prisma db push
echo "[entrypoint] Khởi động Next.js tại 0.0.0.0:${PORT:-3000}..."
exec npx next start -H 0.0.0.0 -p "${PORT:-3000}"
