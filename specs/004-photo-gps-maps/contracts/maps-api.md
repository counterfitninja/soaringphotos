# API & Interface Contracts: Photo GPS Extraction & Maps

## 1. Post Creation Pipeline (`POST /api/posts`)

### Request
Multipart form-data containing:
- `caption`: string (optional)
- `media`: File[] (images/videos)
- `feedId`: string (optional destination feed ID)

### Processing
1. For each image file uploaded, inspect the binary buffer for EXIF GPS tags (`GPSLatitude`, `GPSLongitude`, `GPSLatitudeRef`, `GPSLongitudeRef`).
2. Calculate decimal coordinates:
   $$\text{Decimal} = (\text{degrees} + \text{minutes}/60 + \text{seconds}/3600) \times (\text{Ref} \in \{'S', 'W'\} ? -1 : 1)$$
3. If GPS is present, call reverse geocoding utility to obtain a short human-readable location string (e.g. "Seattle, WA, USA").
4. Store `latitude`, `longitude`, `locationName` in `Post` database record.

### Response
```json
{
  "id": "post_cuid12345"
}
```

---

## 2. Geotagged Posts Endpoint (`GET /api/posts/map`)

Provides the list of recent geotagged posts for the aggregate All-Photos Map.

### Request
`GET /api/posts/map?feedId=FEED_ID&limit=50`

- `feedId` (optional): Feed ID to query. If omitted, uses user's active feed or all accessible feeds.
- `limit` (optional): Integer (1-500, default 50).

### Response (Authenticated 200 OK)
```json
{
  "posts": [
    {
      "id": "post_1",
      "author": {
        "id": "usr_1",
        "username": "alice",
        "avatarKey": "avatars/alice.jpg"
      },
      "caption": "Hiking in the mountains!",
      "createdAt": "2026-09-12T14:30:00.000Z",
      "latitude": 47.6062,
      "longitude": -122.3321,
      "locationName": "Seattle, Washington",
      "media": [
        {
          "key": "posts/photo1.jpg",
          "mimeType": "image/jpeg"
        }
      ],
      "feed": {
        "id": "feed_main",
        "name": "Family Feed"
      }
    }
  ],
  "total": 1,
  "limit": 50
}
```

---

## 3. UI Component Contracts

### `PostCard` & Post Detail Header
- When `post.latitude` and `post.longitude` are present:
  - Header displays:
    ```tsx
    <div>
      <Link href={`/profile/${post.author.username}`}>{post.author.username}</Link>
      {post.locationName && (
        <p className="text-xs text-neutral-600 font-medium">📍 {post.locationName}</p>
      )}
      <p className="text-xs text-neutral-400">{formatDateTime(post.createdAt)} • {timeAgo(post.createdAt)}</p>
    </div>
    ```
  - Displays interactive Map Button icon (📍 or 🗺️) that opens single-post map modal or navigates to focused view.

### `MapView` Component (Client Component)
- Props:
  - `posts`: Array of posts with `id`, `latitude`, `longitude`, `locationName`, `thumbnail`, `author`, `createdAt`.
  - `initialCenter`: `[lat, lng]`
  - `initialZoom`: number
  - `singlePostMode`: boolean
  - `onLimitChange`: `(newLimit: number) => void` (for aggregate view)
