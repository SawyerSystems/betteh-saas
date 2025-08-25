#!/bin/bash
# Test script to verify the unified events/availability system

echo "🧪 Testing Unified Events & Availability Blocking System..."
echo "=============================================="

# Test cookie from development session
COOKIE="cwt.sid.dev=s%3AFnXIGb2S9tgwIF13oGSjH-loP1Y10NKl.%2BsMUyA%2FufD36cc1rWM5C1qCyjmyFhDNh6qKw3ol71bM"

echo ""
echo "📊 Test 1: Check current availability exceptions (old system)"
EXCEPTIONS_COUNT=$(curl -s "http://localhost:5001/api/availability-exceptions" -H "Cookie: $COOKIE" | jq '. | length')
echo "Available exceptions: $EXCEPTIONS_COUNT"

echo ""
echo "📊 Test 2: Check total events"
TOTAL_EVENTS=$(curl -s "http://localhost:5001/api/events" -H "Cookie: $COOKIE" | jq '. | length')
echo "Total events: $TOTAL_EVENTS"

echo ""
echo "📊 Test 3: Check blocking events (should match exceptions after migration)"
BLOCKING_EVENTS=$(curl -s "http://localhost:5001/api/events" -H "Cookie: $COOKIE" | jq '[.[] | select(.isAvailabilityBlock == true)] | length')
echo "Blocking events: $BLOCKING_EVENTS"

echo ""
echo "📊 Test 4: Create new blocking event"
NEW_EVENT=$(curl -s -X POST "http://localhost:5001/api/events" \
  -H "Content-Type: application/json" \
  -H "Cookie: $COOKIE" \
  -d '{
    "title": "Test Migration Block",
    "startAt": "2025-08-25T10:00:00-07:00",
    "endAt": "2025-08-25T12:00:00-07:00",
    "isAllDay": false,
    "timezone": "America/Los_Angeles",
    "isAvailabilityBlock": true,
    "blockingReason": "Testing unified system",
    "isAvailable": false
  }')

EVENT_ID=$(echo "$NEW_EVENT" | jq -r '.id')
if [ "$EVENT_ID" != "null" ] && [ "$EVENT_ID" != "" ]; then
    echo "✅ Created blocking event: $EVENT_ID"
    
    echo ""
    echo "📊 Test 5: Verify new event appears in availability exceptions"
    UPDATED_EXCEPTIONS=$(curl -s "http://localhost:5001/api/availability-exceptions" -H "Cookie: $COOKIE" | jq '[.[] | select(.reason == "Testing unified system")] | length')
    
    if [ "$UPDATED_EXCEPTIONS" -gt 0 ]; then
        echo "✅ New blocking event correctly appears in availability exceptions"
    else
        echo "❌ New blocking event NOT found in availability exceptions"
    fi
    
    echo ""
    echo "📊 Test 6: Clean up test event"
    DELETE_RESULT=$(curl -s -X DELETE "http://localhost:5001/api/events/$EVENT_ID" -H "Cookie: $COOKIE")
    echo "✅ Cleanup completed"
else
    echo "❌ Failed to create blocking event"
    echo "Response: $NEW_EVENT"
fi

echo ""
echo "🎉 Migration Test Summary:"
echo "========================="
echo "Original exceptions: $EXCEPTIONS_COUNT"
echo "Total events: $TOTAL_EVENTS"  
echo "Blocking events: $BLOCKING_EVENTS"
echo ""
if [ "$BLOCKING_EVENTS" -eq "$EXCEPTIONS_COUNT" ]; then
    echo "✅ Migration Status: SUCCESS - All exceptions migrated to blocking events"
else
    echo "⚠️  Migration Status: PENDING - Run SQL migration scripts first"
fi
