import { revalidatePublicPaths } from "@/lib/revalidate-public";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { publishDueScheduledArticles } from "@/lib/publish-scheduled";

/**
 * Vercel Cron: header `x-vercel-cron: 1` / hoặc `Authorization: Bearer CRON_SECRET`.
 * Định nghĩa trong `vercel.json` và thêm `CRON_SECRET` cho gọi tay (curl).
 */
export async function GET(request: Request) {
  const vercelCron = (await headers()).get("x-vercel-cron") === "1";
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  const authorized = vercelCron || (secret && auth === `Bearer ${secret}`);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await publishDueScheduledArticles();
  revalidatePublicPaths("/tin-tuc");
  revalidatePublicPaths("/");
  return NextResponse.json({ ok: true, ...result });
}
