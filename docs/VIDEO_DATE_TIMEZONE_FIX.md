# Video Date Timezone Fix

## Problem
Video dates in the progress page were showing one day behind the date selected by users in certain timezones.

## Root Causes Found
The issue existed in multiple places in `/client/src/components/progress/ProgressView.tsx`:

### Issue 1: Duplicate UTC-based date grouping (Line ~767)
```typescript
// OLD PROBLEMATIC CODE:
return d ? new Date(d).toISOString().slice(0, 10) : 'Unknown Date';
```

### Issue 2: UTC-based date display formatting (Line ~823)
```typescript
// OLD PROBLEMATIC CODE:
const pretty = day === 'Unknown Date' ? 'Unknown Date' : new Date(day + 'T00:00:00').toLocaleDateString();
```

Both approaches converted dates to UTC before extracting the date portion, causing timezone shifts.

### Example of the Problem
- User in timezone GMT+8 selects August 16, 2025
- Video recorded at 2:00 AM local time (August 16, 2025 2:00 AM GMT+8)  
- When converted to UTC: August 15, 2025 6:00 PM UTC
- `toISOString().slice(0, 10)` returns "2025-08-15"
- Video appears grouped under August 15 instead of August 16

## Solutions Implemented

### 1. Eliminated Duplicate Logic
- Removed duplicate `toDay` function in Videos tab
- Now uses existing `getLocalDayKey()` utility from `/client/src/utils/videoGrouping.ts`
- Consolidated timezone-safe logic in one place

### 2. Fixed Date Display Formatting
- Replaced `new Date(day + 'T00:00:00').toLocaleDateString()` 
- Now uses existing `formatDateLabel()` utility function
- Uses local date constructor: `new Date(year, month - 1, day)`

### 3. Updated Imports
Added utility functions to ProgressView.tsx imports:
```typescript
import { 
  groupVideosByDay, 
  getVisibleGroups, 
  shouldShowSeeMore, 
  formatDateLabel, 
  getLocalDayKey, 
  type VideoGroup 
} from '@/utils/videoGrouping';
```

## Files Changed
- `/client/src/components/progress/ProgressView.tsx`:
  - **Lines 21**: Added `formatDateLabel` and `getLocalDayKey` imports
  - **Lines 767-784**: Replaced duplicate `toDay` function with `getLocalDayKey` utility
  - **Lines 777-780**: Updated sorting to handle 'Unknown' instead of 'Unknown Date'  
  - **Line 804**: Replaced inline date formatting with `formatDateLabel` utility

## Technical Details
- **Individual skill video stacks**: Already used correct `groupVideosByDay()` utility
- **Videos tab (admin-only)**: Now uses same timezone-safe utilities instead of duplicate logic
- **Date formatting**: Consistently uses `new Date(year, month - 1, day)` constructor
- **Grouping keys**: Uses local timezone components via `getFullYear()`, `getMonth()`, `getDate()`

## Affected Areas
Both video grouping systems in the progress page:
1. ✅ **Individual skill video stacks** (already working)
2. ✅ **Videos tab** (admin/coach only - now fixed)

## Testing
- ✅ TypeScript compilation passes
- ✅ Development server runs without errors  
- ✅ Consolidated logic reduces maintenance burden
- ✅ Both grouping systems use same timezone-safe approach

## Impact
This comprehensive fix ensures that all users, regardless of their timezone, will see videos grouped under the correct dates that match their local calendar across all parts of the progress page interface.
