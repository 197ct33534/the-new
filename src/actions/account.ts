"use server";

import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const nameSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export async function updateAccountProfile(input: z.infer<typeof nameSchema>) {
  const t = await getTranslations("account");
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, error: t("needLogin") };
  }
  const parsed = nameSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: t("invalidName") };
  }
  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name },
  });
  return { ok: true as const, name: parsed.data.name };
}
