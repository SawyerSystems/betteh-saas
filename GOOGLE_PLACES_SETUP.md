# Google Places API Setup Instructions

## Development Environment

For development, we've implemented a fallback mode where the address autocomplete component will work without the Google API being loaded. When you type in the address field, you'll see:

1. **Loading indicators** while the system attempts to load Google Places API
2. **Fallback to manual input** if the API is not available
3. **Visual feedback** showing the current state

## Production Setup

To enable full Google Places autocomplete functionality in production:

1. **Get a Google Places API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the "Places API" service
   - Create an API key with Places API permissions
   - Restrict the API key to your domain for security

2. **Configure the API Key:**
   ```bash
   # In your .env file:
   VITE_GOOGLE_PLACES_API_KEY=your_actual_google_places_api_key
   ```

3. **API Key Restrictions (Recommended):**
   - HTTP referrers: `https://your-domain.com/*`
   - API restrictions: Enable only "Places API"

## Features Implemented

✅ **Modular Google Places Integration**
- `client/src/lib/google-places.ts` - Core Google Places utilities
- `client/src/hooks/use-address-autocomplete.ts` - React hook for address autocomplete
- `client/src/components/ui/address-autocomplete-input.tsx` - Reusable component

✅ **Address Autocomplete Features**
- Real-time address suggestions as user types
- Auto-population of city, state, ZIP code, and country
- Restriction to US/Canada addresses only
- Fallback to manual input when API unavailable
- Loading states and error handling

✅ **Edge Case Handling**
- Manual typing detection vs. autocomplete selection
- API loading failures and network issues
- Missing API key graceful degradation
- Component cleanup and memory management

✅ **Reusable Implementation**
- Easy to integrate into other forms
- Configurable autocomplete options
- TypeScript support with proper type definitions
- Consistent styling with existing UI components

## Testing in Development

1. Open the admin panel: http://localhost:6173/admin
2. Login with admin credentials (check .env file)
3. Go to Schedule tab
4. Click "Add Event" or "Block Time"
5. Select "Event" type to see address fields
6. Try typing in the "Address Line 1" field
7. You'll see loading indicators and helper text

## Integration Points

The address autocomplete is now integrated into:
- **Admin Schedule Modal** - For event location entry
- **Easily extensible** to other forms requiring addresses

The implementation is modular and ready for reuse across the application!
