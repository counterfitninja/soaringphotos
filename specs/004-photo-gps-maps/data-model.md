# Data Model: Photo GPS Extraction, Post Location Display, and Interactive Maps

## Entities & Schema Updates

### Post (Prisma Model Updates)

Extends the existing `Post` model in `prisma/schema.prisma`:

| Field | Type | Attributes | Description |
|---|---|---|---|
| `latitude` | `Float?` | Optional | GPS latitude in decimal degrees (-90.0 to +90.0) |
| `longitude` | `Float?` | Optional | GPS longitude in decimal degrees (-180.0 to +180.0) |
| `locationName` | `String?` | Optional | Human-readable place/city/region name (max 200 chars) |

### Indexes
- `@@index([feedId, createdAt])` (Existing)
- Querying for geotagged posts uses `where: { feedId, latitude: { not: null }, longitude: { not: null } }` ordered by `createdAt: "desc"`.

---

## Validation & Business Rules

1. **Latitude Validation**:
   - Must be a number between `-90` and `90` inclusive.
2. **Longitude Validation**:
   - Must be a number between `-180` and `180` inclusive.
3. **Location Name**:
   - Optional string, trimmed, sanitized, maximum 200 characters.
4. **All Photos Map Limit**:
   - Must be an integer between `1` and `500` (default: `50`, common presets: `25`, `50`, `100`, `250`).
5. **Feed Scoping & Privacy**:
   - All location coordinates and map views are strictly filtered by the user's active feed memberships (or selected feed context).
   - Non-members cannot access posts or geotagged coordinates.

---

## State & Data Flow

```text
[User selects photo(s)]
         │
         ▼
[POST /api/posts (multipart/form-data)]
         │
         ▼
[Extract EXIF GPS & Tags (exifreader / Buffer)]
         │
    ┌────┴──────────────────────────┐
    ▼                               ▼
[GPS Found]                  [No GPS Found]
    │                               │
    ▼                               ▼
[Reverse Geocode (place name)]  [location = null]
    │                               │
    └──────────────┬────────────────┘
                   ▼
[Save Post with lat, lng, locationName]
                   │
                   ▼
┌──────────────────┴──────────────────┐
▼                                     ▼
[Feed / Post Header Display]          [Map Views]
- Username                            - Single Post Map Modal / View
- Location Name (under username)      - /map (All Photos Map with limit selector)
- Post Date & Time
```
