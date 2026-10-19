"use client";

import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { updateAccountProfile } from "@/actions/account";

type Props = { initialName: string };

export function AccountProfileForm({ initialName }: Props) {
  const t = useTranslations("account");
  const { update } = useSession();
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);
    setPending(true);
    const res = await updateAccountProfile({ name });
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setOk(true);
    await update({ name: res.name });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div>
        <label htmlFor="acc-name" className="mb-1 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {t("displayName")}
        </label>
        <input
          id="acc-name"
          name="name"
          type="text"
          maxLength={120}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      {ok ? <p className="text-sm text-emerald-700 dark:text-emerald-400">{t("saved")}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending ? t("saving") : t("save")}
      </button>
    </form>
  );
}
