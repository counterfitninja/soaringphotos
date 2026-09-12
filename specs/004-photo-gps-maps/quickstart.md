# Quickstart & Validation Guide: Photo GPS Extraction & Maps

## Prerequisites
- Node.js 20+ installed
- SQLite dev database running (`prisma/dev.db`)

## Validation Scenarios

### Scenario 1: Uploading a Geotagged Photo
1. Sign in as a family member or admin.
2. Navigate to `http://localhost:3000/create`.
3. Select a JPEG or WebP image containing EXIF GPS tags (e.g., photo taken on iPhone/Android with location permissions on).
4. Enter a test caption: `"Exploring the mountains"`.
5. Submit post.
6. **Expected Result**:
   - The post appears in the feed.
   - Beneath the username, the resolved place name (e.g. `📍 Seattle, WA`) is displayed along with the post timestamp.
   - A map button (🗺️) is visible on the post card.

### Scenario 2: Single-Post Map View
1. Click the map button (🗺️) on the geotagged post.
2. **Expected Result**:
   - An interactive map opens centered on the photo's GPS coordinates.
   - A marker shows the exact location with a preview popup showing author, time, and thumbnail.

### Scenario 3: All-Photos Map with Configurable Limit
1. Navigate to `/map` from the navigation bar or mobile tab bar.
2. **Expected Result**:
   - The map loads showing pins for the latest 50 geotagged posts.
   - Changing the limit selector (e.g. from 50 to 25 or 100) updates the query and re-renders pins for that quantity of recent photos.
   - Clicking any pin displays the photo preview with a direct link to the full post.

### Scenario 4: Uploading Non-Geotagged Photo
1. Upload an image without EXIF GPS metadata.
2. **Expected Result**:
   - Upload succeeds without errors.
   - Post header shows only the standard timestamp under the username.
   - No map button is shown for this post.

## Automated Tests
Run the test suite:
```bash
npm run test
```
