import { requireRole } from "@/lib/auth-helpers";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("ADMIN");
  return <div className="container py-8">{children}</div>;
}
