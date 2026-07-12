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
 * Validate the JWT's claims against the database on every request, so account
 * changes take effect immediately instead of when the 30-day token expires:
 * the user must still exist and be active, hold the role the token was issued
 * with, instructors must still be approved, and a student token must carry the
 * sessionId from their latest login (one active device per student; legacy
 * student tokens without a sessionId are allowed).
 */
export async function isValidSession(user: {
  id: string;
  role: Role;
  sessionId?: string | null;
}) {
  const db = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      isActive: true,
      role: true,
      sessionId: true,
      instructorStatus: true,
    },
  });
  if (!db || !db.isActive) return false;
  if (db.role !== user.role) return false;
  if (db.role === "INSTRUCTOR" && db.instructorStatus !== "APPROVED") {
    return false;
  }
  if (
    db.role === "STUDENT" &&
    user.sessionId &&
    db.sessionId !== user.sessionId
  ) {
    return false;
  }
  return true;
}

export async function getCurrentUser() {
  const session = await getSession();
  const user = session?.user ?? null;
  if (!user) return null;
  if (!(await isValidSession(user))) return null;
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
