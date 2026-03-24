import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDashboardRoute } from "@/lib/permissions";
import type { UserRole } from "@/lib/permissions";

export default async function HomePage() {
  const session = await auth();
  if (!session) redirect("/login");
  redirect(getDashboardRoute(session.user.role as UserRole));
}
