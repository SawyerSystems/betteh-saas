# Supabase Storage Setup for Site Media

## Required Storage Bucket

This application requires a Supabase Storage bucket named `site-media` for storing uploaded banner videos and hero images.

### Setup Instructions

1. **Login to Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Navigate to your project: https://nwdgtdzrcyfmislilucy.supabase.co

2. **Create Storage Bucket**
   - Go to Storage → Buckets
   - Click "New Bucket"
   - Bucket name: `site-media`
   - Public bucket: ✅ **Enable** (for public access to media files)
   - File size limit: 50 MB
   - Allowed MIME types: `video/*`, `image/*`

3. **Configure Bucket Policies (RLS)**
   ```sql
   -- Allow public read access to all files
   CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'site-media');
   
   -- Allow authenticated admin users to upload files
   CREATE POLICY "Admin Upload" ON storage.objects FOR INSERT WITH CHECK (
     bucket_id = 'site-media' 
     AND auth.role() = 'authenticated'
   );
   
   -- Allow authenticated admin users to delete files
   CREATE POLICY "Admin Delete" ON storage.objects FOR DELETE USING (
     bucket_id = 'site-media' 
     AND auth.role() = 'authenticated'
   );
   ```

### File Structure

Uploaded files will be stored with the following structure:
```
site-media/
├── 1641234567890-abc123.mp4    (banner videos)
├── 1641234567891-def456.jpg    (hero images)
└── 1641234567892-ghi789.png    (other media)
```

### API Endpoint Usage

- **Upload Endpoint**: `POST /api/admin/media`
- **Content-Type**: `multipart/form-data`
- **File Field**: `file`
- **Max Size**: 50MB
- **Allowed Types**: Videos (mp4, mov, avi, etc.) and Images (jpg, png, gif, etc.)

### Response Format

```json
{
  "success": true,
  "url": "https://nwdgtdzrcyfmislilucy.supabase.co/storage/v1/object/public/site-media/1641234567890-abc123.mp4",
  "fileName": "1641234567890-abc123.mp4",
  "originalName": "banner-video.mp4",
  "size": 12345678,
  "mimeType": "video/mp4"
}
```

### Environment Variables

Ensure these environment variables are configured in `.env`:
```
SUPABASE_URL=https://nwdgtdzrcyfmislilucy.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The service role key is required for server-side storage operations.
