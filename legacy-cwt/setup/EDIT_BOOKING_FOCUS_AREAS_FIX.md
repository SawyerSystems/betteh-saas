# Issue 2 Fix: Edit Booking Modal Focus Areas

## Problem Summary
The Edit Booking modal in the parent dashboard had several issues:
1. **No focus areas displayed**: The `/api/parent/bookings` endpoint never joined `booking_focus_areas`, so `booking.focusAreas` was always empty
2. **Mismatched UI**: The modal used a static list of focus areas instead of the two-step apparatus→focus-area selector used in the booking wizard
3. **Inconsistent editing experience**: The editing interface didn't mirror the booking creation flow

## Solution Overview
Implemented a comprehensive fix that:
1. **Enhanced backend API** to properly join and return focus areas
2. **Created new component** for consistent two-step focus area selection
3. **Updated frontend display** to handle both legacy and new focus area formats
4. **Fixed focus area persistence** in the booking update endpoint

## Changes Made

### 1. Backend Changes

#### A. `/api/parent/bookings` Endpoint Enhancement (`server/routes.ts` lines ~360-385)
```typescript
// Added booking_focus_areas join to the query
booking_focus_areas (
  focus_area_id,
  focus_areas!inner(id, name, apparatus_id, apparatus!inner(id, name))
)
```

#### B. Focus Areas Data Transformation (`server/routes.ts` lines ~420-430)
```typescript
// Extract focus areas from booking_focus_areas array
const focusAreas = booking.booking_focus_areas?.map((bfa: any) => ({
  id: bfa.focus_areas.id,
  name: bfa.focus_areas.name,
  apparatusId: bfa.focus_areas.apparatus_id,
  apparatusName: bfa.focus_areas.apparatus?.name
})) || [];
```

#### C. Booking Update Endpoint Enhancement (`server/routes.ts` lines ~570-620)
Enhanced the `/api/parent/bookings/:id/safety` endpoint to handle focus areas:
- Added support for focus area objects, strings, and IDs
- Implemented focus area validation and conversion
- Added database operations to update `booking_focus_areas` table

```typescript
// Handle focus areas if provided
const focusAreas = req.body.focusAreas;
let focusAreaIds: number[] = [];

if (focusAreas && Array.isArray(focusAreas)) {
  // Handle different formats: objects with id, legacy strings, or direct IDs
  // ... conversion logic
}

// Update focus areas in database
if (focusAreaIds.length > 0) {
  // Delete existing focus areas
  await supabaseAdmin
    .from('booking_focus_areas')
    .delete()
    .eq('booking_id', bookingId);
  
  // Insert new focus areas
  for (const focusAreaId of focusAreaIds) {
    await supabaseAdmin
      .from('booking_focus_areas')
      .insert({
        booking_id: bookingId,
        focus_area_id: focusAreaId
      });
  }
}
```

### 2. Frontend Changes

#### A. New Two-Step Focus Areas Component (`client/src/components/two-step-focus-areas-edit.tsx`)
Created a dedicated component that mirrors the booking wizard's focus area selection:
- **Step 1**: Apparatus selection (Tumbling, Beam, Bars, Vault, Side Quests)
- **Step 2**: Focus area selection within chosen apparatus
- **Features**:
  - Proper lesson type limits (2 for 30min, 4 for 60min lessons)
  - Current selection display with badges
  - Automatic validation and warnings
  - Responsive design matching the booking wizard

#### B. Enhanced Edit Booking Form (`client/src/pages/parent-dashboard.tsx`)
```typescript
// Updated to use focus area objects instead of strings
const [selectedFocusAreas, setSelectedFocusAreas] = useState<any[]>(booking.focusAreas || []);

// Added lesson configuration logic
const getLessonConfig = () => {
  const lessonType = booking.lessonType?.toLowerCase() || '';
  if (lessonType.includes('deep-dive') || lessonType.includes('partner-progression') || lessonType.includes('1-hour')) {
    return { maxFocusAreas: 4, duration: '60 minutes' };
  }
  return { maxFocusAreas: 2, duration: '30 minutes' };
};

// Replaced static focus area list with two-step selector
<TwoStepFocusAreas
  selectedFocusAreas={selectedFocusAreas}
  onFocusAreasChange={setSelectedFocusAreas}
  maxFocusAreas={lessonConfig.maxFocusAreas}
  lessonDuration={lessonConfig.duration}
/>
```

#### C. Display Format Fix
Added a helper function to properly format focus areas for display:
```typescript
const formatFocusAreas = (focusAreas: any[]): string => {
  if (!focusAreas || focusAreas.length === 0) return 'No specific focus areas';
  
  return focusAreas.map(area => {
    if (typeof area === 'string') {
      return area; // Legacy string format
    } else if (area && typeof area === 'object' && area.name) {
      // New object format with apparatus info
      return area.apparatusName ? `${area.apparatusName}: ${area.name}` : area.name;
    }
    return 'Unknown'; // Fallback
  }).join(', ');
};
```

Updated all display locations to use this helper instead of `booking.focusAreas.join(', ')`.

## Database Schema Impact

### Existing Tables Used
- `booking_focus_areas` - Junction table linking bookings to focus areas
- `focus_areas` - Focus area definitions with apparatus relationships
- `apparatus` - Apparatus definitions

### Relationships
```sql
-- booking_focus_areas table
booking_id → bookings.id
focus_area_id → focus_areas.id

-- focus_areas table  
apparatus_id → apparatus.id
```

## Testing Verification

### Backend Testing
1. **API Response**: `/api/parent/bookings` now returns focus areas as objects with:
   ```json
   {
     "id": 1,
     "name": "Forward Roll",
     "apparatusId": 2,
     "apparatusName": "Tumbling"
   }
   ```

2. **Update Endpoint**: `/api/parent/bookings/:id/safety` accepts focus areas in multiple formats:
   - Objects: `[{id: 1, name: "Forward Roll", apparatusId: 2}]`
   - Strings: `["Tumbling: Forward Roll"]` (legacy support)
   - IDs: `[1, 2, 3]`

### Frontend Testing
1. **Edit Modal**: Opens with current focus areas properly displayed
2. **Two-Step Selection**: Apparatus → Focus Areas workflow matches booking wizard
3. **Validation**: Proper limits enforced (2 for 30min, 4 for 60min lessons)
4. **Display**: Focus areas show as "Apparatus: Skill" format instead of "[object Object]"

## Backward Compatibility

The implementation maintains backward compatibility:
- **Legacy string format**: Still supported in database and display
- **API responses**: Handle both old and new focus area formats
- **Database**: Uses existing schema without modifications
- **Migration**: No data migration required

## Key Benefits

1. **Consistent UX**: Edit modal now matches booking wizard exactly
2. **Proper Data**: Focus areas are now loaded and displayed correctly  
3. **Full Functionality**: Users can see and modify focus areas in bookings
4. **Type Safety**: Proper TypeScript interfaces for all focus area formats
5. **Performance**: Efficient database queries with proper joins

## Files Modified

### Backend
- `server/routes.ts` - Enhanced bookings API and update endpoint

### Frontend  
- `client/src/pages/parent-dashboard.tsx` - Updated edit form and display logic
- `client/src/components/two-step-focus-areas-edit.tsx` - New component (created)

### Documentation
- `EDIT_BOOKING_FOCUS_AREAS_FIX.md` - This summary document (created)

## Next Steps

1. **Test in production** - Verify focus areas work correctly with real data
2. **User feedback** - Ensure the two-step selection is intuitive
3. **Performance monitoring** - Check if additional joins impact query performance
4. **Data cleanup** - Consider migrating any remaining legacy string focus areas to proper IDs
