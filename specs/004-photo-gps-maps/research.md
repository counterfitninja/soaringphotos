# Research & Design Decisions: Photo GPS Extraction, Post Location Display, and Interactive Maps

## Decision 1: EXIF GPS Parsing Library / Tooling
- **Decision**: Use `exifreader` (lightweight, zero native binary dependency, works reliably with Node.js buffer and web streams).
- **Rationale**: `exifreader` extracts GPS latitude, longitude, and altitude from JPEG, PNG, WebP, HEIC, and TIFF without needing external binary bindings or C++ compilation (unlike exiftool). It parses rational coordinates accurately into standard signed decimal degrees (WGS84).
- **Alternatives Considered**:
  - `sharp.metadata()`: Provides raw EXIF buffer, but does not parse EXIF GPS tags into decimal lat/lng natively without manual tag offsets or extra decoding logic.
  - `exif-parser`: Fast, but only supports JPEG/JFIF formats and lacks modern HEIC/WebP EXIF support.
  - `piexifjs`: Older, primarily for JPEG, slower maintenance.

## Decision 2: Reverse Geocoding for Place / Location Name
- **Decision**: Server-side reverse geocoding via OpenStreetMap Nominatim with strict rate limiting, user-agent compliance, and local fallback formatting (`formatCoordinates(lat, lng)`).
- **Rationale**: Reverse geocoding provides friendly names like "Yosemite National Park, CA" or "Seattle, Washington" for displaying in post headers. If Nominatim is unreachable, rate-limited, or disabled, the system gracefully falls back to formatted coordinates (e.g. `47.6062° N, 122.3321° W`) or a clean fallback without failing the image upload.
- **Alternatives Considered**:
  - Google Maps Geocoding API: Requires billable API keys and complex external cloud configuration.
  - Mapbox Geocoding: Requires paid tokens.
  - Pure client-side geocoding: Would leak coordinates directly across unauthorized client fetches and duplicate requests across all viewers.

## Decision 3: Map UI Rendering Component (Single Post & All Photos Map)
- **Decision**: Lightweight Leaflet + React Leaflet integration with OpenStreetMap tiles (or an interactive SVG/Leaflet client component with dynamic import to prevent SSR DOM errors in Next.js).
- **Rationale**: Leaflet is open-source, mobile-touch friendly, lightweight (~40KB), and renders cleanly on both iOS/Android PWA viewports and desktop browsers without API keys.
- **Alternatives Considered**:
  - Google Maps JavaScript SDK: Requires API key, heavier script payload.
  - Mapbox GL JS: Requires Mapbox access token and WebGL support.
  - Static map image generation: Lacks interactive pan/zoom and multi-photo pin clustering.

## Decision 4: Database Schema & Post Metadata Storage
- **Decision**: Store `latitude Float?`, `longitude Float?`, and `locationName String?` directly on the `Post` model in Prisma (with an index on `[feedId, hasLocation, createdAt]` or querying where `latitude != null`).
- **Rationale**: Posts represent the shared story item in Famstagram. Putting location fields on `Post` allows fast retrieval when listing posts, filtering geotagged posts for the all-photos map, and displaying them in headers without multi-table join overhead.
- **Alternatives Considered**:
  - Separate `Location` table: Unnecessary complexity for 1:1 post location relationships.
  - Storing coordinates on `Media` records only: A post can have multiple media items, but the post itself needs a single primary display location for its header and map pin.

## Decision 5: Configurable Photo Limit for All-Photos Map
- **Decision**: Client and server supported query parameter `?limit=N` with predefined selectable options (25, 50, 100, 250) and a default of 50. Persist user preference in local storage or cookie so the user's preferred limit is remembered.
- **Rationale**: Balances fast loading and map marker performance while giving users full control over how far back in their photo history to explore.
