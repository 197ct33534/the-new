"use server";

import bcrypt from "bcryptjs";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { revalidatePublicPaths } from "@/lib/revalidate-public";

const schema = z.object({
  name: z.string().trim().max(120).optional().or(z.literal("")),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

export async function registerUser(data: z.infer<typeof schema>) {
  const t = await getTranslations("registerErrors");
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return { ok: false as const, error: t("invalid") };
  }
  const { email, password, name } = parsed.data;
  const lower = email.toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email: lower },
    select: { id: true, passwordHash: true },
  });
  if (existing) {
    if (!existing.passwordHash) {
      return {
        ok: false as const,
        error: t("googleLinked"),
      };
    }
    return { ok: false as const, error: t("taken") };
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      email: lower,
      passwordHash,
      name: name?.trim() || null,
      role: "USER",
    },
  });
  revalidatePublicPaths("/dang-nhap");
  return { ok: true as const };
}
