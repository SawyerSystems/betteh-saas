# Betteh Platform Icons

✅ **UPDATED**: All icons have been updated to use the new Betteh branding!

## Current Icon Files:
- `favicon-16x16.png` (16x16 pixels) - Betteh logo
- `favicon-32x32.png` (32x32 pixels) - Betteh logo  
- `icon-192.png` (192x192 pixels) - Betteh logo
- `icon-512.png` (512x512 pixels) - Betteh logo
- `../favicon.ico` (32x32 ICO format) - Betteh logo

## Generated From:
All icons were generated from `../assets/betteh_logo_black_font.png` using macOS `sips` command.

## Usage:
These icons are automatically referenced in the HTML head and PWA manifest files for:
- Browser favicon display
- PWA app icons
- Bookmark icons
- Tab icons

## Regeneration (if needed):
```bash
# From project root:
sips -s format png -z 16 16 client/public/assets/betteh_logo_black_font.png --out client/public/icons/favicon-16x16.png
sips -s format png -z 32 32 client/public/assets/betteh_logo_black_font.png --out client/public/icons/favicon-32x32.png
sips -s format png -z 192 192 client/public/assets/betteh_logo_black_font.png --out client/public/icons/icon-192.png
sips -s format png -z 512 512 client/public/assets/betteh_logo_black_font.png --out client/public/icons/icon-512.png
sips -s format ico -z 32 32 client/public/assets/betteh_logo_black_font.png --out client/public/favicon.ico
```

**Last Updated**: August 24, 2025 - Betteh SaaS Platform Migration
