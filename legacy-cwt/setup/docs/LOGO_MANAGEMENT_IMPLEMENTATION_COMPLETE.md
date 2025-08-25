# Dynamic Site Logo Management Implementation - Complete

## Overview
This document details the complete implementation of dynamic site logo management for Coach Will Tumbles. This feature allows admins to upload and manage both circle and text logos through the admin interface, which are then used across the site and in emails.

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
- Updated `SiteContent` interface to include the logo field
- Added default empty values for logo in the initial state
- Added a new "Site Logo" card in the Media tab with upload controls for both circle and text logos
- Updated `handleSaveMediaSection()` to include the logo when saving media content

The logo uploader UI includes:
- Visual preview of both circle and text logos
- Text input for direct URL entry
- File upload controls with error handling
- Auto-save functionality after successful uploads

### 5. Front-End Consumption
Updated the navigation component to use the dynamic logo:

#### In `client/src/components/navigation.tsx`:
- Added `useQuery` to fetch site content for logo URLs
- Used fallback to default logos when dynamic ones aren't available:
  ```typescript
  const logoSpin = siteContent?.logo?.circle || defaultLogoSpin;
  const logoText = siteContent?.logo?.text || defaultLogoText;
  ```

### 6. Email System Updates
Created a comprehensive system for dynamic logos in email templates:

#### Created Reusable Component
- Added `/emails/components/EmailLogo.tsx` component for standardized logo usage across all email templates

#### Updated Email Templates
- Modified templates like `PasswordSetupEmail.tsx`, `EmailVerification.tsx`, and `SessionConfirmation.tsx` to accept and use the logoUrl prop
- Used the EmailLogo component for consistent styling

#### Email Sending Logic
- Updated `server/lib/email.ts` to support dynamic logo URLs:
  - Added `logoUrl` parameter to `SendEmailOptions` interface
  - Modified `sendEmail` function to fetch the site logo URL if not provided
  - Added logic to automatically add the logo URL to email component props if the component supports it

## Usage Instructions
1. **Admin Upload**: Administrators can upload circle and text logos via the Site Content > Media tab
2. **Logo Management**: Both logo types can be updated independently and will be immediately reflected on the site after saving
3. **Default Fallback**: If no custom logos are uploaded, the system will use the default logo files
4. **Email Integration**: All emails sent will automatically use the current logo from site content

## Verification Steps
1. Upload logos through the admin interface and save
2. Verify the logos appear correctly in the navigation bar
3. Check that emails use the updated logo URLs
4. Confirm that site content API responses include the logo object
