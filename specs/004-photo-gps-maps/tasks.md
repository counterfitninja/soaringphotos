---
description: "Task list for Photo GPS Extraction, Post Location Display, and Interactive Maps"
---

# Tasks: Photo GPS Extraction, Post Location Display, and Interactive Maps

**Input**: Design documents from [specs/004-photo-gps-maps](specs/004-photo-gps-maps)  
**Prerequisites**: [specs/004-photo-gps-maps/plan.md](specs/004-photo-gps-maps/plan.md), [specs/004-photo-gps-maps/spec.md](specs/004-photo-gps-maps/spec.md), [specs/004-photo-gps-maps/research.md](specs/004-photo-gps-maps/research.md), [specs/004-photo-gps-maps/data-model.md](specs/004-photo-gps-maps/data-model.md), [specs/004-photo-gps-maps/contracts/maps-api.md](specs/004-photo-gps-maps/contracts/maps-api.md)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`)
- Exact file paths included for every task

---

## Phase 1: Setup (Shared Dependencies & Infrastructure)

**Purpose**: Install required libraries and setup core utilities for EXIF parsing and maps

- [x] T001 Install `exifreader` and `leaflet` dependencies with corresponding TypeScript types in package.json
- [x] T002 [P] Create validation schemas for coordinates and map query parameters in lib/validation.ts
- [x] T003 [P] Add Prisma migration for `latitude`, `longitude`, and `locationName` on `Post` in prisma/schema.prisma and run migration

---

## Phase 2: Foundational (Core Extraction & Data Contracts)

**Purpose**: Blocking prerequisites required before post creation and rendering flows

- [x] T004 Implement EXIF metadata GPS parser utility in lib/exif.ts to extract decimal latitude and longitude from image buffers
- [x] T005 Implement reverse geocoding utility in lib/geocoding.ts with timeout handling and coordinate string fallback
- [x] T006 Update post query payload shape and TypeScript interfaces in lib/types.ts to include location fields

---

## Phase 3: User Story 1 - Automatic GPS & Location Extraction on Upload (Priority: P1)

**Story Goal**: Read GPS tags from uploaded photos, resolve human-readable place names, and persist coordinates to new posts while preserving clean handling for photos without EXIF.

**Independent Test**: Upload an image with GPS coordinates and verify `latitude`, `longitude`, and `locationName` are saved to the database. Upload a non-geotagged image and verify the post is created with `null` location fields.

- [x] T007 [P] [US1] Create unit tests for EXIF coordinate extraction and validation in tests/exif-extraction.test.ts
- [x] T008 [US1] Integrate EXIF extraction and reverse geocoding into post creation route in app/api/posts/route.ts
- [x] T009 [US1] Add regression test verifying upload pipeline handles missing/corrupt EXIF without failing in tests/exif-extraction.test.ts

---

## Phase 4: User Story 2 - View Location Header & Single-Post Map (Priority: P1)

**Story Goal**: Display extracted location name under the author's username beside the creation timestamp on post cards, and provide an interactive map button to view the photo's location pin.

**Independent Test**: Open a geotagged post. Confirm location name appears below the author username with the timestamp, and clicking the map button displays a map focused on the photo coordinates.

- [x] T010 [P] [US2] Create responsive single-post map modal/sheet component in components/PostMapModal.tsx
- [x] T011 [US2] Update post header in components/PostCard.tsx to display location name under author username alongside post timestamp
- [x] T012 [US2] Add map button trigger on geotagged posts in components/PostCard.tsx to open PostMapModal
- [x] T013 [US2] Update single post detail view in app/(app)/post/[id]/page.tsx to render location header and map controls

---

## Phase 5: User Story 3 - View All-Photos Map with Configurable Post Limit (Priority: P2)

**Story Goal**: Provide an aggregate map view showing recent geotagged photos across the family feed, with an interactive limit selector to configure how many photos are displayed.

**Independent Test**: Navigate to `/map` and verify pins render for recent geotagged photos. Change the limit selector (e.g., 25, 50, 100) and verify the map updates accordingly with clickable photo preview popups.

- [x] T014 [P] [US3] Create API route handler for geotagged posts in app/api/posts/map/route.ts with feed membership validation and limit filtering
- [x] T015 [P] [US3] Create dynamic interactive multi-photo Leaflet map component in components/MapView.tsx with photo popups and marker clustering
- [x] T016 [US3] Create All-Photos Map page in app/(app)/map/page.tsx with limit selector (25, 50, 100, 250) and active feed scoping
- [x] T017 [P] [US3] Add Map navigation link to desktop navbar in components/Navbar.tsx
- [x] T018 [P] [US3] Add Map navigation icon to mobile navigation in components/MobileTabBar.tsx
- [x] T019 [US3] Create API and access control tests for the map endpoint in tests/map-api.test.ts

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate mobile/desktop responsiveness, error boundaries, safe area layout integrity, and production build.

- [x] T020 [P] Ensure Leaflet map CSS and tile assets load properly without layout shifts or SSR hydration warnings
- [x] T021 [P] Verify layout integrity on mobile and desktop viewports, avoiding text truncation or overlap in post headers
- [x] T022 Run complete test suite and production build (`npm run test && npm run build`)
