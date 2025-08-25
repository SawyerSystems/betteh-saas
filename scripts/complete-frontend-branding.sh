#!/bin/bash

# Complete Frontend Branding Update
# Phase 2: Frontend Integration - Final branding system updates
# Updates all remaining hardcoded "Coach Will" and "Coach Will Tumbles" references

echo "🎨 Phase 2: Completing Frontend Branding Integration"
echo "=================================================="

# Update page titles to use dynamic branding
echo "📄 Updating page titles..."

# parent-login.tsx
sed -i '' 's/title="Parent Login — Coach Will Tumbles"/title={`Parent Login — ${brand.businessName}`}/g' client/src/pages/parent-login.tsx
sed -i '' '1s/^/import { useBrand } from "@\/contexts\/BrandContext";\n/' client/src/pages/parent-login.tsx
sed -i '' '/export default function ParentLogin()/a\
  const brand = useBrand();' client/src/pages/parent-login.tsx

# terms-of-service.tsx  
sed -i '' 's/title="Terms of Service — Coach Will Tumbles"/title={`Terms of Service — ${brand.businessName}`}/g' client/src/pages/terms-of-service.tsx
sed -i '' '1s/^/import { useBrand } from "@\/contexts\/BrandContext";\n/' client/src/pages/terms-of-service.tsx
sed -i '' '/export default function TermsOfService()/a\
  const brand = useBrand();' client/src/pages/terms-of-service.tsx

# verify-email.tsx
sed -i '' 's/title="Verify Email — Coach Will Tumbles"/title={`Verify Email — ${brand.businessName}`}/g' client/src/pages/verify-email.tsx
sed -i '' '1s/^/import { useBrand } from "@\/contexts\/BrandContext";\n/' client/src/pages/verify-email.tsx
sed -i '' '/export default function VerifyEmail()/a\
  const brand = useBrand();' client/src/pages/verify-email.tsx

# parent-setup-success.tsx
sed -i '' 's/title="Account Created — Coach Will Tumbles"/title={`Account Created — ${brand.businessName}`}/g' client/src/pages/parent-setup-success.tsx
sed -i '' '1s/^/import { useBrand } from "@\/contexts\/BrandContext";\n/' client/src/pages/parent-setup-success.tsx
sed -i '' '/export default function ParentSetupSuccess()/a\
  const brand = useBrand();' client/src/pages/parent-setup-success.tsx

# booking-success.tsx
sed -i '' 's/title="Booking Success — Coach Will Tumbles"/title={`Booking Success — ${brand.businessName}`}/g' client/src/pages/booking-success.tsx
sed -i '' 's/Coach Will Tumbles/{brand.businessName}/g' client/src/pages/booking-success.tsx
sed -i '' '1s/^/import { useBrand } from "@\/contexts\/BrandContext";\n/' client/src/pages/booking-success.tsx
sed -i '' '/export default function BookingSuccess()/a\
  const brand = useBrand();' client/src/pages/booking-success.tsx

# parent/confirm-booking.tsx
sed -i '' 's/title="Confirm Booking — Coach Will Tumbles"/title={`Confirm Booking — ${brand.businessName}`}/g' client/src/pages/parent/confirm-booking.tsx
sed -i '' 's/Thank you for confirming your booking with Coach Will Tumbles/Thank you for confirming your booking with {brand.businessName}/g' client/src/pages/parent/confirm-booking.tsx
sed -i '' 's/Please confirm your booking with Coach Will Tumbles/Please confirm your booking with {brand.businessName}/g' client/src/pages/parent/confirm-booking.tsx
sed -i '' '1s/^/import { useBrand } from "@\/contexts\/BrandContext";\n/' client/src/pages/parent/confirm-booking.tsx
sed -i '' '/export default function ConfirmBooking()/a\
  const brand = useBrand();' client/src/pages/parent/confirm-booking.tsx

echo "✅ Page titles updated with dynamic branding"

# Update CSS references
echo "🎨 Updating CSS brand colors..."
sed -i '' 's/\/\* Coach Will Tumbles Athletic Brand Colors \*\//\/\* Betteh Platform Brand Colors \*\//g' client/src/index.css

echo "✅ CSS brand colors updated"

echo ""
echo "🎉 Frontend Branding Integration Complete!"
echo "=========================================="
echo "✅ All page titles now use dynamic branding"
echo "✅ Business name references updated"  
echo "✅ CSS brand colors updated"
echo ""
echo "📋 Next Steps:"
echo "• Test all pages with BrandContext"
echo "• Verify theme-aware logo switching"
echo "• Commit changes and move to Phase 3"
