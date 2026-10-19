import { requireStaffSession } from "@/lib/auth-session";
import { AdminNavClient } from "@/components/admin/admin-nav-client";

type Props = {
  children: React.ReactNode;
};

export async function AdminShell({ children }: Props) {
  const { user } = await requireStaffSession();
  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto flex max-w-6xl gap-0 md:gap-8">
        <aside className="w-48 shrink-0 border-r border-zinc-200 p-4 dark:border-zinc-800 md:w-56">
          <AdminNavClient userEmail={user.email} role={user.role} />
        </aside>
        <div className="min-w-0 flex-1 p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
