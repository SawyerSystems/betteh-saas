# Media Upload Requirements

## Banner Video Upload System

This document outlines the requirements and limitations for the banner video upload functionality in the admin dashboard.

### Supabase Storage Requirements

#### Required Bucket
- **Bucket Name:** `site-media`
- **Status:** Must exist in Supabase Storage before uploads will work
- **Permissions:** Service role must have upload/read permissions

#### File Size Limitations
- **Maximum Size:** 100 MB per file
- **Enforcement:** Both client-side validation and server-side limits
- **Error Handling:** Provides specific error message with actual file size

#### Supported MIME Types
The following video formats are supported:
- **MP4:** `video/mp4` (recommended)
- **WebM:** `video/webm`
- **MOV:** `video/quicktime`

### Error Handling

#### Server-Side Logging
The `/api/admin/media` endpoint now logs:
- Upload attempt details (bucket, fileName, mimeType, size)
- Supabase error messages and status codes
- Success confirmations with file details

#### Client-Side Error Display
Enhanced error handling provides:
- Detailed error messages from server responses
- User-friendly error descriptions for common issues
- Console logging for debugging purposes
- Specific messaging for:
  - File size limits exceeded
  - Unsupported file types
  - Storage bucket configuration issues
  - Network connectivity problems

#### Common Error Scenarios

1. **Missing Bucket**
   - Server Error: "Storage bucket 'site-media' not found"
   - User Message: "Storage configuration error. Please contact support."

2. **File Too Large**
   - Server Error: "File too large (XXMb). Maximum size is 100MB."
   - User Message: "File too large (XXMb). Videos must be under 100MB."

3. **Unsupported Format**
   - Server Error: "File type 'video/avi' not allowed. Please use MP4, WebM, or MOV files."
   - User Message: "File type 'video/avi' not supported. Please use MP4, WebM, or MOV files."

4. **Network Issues**
   - Server Error: Connection timeout or network error
   - User Message: "Upload failed. Please check your connection and try again."

### Setup Instructions

1. **Ensure Supabase Bucket Exists:**
   ```sql
   -- Run in Supabase SQL editor if bucket doesn't exist
   insert into storage.buckets (id, name, public)
   values ('site-media', 'site-media', true);
   ```

2. **Verify Service Role Permissions:**
   - Service role key must have storage permissions
   - Check `SUPABASE_SERVICE_ROLE_KEY` environment variable

3. **Test Upload Functionality:**
   - Try uploading a small test video file
   - Verify error messages display correctly for oversized files
   - Test with unsupported formats to confirm validation

### Troubleshooting

If uploads fail:
1. Check server logs for detailed error information
2. Verify the `site-media` bucket exists in Supabase Storage
3. Confirm service role permissions are properly configured
4. Test with a small MP4 file to isolate the issue
5. Check browser developer console for client-side error details
