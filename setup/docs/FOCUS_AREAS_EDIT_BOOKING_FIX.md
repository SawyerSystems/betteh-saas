# Issue 2 Fix: Edit Booking Modal Focus Areas Implementation

## Problem
The Edit Booking modal in the parent dashboard was showing:
- No focus areas (booking.focusAreas was always empty)
- A static list of focus areas that didn't match the two-step selection in the booking wizard
- Inconsistent editing experience compared to the booking wizard

## Root Cause
1. **Missing Database Join**: The `/api/parent/bookings` endpoint wasn't joining `booking_focus_areas` table to fetch the selected focus areas.
2. **Static Focus Areas List**: The edit form used a hardcoded list instead of the dynamic two-step apparatus→focus area selection.
3. **No Focus Area Persistence**: The update endpoint didn't handle focus area updates properly.

## Solution Implementation

### 1. Backend Changes

#### A. Updated `/api/parent/bookings` endpoint (server/routes.ts)
```typescript
// Added booking_focus_areas join to the query
booking_focus_areas (
  focus_area_id,
  focus_areas!inner(id, name, apparatus_id, apparatus!inner(id, name))
)

// Transform focus areas from join result
const focusAreas = booking.booking_focus_areas?.map((bfa: any) => ({
  id: bfa.focus_areas.id,
  name: bfa.focus_areas.name,
  apparatusId: bfa.focus_areas.apparatus_id,
  apparatusName: bfa.focus_areas.apparatus?.name
})) || [];

// Include focus areas in response
focusAreas: focusAreas, // Use the focus areas from the join instead of the legacy array
```

#### B. Enhanced `/api/parent/bookings/:id/safety` endpoint
```typescript
// Handle focus areas if provided
const focusAreas = req.body.focusAreas;
let focusAreaIds: number[] = [];

if (focusAreas && Array.isArray(focusAreas)) {
  // Support multiple formats:
  // - Objects with id (new format)
  // - Strings (legacy format) 
  // - Numbers (direct IDs)
  
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
}
```

### 2. Frontend Changes

#### A. Created New Two-Step Focus Areas Component
**File**: `client/src/components/two-step-focus-areas-edit.tsx`

Features:
- **Step 1**: Select apparatus (Tumbling, Beam, Bars, Vault, Side Quests)
- **Step 2**: Select specific focus areas for the chosen apparatus
- **Dynamic Loading**: Fetches apparatus and focus areas from API
- **Lesson Type Limits**: Respects focus area limits (2 for 30-min, 4 for 60-min lessons)
- **Current Selection Display**: Shows selected focus areas with apparatus labels
- **Navigation**: Back/forward between apparatus and focus area selection

Key API Usage:
```typescript
// Fetch apparatus list
const { data: apparatus } = useQuery<Apparatus[]>({
  queryKey: ['/api/apparatus'],
});

// Fetch focus areas for selected apparatus
const { data: focusAreas } = useQuery<FocusArea[]>({
  queryKey: ['/api/focus-areas', selectedApparatus?.id],
  queryFn: async () => {
    const response = await fetch(`/api/focus-areas?apparatusId=${selectedApparatus.id}`);
    return response.json();
  },
});
```

#### B. Updated EditBookingForm Component
**File**: `client/src/pages/parent-dashboard.tsx`

Key Changes:
1. **Import New Component**:
   ```typescript
   import { TwoStepFocusAreas } from '@/components/two-step-focus-areas-edit';
   ```

2. **Enhanced State Management**:
   ```typescript
   // Handle both legacy (strings) and new (objects) formats
   const initializeFocusAreas = () => {
     if (!booking.focusAreas || booking.focusAreas.length === 0) return [];
     
     // If the first item is an object, it's the new format
     if (typeof booking.focusAreas[0] === 'object' && booking.focusAreas[0] !== null) {
       return booking.focusAreas as any[];
     }
     
     // Legacy format - convert strings to objects for consistency
     return (booking.focusAreas as string[]).map((name, index) => ({
       id: `legacy-${index}`,
       name,
       apparatus_id: 0,
       apparatusName: 'Legacy'
     }));
   };
   ```

3. **Lesson Configuration**:
   ```typescript
   // Determine lesson duration and focus area limits
   const getLessonConfig = () => {
     const lessonType = booking.lessonType?.toLowerCase() || '';
     if (lessonType.includes('deep-dive') || lessonType.includes('partner-progression') || lessonType.includes('1-hour')) {
       return { maxFocusAreas: 4, duration: '60 minutes' };
     }
     return { maxFocusAreas: 2, duration: '30 minutes' };
   };
   ```

4. **Replaced Static UI**:
   ```typescript
   // OLD: Static checkbox list
   <div className="grid grid-cols-1 gap-2 mt-2 max-h-[200px] overflow-y-auto">
     {getFocusAreaOptions().map((option) => (...))}
   </div>

   // NEW: Two-step dynamic selector
   <TwoStepFocusAreas
     selectedFocusAreas={selectedFocusAreas}
     onFocusAreasChange={setSelectedFocusAreas}
     maxFocusAreas={lessonConfig.maxFocusAreas}
     lessonDuration={lessonConfig.duration}
   />
   ```

### 3. Data Flow

#### Before Fix:
1. `/api/parent/bookings` → Returns bookings with empty `focusAreas: []`
2. Edit modal → Shows static hardcoded focus area list
3. Update → Focus areas not saved to database

#### After Fix:
1. `/api/parent/bookings` → Joins `booking_focus_areas` table, returns full focus area objects
2. Edit modal → Shows dynamic two-step selector matching booking wizard
3. Update → Saves focus areas to `booking_focus_areas` junction table

### 4. Backward Compatibility

The implementation maintains backward compatibility:
- **Legacy String Format**: Converts to objects for display
- **Database**: Supports both old `focus_areas` array and new `booking_focus_areas` table
- **API**: Handles multiple input formats (strings, objects, IDs)

### 5. Testing Completed

✅ **Type Safety**: No TypeScript errors after implementation
✅ **Development Server**: Successfully starts and runs
✅ **API Endpoints**: Both `/api/parent/bookings` and `/api/parent/bookings/:id/safety` updated
✅ **Frontend Integration**: New component properly integrated with existing form

### 6. Features Added

1. **Consistent UX**: Edit modal now uses same two-step selection as booking wizard
2. **Dynamic Loading**: Focus areas loaded from database instead of hardcoded
3. **Proper Persistence**: Focus areas saved to proper junction table
4. **Lesson Type Awareness**: Respects focus area limits based on lesson duration
5. **Visual Feedback**: Shows current selection with apparatus labels
6. **Navigation**: Easy switching between apparatus and focus area selection

### 7. Files Modified

- `server/routes.ts` - Updated booking endpoints for focus areas
- `client/src/components/two-step-focus-areas-edit.tsx` - New component (created)
- `client/src/pages/parent-dashboard.tsx` - Updated EditBookingForm component

### 8. Next Steps for Deployment

1. **Test with Real Data**: Verify focus areas display correctly for existing bookings
2. **Database Migration**: Ensure existing focus areas are properly migrated to new format
3. **User Testing**: Confirm the two-step selection matches user expectations
4. **Performance**: Monitor query performance with the new joins

The Edit Booking modal now provides a consistent, dynamic focus area selection experience that matches the booking wizard and properly persists changes to the database.
