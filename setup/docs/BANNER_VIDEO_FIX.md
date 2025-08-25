# Banner Video Fix

The banner video issue has been fixed by:

1. Simplifying the video element implementation
2. Using the existing `/banner-video.mov` file in the public folder as the primary source
3. Keeping the dynamic `siteContent.bannerVideo` as a fallback source

## Important Notes

- The existing MOV file in the public folder (`/banner-video.mov`) is being used as the primary video source
- When the upload functionality is fixed, newly uploaded videos should be encoded with H.264 (video) and AAC (audio) codecs
- Both QuickTime (.mov) and MP4 sources are provided for maximum browser compatibility

## Next Steps (When Upload Is Working)

1. Re-encode videos using H.264/AAC codecs
2. Use the following FFmpeg command for proper encoding:
   ```
   ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k output.mp4
   ```
3. Upload the properly encoded video via the admin interface
