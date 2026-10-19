import { Redis } from "@upstash/redis";

const globalForRedis = globalThis as typeof globalThis & { __upstashRedis?: Redis | null };

function getRedis(): Redis | null {
  if (globalForRedis.__upstashRedis !== undefined) {
    return globalForRedis.__upstashRedis;
  }
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url?.length || !token?.length) {
    globalForRedis.__upstashRedis = null;
    return null;
  }
  globalForRedis.__upstashRedis = new Redis({ url, token });
  return globalForRedis.__upstashRedis;
}

export async function getCache<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    if (raw == null) return null;
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    }
    return raw as T;
  } catch {
    return null;
  }
}

export async function setCache(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    const payload = JSON.stringify(value);
    if (ttlSeconds != null && ttlSeconds > 0) {
      await redis.set(key, payload, { ex: ttlSeconds });
    } else {
      await redis.set(key, payload);
    }
  } catch {
    /* Redis lỗi — bỏ qua, API vẫn trả dữ liệu từ DB */
  }
}

export async function invalidateCache(keys: string | readonly string[]): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const list = typeof keys === "string" ? [keys] : [...keys];
  if (list.length === 0) return;
  try {
    await redis.del(...list);
  } catch {
    /* ignore */
  }
}

/** Prefix cố định — dùng khi cần xóa hàng loạt key list (SCAN ở chỗ khác nếu cần). */
export const MATCH_LIST_CACHE_PREFIX = "cache:matches:list:v1:" as const;

export const MATCH_LIST_CACHE_TTL_SECONDS = 60;

/** Key ổn định theo query — dùng chung cho GET và khi gọi invalidateCache sau cập nhật. */
export function buildMatchListCacheKey(query: {
  limit: string;
  status: string;
  league: string;
}): string {
  const parts = (Object.keys(query) as (keyof typeof query)[])
    .sort()
    .filter((k) => query[k] != null && query[k] !== "")
    .map((k) => `${String(k)}=${query[k]}`);
  const qs = parts.length > 0 ? parts.join("&") : "default";
  return `${MATCH_LIST_CACHE_PREFIX}${qs}`;
}
