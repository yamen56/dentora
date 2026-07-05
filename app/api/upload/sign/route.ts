import { getApiUser, json } from "@/lib/api";
import { cloudinaryConfigured, signUploadParams } from "@/lib/cloudinary";

// Returns a short-lived signature so the browser can upload a file directly to
// Cloudinary as a private (authenticated) asset — the file never touches our server.
export async function POST(req: Request) {
  const user = await getApiUser();
  if (!user) return json({ error: "unauthorized" }, 401);
  if (user.role !== "INSTRUCTOR" && user.role !== "ADMIN") {
    return json({ error: "forbidden" }, 403);
  }
  if (!cloudinaryConfigured) {
    return json({ error: "cloudinaryNotConfigured" }, 503);
  }

  const body = await req.json().catch(() => ({}) as Record<string, unknown>);
  const resourceType =
    body.resourceType === "raw"
      ? "raw"
      : body.resourceType === "image"
        ? "image"
        : "video";
  const folder = typeof body.folder === "string" ? body.folder : "why-medicine";

  // Images (thumbnails, profile photos) are shown publicly, so upload them as
  // public. Videos and PDFs are protected content → private (authenticated),
  // delivered only via short-lived signed URLs.
  const deliveryType = resourceType === "image" ? "upload" : "authenticated";

  // Sign exactly the params the browser will send with the upload
  const signParams = { folder, type: deliveryType };
  const signed = signUploadParams(signParams);

  return json({
    ...signed,
    folder,
    type: deliveryType,
    resourceType,
  });
}
