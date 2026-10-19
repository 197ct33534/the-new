"use client";

import type { Category } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createCategory, deleteCategory, updateCategory } from "@/actions/admin-categories";
import { categorySelectOptions } from "@/lib/category-labels";

type Props = { initialCategories: Category[] };

export function ChuyenMucManager({ initialCategories }: Props) {
  const router = useRouter();
  const [cats, setCats] = useState(initialCategories);
  const [err, setErr] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState<string | "">("");

  const options = categorySelectOptions(cats);
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editParent, setEditParent] = useState<string | "">("");
  const [editOrder, setEditOrder] = useState(0);

  useEffect(() => {
    setCats(initialCategories);
  }, [initialCategories]);

  function refresh() {
    router.refresh();
  }

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const r = await createCategory({
      name,
      slug: slug || undefined,
      description: description || undefined,
      parentId: parentId || null,
    });
    if (r.ok) {
      setName("");
      setSlug("");
      setDescription("");
      setParentId("");
      refresh();
    } else {
      setErr(r.error);
    }
  }

  function startEdit(c: Category) {
    setEditing(c.id);
    setEditName(c.name);
    setEditSlug(c.slug);
    setEditDesc(c.description ?? "");
    setEditParent(c.parentId ?? "");
    setEditOrder(c.sortOrder);
  }

  async function onSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setErr(null);
    const r = await updateCategory({
      id: editing,
      name: editName,
      slug: editSlug,
      description: editDesc,
      parentId: editParent || null,
      sortOrder: editOrder,
    });
    if (r.ok) {
      setEditing(null);
      refresh();
    } else {
      setErr(r.error);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Xóa chuyên mục này?")) return;
    setErr(null);
    const r = await deleteCategory(id);
    if (r.ok) {
      if (editing === id) setEditing(null);
      refresh();
    } else {
      setErr(r.error);
    }
  }

  return (
    <div className="space-y-8">
      {err ? (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          {err}
        </p>
      ) : null}
      <form onSubmit={onAdd} className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="text-sm font-semibold">Thêm chuyên mục</h2>
        <div className="grid gap-2 md:grid-cols-2">
          <div>
            <label className="text-xs text-zinc-500">Tên</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500">Slug (tuỳ chọn)</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-zinc-500">Mô tả</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500">Cha</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="">(gốc)</option>
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Tạo
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th className="p-2">Tên / Slug</th>
              <th className="p-2 w-20">Thứ tự</th>
              <th className="p-2 w-28">Sửa</th>
            </tr>
          </thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c.id} className="border-t border-zinc-100 dark:border-zinc-800">
                {editing === c.id ? (
                  <td className="p-2" colSpan={3}>
                      <form onSubmit={onSaveEdit} className="grid gap-2 md:grid-cols-2">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                        />
                        <input
                          value={editSlug}
                          onChange={(e) => setEditSlug(e.target.value)}
                          className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                        />
                        <input
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="md:col-span-2 rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                          placeholder="Mô tả"
                        />
                        <select
                          value={editParent}
                          onChange={(e) => setEditParent(e.target.value)}
                          className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                        >
                          <option value="">(gốc)</option>
                          {options
                            .filter((o) => o.id !== c.id)
                            .map((o) => (
                              <option key={o.id} value={o.id}>
                                {o.label}
                              </option>
                            ))}
                        </select>
                        <input
                          type="number"
                          value={editOrder}
                          onChange={(e) => setEditOrder(Number(e.target.value))}
                          className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                        />
                        <div className="flex gap-2 md:col-span-2">
                          <button type="submit" className="text-sm text-blue-600">
                            Lưu
                          </button>
                          <button type="button" className="text-sm text-zinc-500" onClick={() => setEditing(null)}>
                            Hủy
                          </button>
                        </div>
                      </form>
                  </td>
                ) : (
                  <>
                    <td className="p-2">
                      <p className="font-medium">
                        {options.find((o) => o.id === c.id)?.label ?? c.name}
                      </p>
                      <p className="text-xs text-zinc-500">{c.slug}</p>
                    </td>
                    <td className="p-2 text-zinc-600">{c.sortOrder}</td>
                    <td className="p-2">
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          className="text-left text-sm text-blue-600 dark:text-blue-400"
                          onClick={() => startEdit(c)}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="text-left text-sm text-red-600 dark:text-red-400"
                          onClick={() => void onDelete(c.id)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
