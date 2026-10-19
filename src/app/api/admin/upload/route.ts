import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { isStaffRole } from "@/lib/permissions";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX = 4 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !isStaffRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const form = await request.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Thiếu file" }, { status: 400 });
  }
  if (file.size > MAX) {
    return NextResponse.json({ error: "Tối đa 4MB" }, { status: 400 });
  }
  const type = file.type;
  if (!ALLOWED.has(type)) {
    return NextResponse.json({ error: "Chỉ hỗ trợ JPEG, PNG, WebP, GIF" }, { status: 400 });
  }
  const ext =
    type === "image/jpeg"
      ? "jpg"
      : type === "image/png"
        ? "png"
        : type === "image/webp"
          ? "webp"
          : "gif";
  const buf = Buffer.from(await file.arrayBuffer());
  const dir = path.join(process.cwd(), "public", "uploads", "articles", String(new Date().getFullYear()));
  await mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
  const fsPath = path.join(dir, name);
  await writeFile(fsPath, buf);
  const publicUrl = `/uploads/articles/${new Date().getFullYear()}/${name}`;
  return NextResponse.json({ url: publicUrl });
}
