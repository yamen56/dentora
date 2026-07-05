# Why Medicine · واي ميديسن

A full-stack **bilingual (Arabic + English)** online course platform built for
medical-school students. Instructors publish video/PDF lectures and quizzes;
students browse, **apply for access**, and study inside watermark-protected
players. There is **no pricing** — access is granted by approving a student's
application or by an admin adding the student to a course directly.

Built with **Next.js 14 (App Router) · TypeScript · Tailwind + shadcn/ui ·
Prisma + PostgreSQL · NextAuth · Cloudinary · next-intl**.

---

## ✨ Features

- **Two roles + admin** — students, instructors (reviewed before activation), and a superuser admin.
- **Bilingual UI** with full **RTL** for Arabic; language is stored in a cookie and switchable from any page. Dark mode included.
- **Application-based access (no payments)** — students apply to a course; the course's instructor or an admin approves the request (which enrolls them), or an admin adds a student to a course directly by email.
- **Instructor dashboard** — create/edit courses (AR + EN), upload lectures (video + optional PDF), **drag-and-drop** lecture ordering, a question bank (MCQ + short answer) attachable to a lecture or the whole course, an **Applications** tab to approve/reject access requests, enrolled-student lists, per-lecture completion analytics, and publish/unpublish.
- **Student experience** — catalog with category/language/difficulty filters and search, one-click course applications, a personal dashboard with progress, lecture completion tracking, and quizzes with scoring.
- **Identity watermarking (the core anti-piracy feature):**
  - **Video** — a `<canvas>` overlay paints the student's name + phone over the player. It moves to a random position every 5–8 s, is redrawn every second (so clearing it via devtools is futile), and is injected into the player's fullscreen container so it can't be cropped.
  - **PDF** — rendered with **PDF.js** on a canvas, with a tiled diagonal name/phone watermark stamped on every page. The original file is **never** exposed: bytes are streamed through an authenticated server proxy.
- **Security** — server-side session checks on every API route, role-based middleware, rate-limited auth/registration, Zod-validated input, signed & expiring Cloudinary delivery URLs, and quiz answers graded server-side (correct answers are never sent to the browser before submission).

---

## 🧰 Prerequisites

- **Node.js ≥ 18.17** (tested on 24.x)
- **PostgreSQL** database (local install, Docker, or a hosted provider such as Neon/Supabase/Railway)

> Cloudinary is **optional for local dev** — the app degrades gracefully:
> you can paste direct media URLs instead of uploading.

---

## 🚀 Getting started

```bash
# 1. Install dependencies (runs `prisma generate` automatically)
npm install

# 2. Configure environment
cp .env.example .env
#    then edit .env — at minimum set DATABASE_URL and NEXTAUTH_SECRET
#    generate a secret with:  openssl rand -base64 32

# 3. Create the database schema
npm run db:push        # or: npm run db:migrate  (for migration history)

# 4. Seed categories + the admin user
npm run db:seed

# 5. Run it
npm run dev            # http://localhost:3000
```

### Default admin

The seed creates an admin from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`
(defaults: `admin@whymedicine.app` / `ChangeMe123!`). Log in, open **Admin →
Instructors**, and approve instructor sign-ups from there.

### Typical first run

1. Register a **student** (auto-logs in) and an **instructor** (awaits approval).
2. As **admin**, approve the instructor.
3. As the **instructor**, create a course, add a lecture (paste a video URL if
   Cloudinary isn't configured), add a quiz question, and **publish**.
4. As the **student**, browse `/courses` and **apply** to a course.
5. As the **instructor** (Applications tab) or **admin**, approve the request — or
   have the admin add the student directly. The student then studies at
   `/learn/<courseId>`.

---

## 🔑 Environment variables

See [`.env.example`](./.env.example) for the full annotated list. Summary:

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXTAUTH_URL`, `NEXTAUTH_SECRET` | ✅ | NextAuth session/JWT |
| `CLOUDINARY_*`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | optional | Signed video/PDF storage & uploads |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | optional | Seeded admin credentials |

---

## 📁 Project structure

```
app/
  (auth)/         login & register
  (student)/      dashboard, learn/[courseId] (player)
  (instructor)/   instructor dashboard & course management
  (admin)/        admin panel
  courses/        public catalog + course detail
  api/            route handlers (auth, courses, course apply, applications
                  review, admin enrollments, lectures, questions, progress,
                  quiz, media proxy, upload signing, admin)
components/
  ui/             shadcn/ui primitives
  instructor/     course form, lecture manager (dnd), question manager
  admin/          instructor/user/course/category management, enroll-student form
  apply-button.tsx, application-actions.tsx
  watermark-video-player.tsx, pdf-viewer.tsx, quiz-panel.tsx, learn-client.tsx
lib/              prisma, auth, cloudinary, enroll, validations, rate-limit, …
i18n/             next-intl request config
messages/         en.json, ar.json
prisma/           schema.prisma, seed.ts
```

## 📜 Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run db:push` | Push the schema to the database |
| `npm run db:migrate` | Create & apply a migration |
| `npm run db:seed` | Seed categories + admin |
| `npm run db:studio` | Open Prisma Studio |
| `npm run lint` | ESLint |

---

## 🛡️ Notes on the watermark design

The brief required browser-layer watermarking that survives inspect-element and
fullscreen, and that raw file URLs are never exposed. Accordingly:

- Videos are delivered via **short-lived signed URLs** (Cloudinary `authenticated`
  type) fetched through `/api/media/.../video`; the watermark canvas lives inside
  the Plyr fullscreen container.
- PDFs are **fully proxied** as bytes through `/api/media/.../pdf` — the source
  URL never reaches the network tab — and watermarked per page on the client.

These are strong deterrents, not DRM; a determined attacker with a screen
recorder can still capture content (true of every web platform). The watermark
makes any leak **traceable to the individual student**.
