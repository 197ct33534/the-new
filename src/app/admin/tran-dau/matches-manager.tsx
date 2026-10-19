"use client";

import { MatchStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  createAdminMatch,
  deleteAdminMatch,
  updateAdminMatch,
} from "@/actions/admin-matches";

type TeamOption = { id: string; name: string; shortName: string | null };

export type AdminMatchRow = {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  league: string | null;
  venue: string | null;
  kickoffAt: string | Date;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
};

const statuses: MatchStatus[] = [
  MatchStatus.SCHEDULED,
  MatchStatus.LIVE,
  MatchStatus.FINISHED,
  MatchStatus.POSTPONED,
  MatchStatus.CANCELLED,
];

const statusLabel: Record<MatchStatus, string> = {
  [MatchStatus.SCHEDULED]: "Sắp đá",
  [MatchStatus.LIVE]: "Đang đá",
  [MatchStatus.FINISHED]: "Kết thúc",
  [MatchStatus.POSTPONED]: "Hoãn",
  [MatchStatus.CANCELLED]: "Huỷ",
};

/** Định dạng Date về chuỗi local `YYYY-MM-DDTHH:mm` cho input datetime-local. */
function toLocalInputValue(value: string | Date) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type Props = { teams: TeamOption[]; matches: AdminMatchRow[]; canManage: boolean };

export function MatchesManager({ teams, matches, canManage }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<AdminMatchRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    setPending(true);
    const payload = {
      homeTeamId: String(fd.get("homeTeamId")),
      awayTeamId: String(fd.get("awayTeamId")),
      league: String(fd.get("league") ?? ""),
      venue: String(fd.get("venue") ?? ""),
      kickoffAt: String(fd.get("kickoffAt")),
      status: fd.get("status") as MatchStatus,
      homeScore: fd.get("homeScore") ? Number(fd.get("homeScore")) : null,
      awayScore: fd.get("awayScore") ? Number(fd.get("awayScore")) : null,
    };
    const res = editing
      ? await updateAdminMatch({ id: editing.id, ...payload })
      : await createAdminMatch(payload);
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setEditing(null);
    e.currentTarget.reset();
    router.refresh();
  }

  async function onDelete(row: AdminMatchRow) {
    if (!window.confirm(`Xoá trận ${row.homeTeam.name} vs ${row.awayTeam.name}?`)) return;
    setError(null);
    setDeletingId(row.id);
    const res = await deleteAdminMatch(row.id);
    setDeletingId(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (editing?.id === row.id) setEditing(null);
    router.refresh();
  }

  if (teams.length < 2) {
    return (
      <p className="text-sm text-amber-700 dark:text-amber-400">
        Cần ít nhất hai đội trong hệ thống (chạy seed hoặc thêm đội qua DB) để tạo trận.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {canManage ? (
      <form
        key={editing?.id ?? "new"}
        onSubmit={onSubmit}
        className="max-w-xl space-y-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {editing
            ? `Sửa trận: ${editing.homeTeam.name} vs ${editing.awayTeam.name}`
            : "Thêm trận"}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Đội nhà</label>
            <select
              name="homeTeamId"
              required
              defaultValue={editing?.homeTeamId ?? teams[0]?.id}
              className="w-full rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.shortName ?? t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Đội khách</label>
            <select
              name="awayTeamId"
              required
              defaultValue={editing?.awayTeamId ?? (teams.length > 1 ? teams[1].id : teams[0]?.id)}
              className="w-full rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.shortName ?? t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Giải / vòng</label>
            <input
              name="league"
              type="text"
              placeholder="V.League 1"
              defaultValue={editing?.league ?? ""}
              className="w-full rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Sân</label>
            <input
              name="venue"
              type="text"
              defaultValue={editing?.venue ?? ""}
              className="w-full rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Thời điểm</label>
            <input
              name="kickoffAt"
              type="datetime-local"
              required
              defaultValue={editing ? toLocalInputValue(editing.kickoffAt) : ""}
              className="w-full rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Trạng thái</label>
            <select
              name="status"
              required
              defaultValue={editing?.status ?? MatchStatus.SCHEDULED}
              className="w-full rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {statusLabel[s]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Bàn nhà (tuỳ chọn)</label>
            <input
              name="homeScore"
              type="number"
              min={0}
              defaultValue={editing?.homeScore ?? ""}
              className="w-full rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Bàn khách (tuỳ chọn)</label>
            <input
              name="awayScore"
              type="number"
              min={0}
              defaultValue={editing?.awayScore ?? ""}
              className="w-full rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
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
            {pending ? "Đang lưu…" : editing ? "Cập nhật" : "Tạo trận"}
          </button>
          {editing ? (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setError(null);
              }}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600"
            >
              Huỷ sửa
            </button>
          ) : null}
        </div>
      </form>
      ) : null}
      {!canManage && error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left dark:border-zinc-800 dark:bg-zinc-900">
              <th className="px-3 py-2 font-semibold">Thời gian</th>
              <th className="px-3 py-2 font-semibold">Trận</th>
              <th className="px-3 py-2 font-semibold">Giải</th>
              <th className="px-3 py-2 font-semibold">Trạng thái</th>
              <th className="px-3 py-2 font-semibold">Tỉ số</th>
              {canManage ? <th className="px-3 py-2 font-semibold" /> : null}
            </tr>
          </thead>
          <tbody>
            {matches.map((m) => (
              <tr key={m.id} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="whitespace-nowrap px-3 py-2 text-zinc-600 dark:text-zinc-400">
                  {new Date(m.kickoffAt).toLocaleString("vi-VN")}
                </td>
                <td className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-50">
                  {m.homeTeam.name} vs {m.awayTeam.name}
                </td>
                <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{m.league ?? "—"}</td>
                <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{statusLabel[m.status]}</td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums text-zinc-800 dark:text-zinc-200">
                  {m.homeScore != null && m.awayScore != null ? `${m.homeScore} - ${m.awayScore}` : "—"}
                </td>
                {canManage ? (
                <td className="whitespace-nowrap px-3 py-2">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(m);
                        setError(null);
                      }}
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === m.id}
                      onClick={() => onDelete(m)}
                      className="text-red-600 hover:underline disabled:opacity-60 dark:text-red-400"
                    >
                      {deletingId === m.id ? "Đang xoá…" : "Xoá"}
                    </button>
                  </div>
                </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
        {matches.length === 0 ? (
          <p className="p-4 text-sm text-zinc-500">Chưa có trận. Thêm từ form trên hoặc chạy seed.</p>
        ) : null}
      </div>
    </div>
  );
}
