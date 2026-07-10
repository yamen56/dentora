import { createHash } from "crypto";

/**
 * Bunny.net Stream integration (server-side only).
 *
 * Videos live in a Bunny Stream library and are referenced on the Lecture row
 * as `videoPublicId = "bunny:<guid>"` so they share the pipeline Cloudinary
 * uses. Uploads go browser → Bunny via TUS with a signature minted here; the
 * API key never reaches the client. Playback URLs are the library's HLS
 * playlist, signed with the library token key when token auth is enabled.
 *
 * Required env vars (see .env.example):
 *   BUNNY_STREAM_LIBRARY_ID    — numeric library id
 *   BUNNY_STREAM_API_KEY       — the library's API key (NOT the account key)
 *   BUNNY_STREAM_CDN_HOSTNAME  — e.g. vz-abc123-def.b-cdn.net
 * Optional:
 *   BUNNY_STREAM_TOKEN_KEY     — library "Token Authentication Key"; when set,
 *                                playback URLs are signed and expire.
 */

const API_BASE = "https://video.bunnycdn.com";

const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
const apiKey = process.env.BUNNY_STREAM_API_KEY;
const cdnHostname = process.env.BUNNY_STREAM_CDN_HOSTNAME;
const tokenKey = process.env.BUNNY_STREAM_TOKEN_KEY;

export const bunnyConfigured = Boolean(libraryId && apiKey && cdnHostname);

export const BUNNY_PREFIX = "bunny:";

export function isBunnyId(publicId: string | null | undefined): boolean {
  return Boolean(publicId?.startsWith(BUNNY_PREFIX));
}

export function bunnyGuid(publicId: string): string {
  return publicId.slice(BUNNY_PREFIX.length);
}

/** Create an empty video in the library; returns its guid. */
export async function createBunnyVideo(title: string): Promise<string> {
  const res = await fetch(`${API_BASE}/library/${libraryId}/videos`, {
    method: "POST",
    headers: { AccessKey: apiKey as string, "content-type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`bunny createVideo failed: ${res.status}`);
  const data = (await res.json()) as { guid: string };
  return data.guid;
}

export async function getBunnyVideo(guid: string): Promise<{
  length: number;
  status: number;
} | null> {
  const res = await fetch(`${API_BASE}/library/${libraryId}/videos/${guid}`, {
    headers: { AccessKey: apiKey as string },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { length?: number; status?: number };
  return { length: data.length ?? 0, status: data.status ?? 0 };
}

export async function deleteBunnyVideo(guid: string): Promise<void> {
  await fetch(`${API_BASE}/library/${libraryId}/videos/${guid}`, {
    method: "DELETE",
    headers: { AccessKey: apiKey as string },
  }).catch(() => {});
}

/**
 * Presigned auth for a browser TUS upload to https://video.bunnycdn.com/tusupload
 * (signature = sha256 hex of libraryId + apiKey + expiration + videoId).
 */
export function tusUploadAuth(videoGuid: string, ttlSeconds = 60 * 60 * 6) {
  const expiration = Math.floor(Date.now() / 1000) + ttlSeconds;
  const signature = createHash("sha256")
    .update(`${libraryId}${apiKey}${expiration}${videoGuid}`)
    .digest("hex");
  return { signature, expiration, libraryId: libraryId as string };
}

/**
 * The library has two independent protections: embed token auth (always on
 * for us) and token auth on DIRECT file URLs. Path-style signed URLs 404 when
 * the latter is off, and plain URLs 403 when it's on — so we probe the CDN
 * (cached 5 min) and emit whichever form the library currently expects. That
 * way flipping the toggle in the Bunny dashboard needs no redeploy.
 */
let urlAuthCache: { enforced: boolean; checkedAt: number } | null = null;

async function urlTokenAuthEnforced(sampleGuid: string): Promise<boolean> {
  if (urlAuthCache && Date.now() - urlAuthCache.checkedAt < 5 * 60_000) {
    return urlAuthCache.enforced;
  }
  try {
    const res = await fetch(
      `https://${cdnHostname}/${sampleGuid}/playlist.m3u8`,
      {
        // Refererless requests are blocked outright, so send a page referer —
        // only a 403 *with* referer means URL token auth is enforced.
        headers: { referer: "https://whymedicine.app/" },
        cache: "no-store",
      },
    );
    const enforced = res.status === 403;
    urlAuthCache = { enforced, checkedAt: Date.now() };
    return enforced;
  } catch {
    // CDN unreachable from here; assume signing if we hold a key.
    return Boolean(tokenKey);
  }
}

/**
 * HLS playback URL for a video. When the library enforces token auth on
 * direct URLs (and we hold the key), returns a path-style signed URL with a
 * directory-scoped token — it covers the playlist and every segment, and
 * expires. Otherwise returns the plain URL, which the library still shields
 * from refererless access (curl, download managers, pasted links).
 */
export async function bunnyPlaybackUrl(
  videoGuid: string,
  expiresInSeconds = 60 * 60 * 6,
): Promise<string> {
  const plain = `https://${cdnHostname}/${videoGuid}/playlist.m3u8`;
  if (!tokenKey || !(await urlTokenAuthEnforced(videoGuid))) return plain;

  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const path = `/${videoGuid}/`;
  const token = createHash("sha256")
    .update(`${tokenKey}${path}${expires}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `https://${cdnHostname}/bcdn_token=${token}&expires=${expires}&token_path=${encodeURIComponent(path)}/${videoGuid}/playlist.m3u8`;
}
