# 🦅 Soaring Photos

A private, invite-only Instagram-style photo & video sharing app for family members.

## Features

- **Invite-only registration** — admins generate single-use invite links (`/admin/invites`); links expire after 7 days
- **Family feed** — a public stream (visible to all registered members) of photo/video posts, newest first, with pagination
- **Posts** — up to 10 images (JPG/PNG/WebP/GIF) or one short video (MP4/WebM/MOV, ≤60s, ≤100 MB) plus a short caption (≤500 chars); multi-image posts render as a carousel
- **Likes** — heart any post, with live count
- **Comments** — comment on posts from the feed or the post detail page
- **Forward / share** — send a post to another family member; it lands in their "Shared with me" inbox (unread badge in the navbar)
- **Profiles** — per-user page with their post grid and an optional profile photo
- **Private media** — uploaded files are served through an authenticated route, never from a public folder
- **PWA push notifications** — opt in on the Notifications page to receive new-post and mention alerts while the app is closed

## Tech stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS · Prisma + SQLite · iron-session (cookie auth) · bcryptjs · zod · pluggable media storage (local disk or S3/MinIO via AWS SDK)

## Getting started

```bash
npm install          # install dependencies (also runs prisma generate)
npm run db:migrate   # create the SQLite database (prisma migrate dev)
npm run db:seed      # create the admin user + print an invite link
npm run dev          # start the dev server at http://localhost:3000
```

Then:

1. Sign in as the admin (credentials printed by the seed script; defaults: `admin` / `change-me-admin` — set `ADMIN_USERNAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` before seeding to change them).
2. Open **Invites** in the navbar to generate invite links and send them to family members.
3. Family members open the link, pick a username + email + password, and start posting.

## Configuration

Copy `.env.example` to `.env` and adjust:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite location (default `file:./dev.db`) |
| `SESSION_SECRET` | Cookie encryption secret — **required ≥ 32 chars** |
| `STORAGE_DRIVER` | `local` (default) or `s3` |
| `UPLOAD_DIR` | Folder for uploaded media when using `local` (default `./uploads`) |
| `S3_ENDPOINT` / `S3_REGION` / `S3_BUCKET` / `S3_ACCESS_KEY` / `S3_SECRET_KEY` | S3-compatible storage (e.g. MinIO) when using `s3` |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Web Push credentials and a `mailto:` contact address |

### Push notifications

Generate a VAPID key pair once per deployed environment, then add it to `.env` (or your hosting provider's environment settings):

```bash
npx web-push generate-vapid-keys
```

Push notifications require HTTPS in production. Each family member enables them from **Notifications** on every browser or device where they want alerts.

### Offloading media to MinIO / S3

Set `STORAGE_DRIVER="s3"` and the `S3_*` variables. For a local MinIO instance:

```bash
docker run -p 9000:9000 -p 9001:9001 minio/minio server /data --console-address ":9001"
# create a bucket named "soaringphotos" in the MinIO console (http://localhost:9001)
```

and use `S3_ENDPOINT="http://localhost:9000"`, `S3_BUCKET="soaringphotos"`.

## Project structure

```
app/
  (public)/login|invite/[token]   # public pages
  (app)/                          # authenticated pages (feed, create, post, shared, profile, admin)
  actions/                        # server actions (auth, likes, comments, shares, invites)
  api/posts                       # post upload (route handler, supports large files)
  api/media/[key]                 # authenticated media serving
components/                       # UI components (PostCard, MediaCarousel, LikeButton, …)
lib/                              # db, session, auth guards, storage abstraction, validation
prisma/                           # schema + seed
middleware.ts                     # redirects unauthenticated visitors to /login
```

## Notes & limits

- Video duration (≤60s) is checked in the browser when picking the file; server-side, size and MIME type are enforced.
- Likes/comments use Next.js server actions; post uploads use a route handler so large videos aren't limited by the server-action body-size cap.
- Media deletion on post-delete isn't implemented yet (posts are permanent in v1).
