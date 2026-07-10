import { getApiUser, json } from "@/lib/api";
import {
  bunnyConfigured,
  createBunnyVideo,
  getBunnyVideo,
  tusUploadAuth,
} from "@/lib/bunny";

export const dynamic = "force-dynamic";

// POST: create a video in the Bunny Stream library and return presigned TUS
// upload auth so the browser uploads directly to Bunny (the API key stays
// server-side). 503 when Bunny isn't configured — the client then falls back
// to the Cloudinary flow.
export async function POST(req: Request) {
  const user = await getApiUser();
  if (!user) return json({ error: "unauthorized" }, 401);
  if (user.role !== "INSTRUCTOR" && user.role !== "ADMIN") {
    return json({ error: "forbidden" }, 403);
  }
  if (!bunnyConfigured) return json({ error: "bunnyNotConfigured" }, 503);

  const body = await req.json().catch(() => ({}) as Record<string, unknown>);
  const title =
    typeof body.title === "string" && body.title.trim()
      ? body.title.trim().slice(0, 200)
      : "Untitled video";

  try {
    const guid = await createBunnyVideo(title);
    const auth = tusUploadAuth(guid);
    return json({ videoId: guid, ...auth });
  } catch {
    return json({ error: "bunnyCreateFailed" }, 502);
  }
}

// GET ?videoId=<guid>: processing status + duration (used to backfill the
// lecture duration once Bunny has probed the file).
export async function GET(req: Request) {
  const user = await getApiUser();
  if (!user) return json({ error: "unauthorized" }, 401);
  if (user.role !== "INSTRUCTOR" && user.role !== "ADMIN") {
    return json({ error: "forbidden" }, 403);
  }
  if (!bunnyConfigured) return json({ error: "bunnyNotConfigured" }, 503);

  const videoId = new URL(req.url).searchParams.get("videoId");
  if (!videoId) return json({ error: "missingVideoId" }, 400);

  const video = await getBunnyVideo(videoId);
  if (!video) return json({ error: "notFound" }, 404);
  return json(video);
}
