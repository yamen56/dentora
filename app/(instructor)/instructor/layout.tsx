import { requireRole } from "@/lib/auth-helpers";

export default async function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("INSTRUCTOR");
  return <div className="container py-8">{children}</div>;
}
