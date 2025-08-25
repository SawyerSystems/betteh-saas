#!/usr/bin/env python3
"""
Test script to verify the Update Event button fix works correctly
"""
import requests
import json

# Test the fixed PUT endpoint
def test_update_event():
    print("🧪 Testing Update Event fix...")
    
    # Login to get session cookie
    login_response = requests.post('http://localhost:6001/api/auth/login', 
                                   json={
                                       'email': 'admin@coachwilltumbles.com',
                                       'password': 'TumbleCoach2025!'
                                   })
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        return
    
    print("✅ Login successful")
    
    # Get session cookies
    session_cookies = login_response.cookies
    
    # Test data with empty strings for time fields (this was causing the error)
    test_data = {
        "date": "2025-10-18",
        "reason": "Testing Update Event Fix",
        "startTime": "",  # Empty string that should be converted to null
        "endTime": "",    # Empty string that should be converted to null
        "allDay": True,
        "isAvailable": False
    }
    
    # Test the PUT request that was failing
    response = requests.put('http://localhost:6001/api/availability-exceptions/19',
                          json=test_data,
                          cookies=session_cookies)
    
    print(f"📡 PUT Response Status: {response.status_code}")
    
    if response.status_code == 200:
        print("✅ Update Event button fix is working!")
        result = response.json()
        print(f"📊 Updated record: {json.dumps(result, indent=2)}")
    else:
        print(f"❌ Update Event button still failing: {response.status_code}")
        try:
            error_details = response.json()
            print(f"🚨 Error details: {json.dumps(error_details, indent=2)}")
        except:
            print(f"🚨 Raw error: {response.text}")

if __name__ == "__main__":
    test_update_event()
