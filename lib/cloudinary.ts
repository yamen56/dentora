import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export const cloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
);

/**
 * Build a signed, time-limited delivery URL for a protected asset.
 * Assets are uploaded as `type: "authenticated"`, so the raw URL is never
 * publicly accessible — only this signed URL (valid for `expiresInSeconds`).
 */
export function signedDeliveryUrl(
  publicId: string,
  resourceType: "video" | "image" | "raw" = "video",
  expiresInSeconds = 60 * 60,
): string {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    type: "authenticated",
    secure: true,
    sign_url: true,
    expires_at: expiresAt,
  });
}

/**
 * Signature for direct (signed) browser uploads. The browser posts the file
 * straight to Cloudinary using this signature so large videos never pass
 * through our server.
 */
export function signUploadParams(params: Record<string, string | number>) {
  const timestamp = Math.round(Date.now() / 1000);
  const toSign = { timestamp, ...params };
  const signature = cloudinary.utils.api_sign_request(
    toSign,
    process.env.CLOUDINARY_API_SECRET as string,
  );
  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  };
}
