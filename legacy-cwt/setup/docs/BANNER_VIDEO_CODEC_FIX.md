# Banner Video Codec Fix

## Issue

The banner video on the home page plays audio but no video content is visible. This is likely due to codec compatibility issues with web browsers.

## Cause

Web browsers have limited support for video codecs. The most compatible video codecs for web use are:
- **Video codec:** H.264 (AVC)
- **Audio codec:** AAC

If videos are encoded with less common codecs, browsers may only be able to play the audio track while failing to render the video track.

## Solution

1. We've added the `crossOrigin="anonymous"` attribute to the video elements to improve compatibility
2. Videos should be re-encoded with web-compatible codecs

## How to Re-encode the Banner Video

### Option 1: Using FFmpeg (Command Line)

FFmpeg is a powerful tool for video conversion. If you have FFmpeg installed, use:

```bash
ffmpeg -i input_video.mp4 -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k output_video.mp4
```

Where:
- `input_video.mp4` is your source video
- `output_video.mp4` is the web-optimized result
- `-c:v libx264` specifies H.264 video codec
- `-crf 23` sets quality (lower = better quality, higher = smaller file)
- `-c:a aac` specifies AAC audio codec
- `-b:a 128k` sets audio bitrate

### Option 2: Using Online Services

You can use online services like:
- [Cloudconvert](https://cloudconvert.com/video-converter)
- [Online-convert](https://www.online-convert.com/)

Select MP4 as the output format and ensure H.264/AAC as the codec combination.

### Option 3: Using Video Editing Software

Most video editing software (Adobe Premiere, DaVinci Resolve, etc.) can export videos in web-compatible formats:
- Choose MP4 container format
- Select H.264 video codec
- Select AAC audio codec

## Uploading the Re-encoded Video

1. Log in to the admin portal
2. Navigate to Site Content Management
3. In the Banner Video section, click "Upload"
4. Select your re-encoded video
5. Save changes
6. Verify the video plays correctly in both the admin preview and on the home page

## Testing

After uploading the re-encoded video:

1. Preview the video in the admin interface
2. Visit the home page and ensure both video and audio play
3. Test in multiple browsers (Chrome, Firefox, Safari, Edge)
4. Test on mobile devices if possible

## Technical Background

Adding the `crossOrigin="anonymous"` attribute helps with CORS (Cross-Origin Resource Sharing) issues that might occur when loading media from a different domain or subdomain.

The most significant improvement will come from ensuring the video is encoded with H.264/AAC, which has near-universal browser support.
