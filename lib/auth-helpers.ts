import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { authOptions } from "./auth";
import { roleHome } from "./constants";

export { roleHome };

export async function getSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

/** Redirect to /login if not authenticated. Returns the user otherwise. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Redirect unless the user has one of the allowed roles. */
export async function requireRole(roles: Role | Role[]) {
  const user = await requireUser();
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(user.role)) {
    // Send users to the dashboard that matches their actual role
    redirect(roleHome(user.role));
  }
  return user;
}
