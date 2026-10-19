import { canReviewOrPublish } from "@/lib/permissions";
import { requireStaffSession } from "@/lib/auth-session";
import { listAdminMatches } from "@/actions/admin-matches";
import { listAdminTeams } from "@/actions/admin-teams";
import { Pagination } from "@/components/admin/pagination";

import { MatchesManager } from "./matches-manager";

type Search = { page?: string };

export default async function AdminMatchesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { user } = await requireStaffSession();
  const sp = await searchParams;
  const page = Number(sp.page) > 0 ? Math.floor(Number(sp.page)) : 1;
  const [teamsRaw, matchPage] = await Promise.all([listAdminTeams(), listAdminMatches({ page })]);
  const teams = teamsRaw.map((t) => ({ id: t.id, name: t.name, shortName: t.shortName }));
  const canManage = canReviewOrPublish(user.role);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trận đấu</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Danh sách trận và thêm / sửa / xoá lịch (biên tập / quản trị).
        </p>
      </div>

      <MatchesManager teams={teams} matches={matchPage.items} canManage={canManage} />
      <Pagination
        page={matchPage.page}
        total={matchPage.total}
        pageSize={matchPage.pageSize}
        basePath="/admin/tran-dau"
      />
    </div>
  );
}
