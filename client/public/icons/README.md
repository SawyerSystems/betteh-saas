# Favicon Instructions

Due to the limitations in the current environment (missing ImageMagick/convert), you should manually create properly sized favicon images:

1. For ideal results, create the following sizes from the CWT_Circle_LogoSPIN.svg or .png file:
   - favicon-16x16.png (16x16 pixels)
   - favicon-32x32.png (32x32 pixels)
   - icon-192.png (192x192 pixels)
   - icon-512.png (512x512 pixels)

2. If possible, also create a favicon.ico file that includes multiple sizes (16x16, 32x32)

3. You can use online tools like:
   - https://realfavicongenerator.net/ 
   - https://favicon.io/favicon-converter/

4. Place all generated files in the `client/public/icons/` directory

The HTML and manifest files have already been updated to reference these files at their expected locations.
