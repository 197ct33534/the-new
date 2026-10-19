import { auth } from "@/auth";
import type { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { canAccessAdminDashboard } from "@/lib/permissions";

export type SessionUser = {
  id: string;
  email: string | null | undefined;
  name: string | null | undefined;
  role: UserRole;
};

export async function requireStaffSession(redirectTo = "/dang-nhap") {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(redirectTo);
  }
  const role = session.user.role;
  if (!canAccessAdminDashboard(role)) {
    redirect("/");
  }
  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role,
    } satisfies SessionUser,
  };
}

export async function getOptionalSession() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
    } satisfies SessionUser,
  };
}
