import { getLocale, getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { ROUTES } from "@/constants/routes";
import { redirect } from "@/i18n/navigation";

import { AccountProfileForm } from "./account-profile-form";

export default async function AccountPage() {
  const session = await auth().catch(() => null);
  const t = await getTranslations("account");
  const locale = await getLocale();

  if (!session?.user?.id) {
    redirect({
      href: { pathname: ROUTES.signIn, query: { callbackUrl: ROUTES.account } },
      locale,
    });
  }

  const user = session!.user;

  return (
    <div className="mx-auto max-w-lg space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t("pageSubtitle")}</p>
      </div>
      <dl className="space-y-2 text-sm">
        <div>
          <dt className="text-zinc-500">{t("emailLabel")}</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-50">{user.email ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">{t("roleLabel")}</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-50">{user.role}</dd>
        </div>
      </dl>
      <AccountProfileForm initialName={user.name ?? ""} />
    </div>
  );
}
