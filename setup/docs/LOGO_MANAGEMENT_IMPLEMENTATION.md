# Dynamic Site Logo Management Implementation

## Overview
This document details the implementation of dynamic site logo management for Coach Will Tumbles. This feature allows admins to upload and manage both circle and text logos through the admin interface, which are then used across the site and in emails.

## Implementation Details

### 1. Database Schema Updates
Added a `logo` JSONB column to the `site_content` table with a default structure of `{"circle": "", "text": ""}`.

```sql
-- site-content-logo-schema.sql
ALTER TABLE site_content 
ADD COLUMN IF NOT EXISTS logo JSONB DEFAULT '{"circle": "", "text": ""}';

-- Update any existing rows to have the default value if they don't already have it
UPDATE site_content 
SET logo = '{"circle": "", "text": ""}' 
WHERE logo IS NULL;
```

### 2. Shared Schema Updates
Updated the `siteContent` table definition in `shared/schema.ts` to include the logo field:

```typescript
export const siteContent = pgTable("site_content", {
  // Existing fields...
  logo: json("logo").default({ circle: "", text: "" }),
  // Rest of the fields...
});
```

### 3. Server-Side Changes
Updated the site content storage methods to handle the new logo field:

#### In `server/storage.ts`:
- Modified `getSiteContent()` to include the logo in returned data
- Modified `updateSiteContent(content)` to update the logo when provided

```typescript
// In getSiteContent()
return {
  // Existing fields...
  logo: siteContentData?.logo || { circle: "", text: "" },
  // Rest of the fields...
};

// In updateSiteContent()
if (content.logo !== undefined) updateData.logo = content.logo;
```

### 4. Admin UI Updates
Enhanced the admin interface to support logo management:

#### In `client/src/components/admin-site-content-manager.tsx`:
- Updated `SiteContent` interface to include the logo field:
  ```typescript
  interface SiteContent {
    // Existing fields...
    logo: {
      circle: string;
      text: string;
    },
    // Rest of the fields...
  }
  ```
- Added default empty values for logo in the initial state
- Added a new "Site Logo" card in the Media tab with upload controls for both circle and text logos
- Updated `handleSaveMediaSection()` to include the logo when saving media content

### 5. Front-End Consumption
Updated the navigation component to use the dynamic logo:

#### In `client/src/components/navigation.tsx`:
- Added `useQuery` to fetch site content for logo URLs
- Used fallback to default logos when dynamic ones aren't available:
  ```typescript
  const logoSpin = siteContent?.logo?.circle || defaultLogoSpin;
  const logoText = siteContent?.logo?.text || defaultLogoText;
  ```

### 6. Email Template Updates
Modified email templates to accept dynamic logo URLs:

#### In `emails/PasswordSetupEmail.tsx` (and other templates):
- Added an optional `logoUrl` prop with a default value
- Updated the `<Img>` element to use the dynamic URL

## Usage Instructions
1. **Admin Upload**: Administrators can upload circle and text logos via the Site Content > Media tab
2. **Logo Management**: Both logo types can be updated independently and will be immediately reflected on the site after saving
3. **Default Fallback**: If no custom logos are uploaded, the system will use the default logo files

## Verification Steps
1. Upload logos through the admin interface and save
2. Verify the logos appear correctly in the navigation bar
3. Check that emails use the updated logo URLs
4. Confirm that site content API responses include the logo object
