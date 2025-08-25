# Banner Video Encoding Guide

## Issue Summary
The banner video on the Coach Will Gymnastics website has been displaying with audio but no visible video content. This is due to the video being encoded with codecs that are not fully compatible with web browsers.

## Solution
We've made the following improvements:
1. Added `crossOrigin="anonymous"` attribute to video elements to prevent CORS issues
2. Updated video elements to use proper source elements with explicit type attributes
3. Created this guide for correctly encoding videos for web use

## Video Encoding Instructions

### Required Format
For maximum browser compatibility, videos should be encoded with:
- **Container**: MP4
- **Video Codec**: H.264 (AVC)
- **Audio Codec**: AAC
- **Resolution**: 1920x1080 or lower (16:9 aspect ratio recommended)
- **Bitrate**: 2-5 Mbps (higher for better quality, lower for faster loading)

### Encoding Methods

#### Option 1: Using FFmpeg (Command Line)
FFmpeg is a powerful, free command-line tool for video conversion:

```bash
ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k output.mp4
```

Parameters explained:
- `-c:v libx264`: Use H.264 video codec
- `-crf 23`: Set quality level (lower number = higher quality, 18-28 is typical range)
- `-preset medium`: Balance between encoding speed and compression efficiency
- `-c:a aac`: Use AAC audio codec
- `-b:a 128k`: Set audio bitrate to 128kbps (good quality for speech/music)

#### Option 2: Using Online Services
Several free online services can convert videos to web-compatible formats:
- [Cloudconvert](https://cloudconvert.com/video-converter)
- [Online-convert](https://www.online-convert.com/)
- [Convertio](https://convertio.co/video-converter/)

When using these services:
1. Upload your source video
2. Select MP4 as the output format
3. If available, specify H.264 and AAC as the codecs
4. Download the converted file

#### Option 3: Using Video Editing Software
Most video editing software can export videos in web-compatible formats:

**Adobe Premiere Pro:**
- Export > Format: H.264
- Preset: YouTube 1080p HD or Match Source - High bitrate

**DaVinci Resolve:**
- Deliver tab > Format: MP4
- Codec: H.264
- Audio Codec: AAC

**iMovie:**
- File > Share > File
- Format: 1080p
- Resolution: High (or select Custom to specify settings)

## Uploading to the Website

1. Log in to the admin dashboard
2. Navigate to Site Content Management
3. Go to the Media tab
4. Under Banner Video, click "Upload Video"
5. Select your properly encoded MP4 file
6. After upload completes, click "Preview" to verify both video and audio work
7. Click "Save Changes"

## Testing

After uploading, verify that:

1. The video plays correctly with both audio AND video in the admin preview
2. The home page banner shows the video properly
3. Test in multiple browsers (Chrome, Firefox, Safari)
4. If possible, test on mobile devices
5. Ensure the video loads and plays without excessive buffering

## Troubleshooting

If the video still doesn't play correctly:

1. Check browser console for errors (F12 > Console)
2. Verify the video file size is reasonable (under 10MB recommended for banner videos)
3. Try re-encoding with a lower resolution or bitrate
4. Ensure your browser is up to date
5. Clear browser cache and reload

For additional assistance, please contact the development team.
