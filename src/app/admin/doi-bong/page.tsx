import { listAdminTeams } from "@/actions/admin-teams";
import { requireStaffSession } from "@/lib/auth-session";
import { canReviewOrPublish } from "@/lib/permissions";
import { unauthorized } from "next/navigation";

import { TeamsManager } from "./teams-manager";

export default async function AdminTeamsPage() {
  const { user } = await requireStaffSession();
  if (!canReviewOrPublish(user.role)) unauthorized();
  const teams = await listAdminTeams();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Đội bóng</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Quản lý đội dùng cho lịch thi đấu và gắn bài viết (biên tập / quản trị).
        </p>
      </div>
      <TeamsManager teams={teams} />
    </div>
  );
}
