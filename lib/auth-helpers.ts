import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { authOptions } from "./auth";
import { prisma } from "./prisma";
import { roleHome } from "./constants";

export { roleHome };

export async function getSession() {
  return getServerSession(authOptions);
}

/**
 * One active session per student: the token carries the sessionId issued at
 * login, and it must still match the one stored on the user. A newer login on
 * another device rotates that id, which invalidates this one. Non-students and
 * legacy sessions (issued before this feature) are always allowed.
 */
export async function isActiveSession(user: {
  id: string;
  role: Role;
  sessionId?: string | null;
}) {
  if (user.role !== "STUDENT") return true;
  if (!user.sessionId) return true;
  const db = await prisma.user.findUnique({
    where: { id: user.id },
    select: { sessionId: true },
  });
  return Boolean(db) && db!.sessionId === user.sessionId;
}

export async function getCurrentUser() {
  const session = await getSession();
  const user = session?.user ?? null;
  if (!user) return null;
  if (!(await isActiveSession(user))) return null;
  return user;
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
