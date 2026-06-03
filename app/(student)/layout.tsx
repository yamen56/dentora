import { requireRole } from "@/lib/auth-helpers";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("STUDENT");
  return <>{children}</>;
}
