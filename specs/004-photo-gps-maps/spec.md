# Feature Specification: Photo GPS Extraction, Post Location Display, and Interactive Maps

**Feature Branch**: `004-photo-gps-maps`

**Created**: 2026-09-12

**Status**: Draft

**Input**: User description: "i want to be able to see where a photo was taken if gps coordinates are part of the exif. This means have a map button on a single post to show on a map and also an all photos map to show the last configurable number. also extract the lactaion and put it at the top under the user name along with the time and date the post was made"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automatic GPS & Location Extraction on Upload (Priority: P1)

As an authorized family member uploading photos, I want the system to automatically read GPS coordinates from image EXIF metadata and determine the friendly place/location name so that I do not have to manually look up or type coordinates or location names.

**Why this priority**: GPS metadata extraction and place resolution form the baseline foundation for showing location details and rendering map points. Without extraction upon upload, downstream single-post and multi-photo map features cannot function.

**Independent Test**: Upload an image with embedded GPS coordinates. Verify that the location (e.g., place or city/region name) is extracted and associated with the post, while uploading an image without GPS metadata still succeeds cleanly with no location attached.

**Acceptance Scenarios**:

1. **Given** a user uploads a photo containing valid EXIF GPS coordinates, **When** the upload completes, **Then** the post stores the latitude, longitude, and friendly location name.
2. **Given** a user uploads a photo without EXIF GPS metadata (or a video/media file without GPS), **When** the upload completes, **Then** the post is created successfully with location fields set to empty/null.
3. **Given** an upload with multiple images, **When** the primary image or any image has GPS metadata, **Then** the post captures the GPS location from the first image with valid coordinates.

---

### User Story 2 - View Location Header & Single-Post Map (Priority: P1)

As an authorized family member viewing a post, I want to see the location name displayed at the top under the creator's username along with the post date and time, and click a map button to view where the photo was taken on an interactive map.

**Why this priority**: Directly delivers the primary user-facing experience: seeing the extracted location and timestamp together in the post header and accessing the post-specific map view.

**Independent Test**: Open a post created from a photo with GPS coordinates. Confirm the location name appears beneath the author's username beside/with the timestamp, and clicking the map button opens an interactive map centered on the photo's coordinates.

**Acceptance Scenarios**:

1. **Given** a post with recorded GPS coordinates and location name, **When** viewed on the feed or single post page, **Then** the location name is displayed clearly at the top directly under the username alongside the post's creation time and date.
2. **Given** a post has GPS coordinates, **When** the viewer clicks the map button on the post card or detail view, **Then** an interactive map opens displaying a pin/marker at the exact photo location.
3. **Given** a post without GPS coordinates, **When** viewed in the feed or detail view, **Then** only the timestamp is displayed under the username and no map button is presented.

---

### User Story 3 - View All-Photos Map with Configurable Post Limit (Priority: P2)

As an authorized family member, I want to view an aggregated map of all recent geotagged photos across the family feed, with the ability to configure how many recent photos are shown, so that I can explore where family photos have been taken over time.

**Why this priority**: Provides rich family discovery and geographic exploration across the collection of shared moments.

**Independent Test**: Navigate to the family map page and verify that all recent posts with GPS coordinates appear as interactive pins on the map. Adjust the configurable count setting (e.g. 25, 50, 100) and verify that the map updates to show that specific number of the latest geotagged photos.

**Acceptance Scenarios**:

1. **Given** multiple posts across the family feed have GPS coordinates, **When** an authorized user opens the All Photos Map view, **Then** markers appear for the most recent geotagged posts.
2. **Given** the user is viewing the All Photos Map, **When** the user clicks on a photo pin/marker, **Then** a preview thumbnail, author, timestamp, location name, and link to the full post are shown.
3. **Given** the user changes the map display count limit (or user/system preference), **When** the setting is updated, **Then** the map re-renders showing up to that configured number of recent geotagged posts.
4. **Given** there are no posts with GPS data, **When** the user opens the All Photos Map, **Then** a friendly empty state is displayed indicating no geotagged photos are available yet.

---

### Edge Cases

- **EXIF Stripping / Private Photos**: When images are uploaded without EXIF data (e.g., stripped by camera app or user privacy settings), the app handles the upload normally without failing or showing broken placeholders.
- **Reverse Geocoding Failure / Offline Place Resolution**: If reverse geocoding to a place name fails or times out during upload, the post still stores coordinates and displays formatted latitude/longitude or fallback generic location rather than aborting the upload.
- **Multiple Photos in One Post with Different Locations**: The post takes the first valid GPS coordinate found in the upload batch and displays that primary location.
- **Coordinate Precision & Privacy**: Map views and location displays must remain strictly within authenticated family access and never be exposed publicly.
- **Extreme Coordinates & Invalid EXIF**: Coordinates out of standard ranges (latitude outside -90 to +90, longitude outside -180 to +180) are treated as invalid and ignored.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST parse EXIF metadata upon image upload to extract GPS latitude and longitude if present.
- **FR-002**: System MUST resolve GPS coordinates into a human-readable location name (e.g., city, region/state, country, or landmark) to store with the post.
- **FR-003**: System MUST store coordinates (latitude, longitude) and resolved location name alongside post records.
- **FR-004**: Post card and detail views MUST display the location name at the top directly under the author's username, integrated alongside the post creation date and time.
- **FR-005**: Posts with GPS data MUST include a map action/button that opens a map view focused on the post's coordinates.
- **FR-006**: System MUST provide an "All Photos Map" page accessible to authorized users displaying recent geotagged posts across the family.
- **FR-007**: The All Photos Map MUST support a configurable limit on the number of recent geotagged posts displayed (with a sensible default such as 50, configurable by the user or admin).
- **FR-008**: Map pins on both single post and all-photos maps MUST be interactive, displaying post metadata (creator, date/time, location, and thumbnail link to the post).
- **FR-009**: All map endpoints, coordinates, and location data MUST be strictly protected by family session authentication in accordance with private-by-default principles.
- **FR-010**: Uploads of non-geotagged images, videos, or files with missing/corrupt EXIF data MUST continue to function seamlessly without error.

### Key Entities *(include if feature involves data)*

- **Post Location Metadata**:
  - `latitude`: Decimal degrees representation of photo location.
  - `longitude`: Decimal degrees representation of photo location.
  - `locationName`: Human-readable name of the location (e.g. "Yosemite National Park, CA" or "Seattle, WA").
  - `hasLocation`: Boolean indicator whether post contains valid geographical coordinates.
- **Map View Configuration**:
  - `recentPhotosLimit`: Number of recent geotagged photos to load and render on the aggregate map view (e.g. 10, 25, 50, 100).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of uploaded photos containing valid EXIF GPS data successfully have their coordinates and friendly location extracted without increasing upload failure rates.
- **SC-002**: Users can view the single-post map from any geotagged post in under 2 seconds.
- **SC-003**: The All Photos Map renders up to 100 photo markers smoothly with pan and zoom capabilities.
- **SC-004**: Posts without GPS metadata display standard timestamps cleanly without blank gaps or broken layout indicators.
- **SC-005**: 100% of location data, map views, and coordinate queries remain strictly inaccessible to unauthenticated users.

## Assumptions

- Family members desire to see where family memories were captured when photos have location data enabled on their devices.
- Photos uploaded from modern smartphones typically embed standard EXIF GPS tags unless privacy settings or stripping occurred prior to upload.
- A default of 50 recent geotagged photos for the aggregate map provides an optimal balance between visual density and performance, with user-selectable options (e.g., 25, 50, 100, 250).
- Reverse geocoding can resolve coordinates to a concise city/state/country or region string suitable for header display under the username.
- Single-post map can be displayed in a responsive modal, inline sheet, or dedicated view that fits mobile and desktop screens.
