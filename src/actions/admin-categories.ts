"use server";

import { revalidatePath } from "next/cache";

import { revalidatePublicPaths } from "@/lib/revalidate-public";
import { z } from "zod";

import { requireStaffSession } from "@/lib/auth-session";
import { canManageCategories } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { slugifyTitle } from "@/lib/slugify";

export async function listCategoriesFlat() {
  await requireStaffSession();
  return prisma.category.findMany({
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
}

const catSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().max(200).optional().or(z.literal("")),
  description: z.string().max(5000).optional().or(z.literal("")),
  parentId: z.string().cuid().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export async function createCategory(data: z.infer<typeof catSchema>) {
  const { user } = await requireStaffSession();
  if (!canManageCategories(user.role)) {
    return { ok: false as const, error: "Chỉ biên tập / quản trị quản lý chuyên mục." };
  }
  const parsed = catSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false as const, error: "Dữ liệu không hợp lệ." };
  }
  const d = parsed.data;
  const baseSlug = d.slug?.trim() || slugifyTitle(d.name);
  const slug = await uniqueCategorySlug(baseSlug);
  const maxOrder = await prisma.category.aggregate({
    where: { parentId: d.parentId ?? null },
    _max: { sortOrder: true },
  });
  const sortOrder = d.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1;
  await prisma.category.create({
    data: {
      name: d.name.trim(),
      slug,
      description: d.description?.trim() || null,
      parentId: d.parentId ?? null,
      sortOrder,
    },
  });
  revalidatePath("/admin/chuyen-muc");
  revalidatePublicPaths("/tin-tuc");
  return { ok: true as const };
}

const updateCatSchema = catSchema.extend({ id: z.string().cuid() });

export async function updateCategory(data: z.infer<typeof updateCatSchema>) {
  const { user } = await requireStaffSession();
  if (!canManageCategories(user.role)) {
    return { ok: false as const, error: "Chỉ biên tập / quản trị quản lý chuyên mục." };
  }
  const parsed = updateCatSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false as const, error: "Dữ liệu không hợp lệ." };
  }
  const d = parsed.data;
  const row = await prisma.category.findUnique({ where: { id: d.id } });
  if (!row) return { ok: false as const, error: "Không tìm thấy chuyên mục." };
  if (d.parentId === d.id) {
    return { ok: false as const, error: "Không chọn chính nó làm cha." };
  }
  const baseSlug = d.slug?.trim() || slugifyTitle(d.name);
  let slug = baseSlug;
  if (slug !== row.slug) {
    slug = await uniqueCategorySlug(baseSlug, d.id);
  }
  await prisma.category.update({
    where: { id: d.id },
    data: {
      name: d.name.trim(),
      slug,
      description: d.description?.trim() || null,
      parentId: d.parentId === null ? null : d.parentId,
      ...(d.sortOrder != null ? { sortOrder: d.sortOrder } : {}),
    },
  });
  revalidatePath("/admin/chuyen-muc");
  revalidatePublicPaths("/tin-tuc");
  return { ok: true as const };
}

export async function deleteCategory(id: string) {
  const { user } = await requireStaffSession();
  if (!canManageCategories(user.role)) {
    return { ok: false as const, error: "Chỉ biên tập / quản trị quản lý chuyên mục." };
  }
  const [children, articles] = await Promise.all([
    prisma.category.count({ where: { parentId: id } }),
    prisma.article.count({ where: { categoryId: id } }),
  ]);
  if (children > 0) {
    return { ok: false as const, error: "Xóa hoặc chuyển chuyên mục con trước." };
  }
  if (articles > 0) {
    return { ok: false as const, error: "Có bài thuộc chuyên mục này — hãy gán lại bài rồi mới xóa." };
  }
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/chuyen-muc");
  revalidatePublicPaths("/tin-tuc");
  return { ok: true as const };
}

async function uniqueCategorySlug(base: string, excludeId?: string) {
  let slug = base;
  let n = 2;
  for (;;) {
    const existing = await prisma.category.findFirst({
      where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    if (!existing) return slug;
    slug = `${base}-${n++}`;
  }
}
