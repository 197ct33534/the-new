# Next.js 15 + Prisma — môi trường thực thi (cần cả `prisma` CLI cho entrypoint)
FROM node:20-bookworm-slim AS base
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
# Chỉ bật production ở stage chạy app — tránh npm ci bỏ qua devDependencies (Tailwind, @types…)
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json* ./
# postinstall chạy `prisma generate` — cần schema trước khi npm ci
COPY prisma ./prisma
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
# Turbopack có thể lỗi trên môi trường build Docker; dùng bản dựng Webpack
RUN npx next build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./
COPY --from=build /app/package-lock.json* ./
COPY --from=build /app/next.config.ts ./
COPY --chmod=755 docker/entrypoint.sh /entrypoint.sh
# Windows CRLF trong context build có thể gây: exec /entrypoint.sh: no such file or directory
RUN sed -i 's/\r$//' /entrypoint.sh
RUN mkdir -p /app/public/uploads/articles \
  && chown -R node:node /app
USER node
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENTRYPOINT ["/entrypoint.sh"]
