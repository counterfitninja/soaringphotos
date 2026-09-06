# Famstagram — Project Instructions

Private, invite-only Instagram-style photo & video sharing app for family members.

## Stack
- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite (`prisma/schema.prisma`, dev DB at `prisma/dev.db`)
- Auth: iron-session cookie sessions (`lib/session.ts`), bcryptjs password hashing
- Media: storage abstraction in `lib/storage.ts` — `local` disk driver (default) or `s3` (MinIO/S3)

## Conventions
- Route groups: `app/(public)` = login/invite pages; `app/(app)` = authenticated pages guarded by `requireUser()` in the group layout
- Mutations live in `app/actions/*.ts` as server actions, EXCEPT post creation which is a route handler (`app/api/posts/route.ts`) to allow large video uploads
- Media is served only via the authenticated route `app/api/media/[key]/route.ts` — never put uploads in `public/`
- Validation rules (file types/sizes, caption lengths) live in `lib/validation.ts` and are shared by client + server
- Shared Tailwind class strings are in `lib/ui.ts`; post query include shape in `lib/types.ts`

## Commands
- `npm run dev` — dev server (task: `dev: next.js`)
- `npm run build` — production build
- `npm run db:migrate` / `npm run db:seed` — database migration / seed (creates admin + prints an invite link)

## Status
- [x] Project scaffolded, database migrated & seeded, production build verified
- Admin login: username `admin` (password set via `ADMIN_PASSWORD` in `.env`, default `change-me-admin`)
- [x] Dev server task created and running at http://localhost:3000
