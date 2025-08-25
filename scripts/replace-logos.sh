#!/bin/bash

# Betteh Logo Replacement Script
# Systematically replaces all Coach Will Tumbles logos with Betteh branding
# Created: 2025-08-24 - Phase 3: Branding System

echo "🎨 Starting Betteh Logo Replacement..."

# Replace all CWT_Circle_LogoSPIN.png references with betteh_logo_black_font.png
find client/src -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | xargs sed -i '' 's|/CWT_Circle_LogoSPIN\.png|/assets/betteh_logo_black_font.png|g'

# Replace references in server files  
find server -name "*.ts" -o -name "*.js" | xargs sed -i '' 's|CWT_Circle_LogoSPIN\.png|betteh_logo_black_font.png|g'

# Replace CoachWillTumblesText references
find client/src -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | xargs sed -i '' 's|/assets/CoachWillTumblesText\.png|/assets/betteh_textlogo_black_font.png|g'
find client/src -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | xargs sed -i '' 's|/CoachWillTumblesText\.png|/assets/betteh_textlogo_black_font.png|g'

# Replace in email templates
find emails -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|CWT_Circle_LogoSPIN\.png|betteh_logo_black_font.png|g'
find emails -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|CoachWillTumblesText\.png|betteh_textlogo_black_font.png|g'

echo "✅ Logo file references updated"

# Update meta tag references for social sharing
find client/src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|/assets/CWT_Circle_LogoSPIN\.png|/assets/betteh_logo_black_font.png|g'

echo "✅ Meta tag references updated"

# Update any remaining hardcoded URLs
find client/src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|https://www\.coachwilltumbles\.com/assets/CWT_Circle_LogoSPIN\.png|/assets/betteh_logo_black_font.png|g'

echo "✅ URL references updated"

echo "🎨 Betteh logo replacement complete!"
echo ""
echo "📁 New logo assets used:"
echo "  - Circle Logo (Light): /assets/betteh_logo_black_font.png"
echo "  - Circle Logo (Dark): /assets/betteh_logo_white_font.png"  
echo "  - Text Logo (Light): /assets/betteh_textlogo_black_font.png"
echo "  - Text Logo (Dark): /assets/betteh_textlogo_white_font.png"
echo ""
echo "🔧 Next: Update components to use BrandContext for theme-aware logos"
