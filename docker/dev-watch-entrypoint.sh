#!/bin/sh
set -e
cd /app
# node_modules là volume riêng trong Linux container — tránh trùng với Windows host
if [ ! -x node_modules/.bin/next ]; then
  echo "[dev] npm ci (lần đầu hoặc sau khi xoá volume)..."
  npm ci
else
  echo "[dev] Đã có node_modules trong volume — bỏ qua npm ci (xoá volume nếu đổi lockfile lớn)."
fi
echo "[dev] prisma generate + db push..."
npx prisma generate
npx prisma db push
echo "[dev] next dev (hot reload)..."
exec npm run dev -- -H 0.0.0.0 -p "${PORT:-3000}"
