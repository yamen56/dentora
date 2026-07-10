import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://dentora-delta.vercel.app";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const courses = await prisma.course
    .findMany({
      where: { isPublished: true },
      select: { id: true, updatedAt: true },
    })
    .catch(() => []);

  return [
    {
      url: siteUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/courses`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/register`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...courses.map((c) => ({
      url: `${siteUrl}/courses/${c.id}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
