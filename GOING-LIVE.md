# Going live — domain, SEO, Bunny.net video

The code side of all three is done and deployed. This file is the checklist of
the account/purchase steps only the owner can do, and what to hand back to
Claude afterwards.

---

## 1. Domain — decided: **whymedicine.app**

Confirmed available via RDAP (July 2026; `whymedicine.com` is taken).
Note: `.app` is an HTTPS-only TLD (HSTS-preloaded) — perfect on Vercel, which
issues certificates automatically.

**Where to buy:** easiest is directly in Vercel (Dashboard → dentora project →
Settings → Domains → type `whymedicine.app` → Buy, ~$15–20/yr) — DNS + HTTPS
are wired automatically. Cloudflare Registrar or Namecheap work too; then add
the domain under Settings → Domains and set the two DNS records Vercel shows.

**After buying, two env vars must change** (Vercel → Settings → Environment
Variables), then redeploy — or just tell Claude "domain bought" and it's done
for you:

- `NEXT_PUBLIC_SITE_URL` = `https://whymedicine.app` (drives sitemap,
  canonical URLs, Open Graph)
- `NEXTAUTH_URL` = `https://whymedicine.app` (login redirects)

## 2. SEO — done in code, two manual steps

Already live: page titles/descriptions (per-course too), Open Graph + Twitter
cards with a branded share image, `sitemap.xml` (auto-includes every published
course), `robots.txt` (blocks admin/learn/api pages from crawlers), Course +
EducationalOrganization structured data, PWA manifest.

Manual, after the domain is set:

1. **Google Search Console** (search.google.com/search-console) → add the
   domain → verify (one DNS record) → submit
   `https://whymedicine.app/sitemap.xml`.
2. **Bing Webmaster Tools** (bing.com/webmasters) → same, it can import from
   Search Console.

Content note: rankings will come from course pages. Course descriptions are
the SEO surface — write them as real paragraphs with the terms students search
("USMLE Step 1 pathology", "physiology for medical students", Arabic terms).

## 3. Bunny.net Stream (video hosting)

The app now uploads lecture videos to Bunny Stream automatically **once the
env vars exist** — until then it silently keeps using Cloudinary, and existing
Cloudinary videos keep playing either way.

Setup (~10 minutes):

1. Create account at **bunny.net** (Stream pricing: ~$0.005/GB storage/month +
   ~$0.005–0.01/GB streamed).
2. Dashboard → **Stream** → **Add Video Library** — name it `why-medicine`,
   pick the standard tier, replication regions near your students (Europe
   covers Jordan well).
3. In the library, collect four values → add as env vars in Vercel
   (Settings → Environment Variables, all environments):
   - `BUNNY_STREAM_LIBRARY_ID` — the numeric ID (library page URL / overview)
   - `BUNNY_STREAM_API_KEY` — library **API** section (the library key, not
     the account key)
   - `BUNNY_STREAM_CDN_HOSTNAME` — library CDN hostname, looks like
     `vz-xxxxxxxx-xxx.b-cdn.net`
   - `BUNNY_STREAM_TOKEN_KEY` — library **Security** → enable **Token
     Authentication**, copy its key. (Recommended: makes every video URL
     signed and expiring, so links can't be shared.)
4. Also in **Security**: enable "Block direct URL file access" only if token
   auth is on; leave MP4 fallback off (HLS only is fine — the player handles it).
5. Redeploy (or just tell Claude — env changes need a redeploy to apply).

How it works after that: instructor uploads go browser → Bunny (resumable, so
big files survive connection drops), students get short-lived signed HLS URLs
through the same enrollment-checked API as before, and the moving name/phone
watermark stays on top of the player. Cloudinary remains in use for images and
PDFs.

## 4. What to tell Claude when the accounts exist

- "Domain bought" → wires whymedicine.app to the Vercel project + env vars +
  redeploy. (Search Console verification still needs your Google login.)
- "Bunny env vars added" → redeploys, uploads a test video end-to-end, checks
  signed playback.
