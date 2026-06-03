import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Public list of categories (used by filters and the course form).
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { nameEn: "asc" },
    });
    return json({ categories });
  } catch {
    return json({ categories: [] });
  }
}
