# Implementation Plan: Photo GPS Extraction, Post Location Display, and Interactive Maps

**Branch**: `004-photo-gps-maps` | **Date**: 2026-09-12 | **Spec**: [specs/004-photo-gps-maps/spec.md](spec.md)

**Input**: Feature specification from [specs/004-photo-gps-maps/spec.md](spec.md)

## Summary

Extract GPS latitude and longitude from photo EXIF metadata during upload, resolve friendly human-readable location names, render the location prominently beneath the author username with the post timestamp, provide a single-post map button/modal, and deliver an interactive All-Photos Map with a configurable post limit.

## Technical Context

**Language/Version**: TypeScript 5.7, Node.js 20+, Next.js 15 (App Router, React 19)

**Primary Dependencies**: `exifreader` (EXIF GPS parsing), Leaflet & React-Leaflet (Interactive Maps), Tailwind CSS, Prisma 6, Zod 3.24

**Storage**: SQLite (`prisma/schema.prisma` with local disk or S3 media storage)

**Testing**: Node test runner (`node --import tsx --test tests/*.test.ts`)

**Target Platform**: Responsive Web / Progressive Web App (Desktop & Mobile)

**Project Type**: Full-stack Web Application (Next.js App Router)

**Performance Goals**: <50ms EXIF parsing per image, <2s map render for 100 geotagged pins

**Constraints**: Private-by-default (all map views & coordinates restricted to authenticated family members), zero-binary EXIF dependencies for cross-platform portability

**Scale/Scope**: Family sharing feed, up to several hundred geotagged photos on aggregated map

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I: Private-by-Default Family Sharing**: PASS. All map endpoints, coordinates, and location queries are protected behind `getSession()` / `requireUser()` and filtered to authorized feed memberships.
- **Principle II: Validated Media and Input Boundaries**: PASS. Coordinate ranges (-90 to +90, -180 to +180) and location name strings are strictly validated; invalid or stripped EXIF is handled gracefully without breaking uploads.
- **Principle III: Explicit Authentication**: PASS. Explicit session authorization is checked on all API endpoints and server actions.
- **Principle IV: Tested User-Critical Behavior**: PASS. Automated tests for EXIF extraction, reverse geocoding fallback, post creation with/without GPS, and map API query scoping.
- **Principle V: Simple Evolution**: PASS. Leverages existing route handlers, server actions, and component architecture without over-engineering.
- **Principle VI: Responsive PWA and Layout Integrity**: PASS. Post headers, single-post map dialog, and `/map` page designed with mobile-touch friendly controls, avoiding clipping and respecting safe areas.

## Project Structure

### Documentation (this feature)

```text
specs/004-photo-gps-maps/
├── plan.md              # This file
├── research.md          # Research decisions (exifreader, reverse geocoding, Leaflet)
├── data-model.md        # Post schema extensions and data flow
├── quickstart.md        # Validation scenarios and testing steps
├── contracts/
│   └── maps-api.md      # API & Component interface contracts
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
app/
├── (app)/
│   ├── map/
│   │   └── page.tsx             # All-Photos Map view page
│   └── post/
│       └── [id]/page.tsx        # Single post detail view
├── api/
│   ├── posts/
│   │   ├── route.ts             # Post creation (with EXIF extraction)
│   │   └── map/
│   │       └── route.ts         # GET /api/posts/map (Geotagged posts query)
components/
├── MapView.tsx                  # Interactive Leaflet map component (dynamic import)
├── PostCard.tsx                 # Post card showing location under username + map button
├── Navbar.tsx                   # Map link in desktop navigation
└── MobileTabBar.tsx             # Map navigation link in mobile tab bar
lib/
├── exif.ts                      # EXIF GPS parsing utility
├── geocoding.ts                 # Reverse geocoding helper with fallback
├── types.ts                     # TypeScript post & location types
└── validation.ts                # Coordinate and query limit validators
prisma/
└── schema.prisma                # Post model with latitude, longitude, locationName
tests/
├── exif-extraction.test.ts      # Unit tests for EXIF coordinate parser
└── map-api.test.ts              # API and authorization tests for geotagged posts
```

**Structure Decision**: Standard Next.js App Router layout aligned with existing Famstagram conventions.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| *None* | N/A | N/A |
