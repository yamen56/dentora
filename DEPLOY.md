# Deploying Why Medicine (Vercel + Neon + Cloudinary)

This guide takes Why Medicine from your laptop to a live URL. We launch on a free
`your-app.vercel.app` address first; adding a custom domain later is one extra step.

**Stack:** Vercel (hosts the app) · Neon (Postgres database) · Cloudinary (lecture media).

---

## Step 1 — Put the code on GitHub

The repo is already initialized locally. Create an empty repo on GitHub
(https://github.com/new — name it e.g. `why-medicine`, **don't** add a README), then:

```bash
git remote add origin https://github.com/<your-username>/why-medicine.git
git branch -M main
git push -u origin main
```

> `.env` is git-ignored, so your secrets stay off GitHub. Only `.env.example` is committed.

---

## Step 2 — Create the database (Neon)

1. Sign up at https://neon.tech (free).
2. Create a project → it gives you a **connection string**.
3. In the connection dialog, copy **two** strings:
   - **Pooled** connection (host contains `-pooler`) → this is your `DATABASE_URL`.
   - **Direct** connection (no `-pooler`) → this is your `DIRECT_URL`.

   Both look like `postgresql://USER:PASSWORD@HOST/neondb?sslmode=require`.

---

## Step 3 — Create the schema + admin in Neon

Run this **once** to set up tables and the admin account. Easiest: paste your two
Neon strings here and I'll run it for you. Or do it yourself locally:

```bash
# PowerShell — replace the two URLs with your Neon strings
$env:DATABASE_URL="<neon-pooled-url>"
$env:DIRECT_URL="<neon-direct-url>"
$env:SEED_ADMIN_EMAIL="you@example.com"
$env:SEED_ADMIN_PASSWORD="<a-strong-password>"
npx prisma db push
npx prisma db seed
```

This creates all tables and an admin login you'll use on the live site.

---

## Step 4 — Cloudinary (for lecture video/PDF) — recommended

Without it, instructors must paste direct media URLs. To enable uploads + signed,
watermark-protected delivery:

1. Sign up at https://cloudinary.com (free).
2. From the dashboard copy: **Cloud name**, **API Key**, **API Secret**.
3. You'll add these as env vars in Step 5.

---

## Step 5 — Deploy on Vercel

1. Sign up at https://vercel.com with your GitHub account.
2. **Add New → Project** → import your `why-medicine` repo.
3. Framework preset: **Next.js** (auto-detected). Leave build settings default
   (`npm run build`; `prisma generate` runs automatically on install).
4. Open **Environment Variables** and add these (Production):

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | Neon **pooled** string |
   | `DIRECT_URL` | Neon **direct** string |
   | `NEXTAUTH_SECRET` | a long random string (generate below) |
   | `NEXTAUTH_URL` | leave for now, set in Step 6 |
   | `NEXT_PUBLIC_APP_URL` | leave for now, set in Step 6 |
   | `CLOUDINARY_CLOUD_NAME` | from Cloudinary (optional) |
   | `CLOUDINARY_API_KEY` | from Cloudinary (optional) |
   | `CLOUDINARY_API_SECRET` | from Cloudinary (optional) |
   | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | same as cloud name (optional) |

   Generate a secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

5. Click **Deploy**. After ~1–2 min you get a URL like `https://why-medicine-xxxx.vercel.app`.

---

## Step 6 — Point auth at the live URL

1. Copy your `https://...vercel.app` URL.
2. In Vercel → **Settings → Environment Variables**, set:
   - `NEXTAUTH_URL` = `https://your-app.vercel.app`
   - `NEXT_PUBLIC_APP_URL` = `https://your-app.vercel.app`
3. **Redeploy** (Deployments → ⋯ → Redeploy) so the new values take effect.

> If login redirects misbehave, it's almost always `NEXTAUTH_URL` not matching the real URL.

---

## Step 7 — First login

1. Visit your live URL → **Log in** with the admin email/password from Step 3.
2. **Change the admin password** isn't built-in yet — re-run the seed with a new
   `SEED_ADMIN_PASSWORD` to rotate it, or create a fresh admin in the DB.
3. Approve instructor sign-ups in **Admin → Instructors**, manage course access in
   **Admin → Applications**.

---

## Later — add a real domain

1. Buy a domain (Namecheap, Cloudflare, Porkbun…).
2. Vercel → **Settings → Domains → Add** → enter your domain → follow the DNS
   records it shows (an `A`/`CNAME` at your registrar). HTTPS is automatic.
3. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to the new domain and redeploy.

---

## Updating the app after launch

Every `git push` to `main` triggers an automatic Vercel deploy. If you change
`prisma/schema.prisma`, also run `npx prisma db push` against Neon (Step 3) before/after.
