"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createAdminTeam, deleteAdminTeam, updateAdminTeam } from "@/actions/admin-teams";

export type AdminTeamRow = {
  id: string;
  slug: string;
  name: string;
  shortName: string | null;
  country: string | null;
  stadium: string | null;
  logoUrl: string | null;
  foundedYear: number | null;
};

type Props = { teams: AdminTeamRow[] };

export function TeamsManager({ teams }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<AdminTeamRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    setPending(true);
    const payload = {
      name: String(fd.get("name") ?? ""),
      shortName: String(fd.get("shortName") ?? ""),
      country: String(fd.get("country") ?? ""),
      stadium: String(fd.get("stadium") ?? ""),
      logoUrl: String(fd.get("logoUrl") ?? ""),
      foundedYear: fd.get("foundedYear") ? Number(fd.get("foundedYear")) : null,
    };
    const res = editing
      ? await updateAdminTeam({ id: editing.id, ...payload })
      : await createAdminTeam(payload);
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setEditing(null);
    e.currentTarget.reset();
    router.refresh();
  }

  async function onDelete(team: AdminTeamRow) {
    if (!window.confirm(`Xoá đội "${team.name}"?`)) return;
    setError(null);
    setDeletingId(team.id);
    const res = await deleteAdminTeam(team.id);
    setDeletingId(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (editing?.id === team.id) setEditing(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form
        key={editing?.id ?? "new"}
        onSubmit={onSubmit}
        className="max-w-xl space-y-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {editing ? `Sửa đội: ${editing.name}` : "Thêm đội mới"}
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">Tên đội *</label>
            <input
              name="name"
              required
              defaultValue={editing?.name ?? ""}
              className="w-full rounded-md border border-zinc-300 px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">Tên ngắn</label>
            <input
              name="shortName"
              defaultValue={editing?.shortName ?? ""}
              className="w-full rounded-md border border-zinc-300 px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">Quốc gia</label>
            <input
              name="country"
              defaultValue={editing?.country ?? ""}
              className="w-full rounded-md border border-zinc-300 px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">Sân nhà</label>
            <input
              name="stadium"
              defaultValue={editing?.stadium ?? ""}
              className="w-full rounded-md border border-zinc-300 px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">URL logo</label>
            <input
              name="logoUrl"
              type="url"
              defaultValue={editing?.logoUrl ?? ""}
              className="w-full rounded-md border border-zinc-300 px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">Năm thành lập</label>
            <input
              name="foundedYear"
              type="number"
              min={1800}
              max={2100}
              defaultValue={editing?.foundedYear ?? ""}
              className="w-full rounded-md border border-zinc-300 px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
        </div>
        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {pending ? "Đang lưu…" : editing ? "Cập nhật" : "Tạo đội"}
          </button>
          {editing ? (
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600"
            >
              Huỷ sửa
            </button>
          ) : null}
        </div>
      </form>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th className="p-2 font-medium">Tên</th>
              <th className="p-2 font-medium">Slug</th>
              <th className="p-2 font-medium">Sân</th>
              <th className="p-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.id} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="p-2 font-medium text-zinc-900 dark:text-zinc-50">{t.name}</td>
                <td className="p-2 text-zinc-600 dark:text-zinc-400">{t.slug}</td>
                <td className="p-2 text-zinc-600 dark:text-zinc-400">{t.stadium ?? "—"}</td>
                <td className="p-2">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(t);
                        setError(null);
                      }}
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === t.id}
                      onClick={() => onDelete(t)}
                      className="text-red-600 hover:underline disabled:opacity-60 dark:text-red-400"
                    >
                      {deletingId === t.id ? "Đang xoá…" : "Xoá"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {teams.length === 0 ? <p className="p-4 text-sm text-zinc-500">Chưa có đội.</p> : null}
      </div>
    </div>
  );
}
