# Frontend Calendar Unification Analysis

## Current State
The admin BigCalendar currently displays only `availabilityExceptions` data, while `events` data is fetched but not displayed on the calendar. This creates a fragmented view where:

1. **BigCalendar shows**: Only availability exceptions (blocking/unavailable periods)
2. **Events data exists**: Informational events are fetched via `useEvents()` but not displayed
3. **Dual system**: Two separate data sources for what should be unified calendar entries

## Migration Strategy

### Phase 1: Unified Calendar Display
Update the BigCalendar to display both data sources during transition:

```tsx
// Current (only availabilityExceptions):
events={
  availabilityExceptions?.map(exception => ({
    id: exception.id,
    title: exception.title || exception.reason || 'Event',
    start: startDate,
    end: endDate,
    allDay: exception.allDay,
    resource: exception
  })) || []
}

// Updated (both sources):
events={[
  // Existing availability exceptions
  ...(availabilityExceptions?.map(exception => ({
    id: `exception-${exception.id}`,
    title: exception.title || exception.reason || 'Blocked Time',
    start: startDate,
    end: endDate,
    allDay: exception.allDay,
    resource: { ...exception, type: 'exception' }
  })) || []),
  
  // New events from unified system
  ...(events?.map(event => ({
    id: `event-${event.id}`,
    title: event.title || event.description || 'Event',
    start: new Date(event.startDate + (event.startTime ? `T${event.startTime}` : 'T00:00:00')),
    end: new Date(event.endDate + (event.endTime ? `T${event.endTime}` : 'T23:59:59')),
    allDay: event.allDay,
    resource: { ...event, type: 'event' }
  })) || [])
]}
```

### Phase 2: Color Coding Strategy
Distinguish between different event types:

```tsx
eventPropGetter={(event) => {
  const resource = event.resource;
  let backgroundColor = '#D8BD2A';
  let borderColor = '#D8BD2A';
  
  if (resource.type === 'exception') {
    // Availability exceptions (blocking time)
    backgroundColor = '#DC2626'; // red for blocked
    borderColor = '#B91C1C';
  } else if (resource.type === 'event') {
    // Check if it's a blocking event or informational
    if (resource.isAvailabilityBlock) {
      backgroundColor = '#DC2626'; // red for blocking events
      borderColor = '#B91C1C';
    } else {
      // Informational events by category
      switch (resource.category) {
        case 'Coaching: Team Meet/Competition':
          backgroundColor = '#8B5CF6'; // purple
          borderColor = '#7C3AED';
          break;
        // ... other categories
        default:
          backgroundColor = '#3B82F6'; // blue for info events
          borderColor = '#2563EB';
      }
    }
  }
  
  return { style: { backgroundColor, borderColor } };
}}
```

### Phase 3: Event Handling Unification
Update event selection handling to work with both types:

```tsx
onSelectEvent={(event) => {
  const resource = event.resource;
  if (resource.type === 'exception') {
    setViewingException(resource);
  } else if (resource.type === 'event') {
    setViewingEvent(resource);
  }
}}
```

## Recurrence Handling

The unified events system supports recurrence via RRULE, but the frontend needs to display expanded occurrences. Options:

### Option A: Backend Expansion (Recommended)
Modify the events API to accept date range and return expanded occurrences:
```
GET /api/events?startDate=2024-01-01&endDate=2024-01-31
```

### Option B: Frontend Expansion
Use a library like `rrule` to expand recurring events on the frontend.

## Migration Timeline

### Phase 1: Immediate (Safe)
- Update BigCalendar to display both data sources
- Add color coding to distinguish event types
- Test calendar display with dual sources

### Phase 2: After Database Migration
- Remove availabilityExceptions query once all data is migrated
- Update calendar to use only events data
- Test that blocking behavior still works

### Phase 3: Cleanup
- Remove availability-exceptions API endpoints
- Remove related frontend code and hooks
- Update all references to use unified events system

## Implementation Files to Update

1. **client/src/pages/admin.tsx**
   - Update BigCalendar events prop
   - Update eventPropGetter for color coding
   - Update onSelectEvent handling

2. **client/src/hooks/use-availability-exceptions.ts** (if exists)
   - Deprecate after migration

3. **client/src/components/modals/EventModal.tsx** (if exists)
   - Update to handle both event types during transition

## Testing Strategy

1. **Visual Testing**
   - Verify both availability exceptions and events display correctly
   - Confirm color coding distinguishes event types
   - Test event selection and modal display

2. **Functional Testing**
   - Verify booking availability checks still work
   - Test that blocking events actually block bookings
   - Confirm recurring events display correctly

3. **Data Integrity**
   - Ensure no duplicate events during transition
   - Verify all existing availability exceptions are visible
   - Test that new events appear correctly

## Risk Mitigation

1. **Graceful Degradation**
   - If events API fails, calendar still shows availability exceptions
   - If availability exceptions API fails, calendar still shows events

2. **Backward Compatibility**
   - Keep both API endpoints during transition
   - Maintain existing functionality while adding new features

3. **User Communication**
   - Add loading states during migration
   - Provide clear visual feedback about system changes
