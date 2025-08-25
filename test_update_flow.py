#!/usr/bin/env python3
"""
Debug script to test the availability exception update flow
"""
import requests
import json

def test_update_flow():
    print("🔍 Testing Availability Exception Update Flow")
    
    base_url = "http://localhost:6001"
    
    # Test without authentication first
    print("\n1️⃣ Testing PUT without authentication (should now fail)")
    try:
        response = requests.put(
            f"{base_url}/api/availability-exceptions/19",
            json={
                "date": "2025-10-18", 
                "startTime": "09:00",
                "endTime": "20:00",
                "isAvailable": False,
                "reason": "Test Update - No Auth",
                "title": "Test Title",
                "category": "Meeting",
                "allDay": False
            },
            headers={"Content-Type": "application/json"}
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test login to get session
    print("\n2️⃣ Testing admin login")
    session = requests.Session()
    try:
        login_response = session.post(
            f"{base_url}/api/auth/login",
            json={
                "email": "admin@coachwilltumbles.com",
                "password": "TumbleCoach2025!"
            },
            headers={"Content-Type": "application/json"}
        )
        print(f"Login Status: {login_response.status_code}")
        print(f"Login Response: {login_response.text}")
        print(f"Session Cookies: {session.cookies.get_dict()}")
    except Exception as e:
        print(f"Login Error: {e}")
        return
    
    # Test with authentication
    print("\n3️⃣ Testing PUT with authentication")
    try:
        response = session.put(
            f"{base_url}/api/availability-exceptions/19",
            json={
                "date": "2025-10-18",
                "startTime": "09:00", 
                "endTime": "20:00",
                "isAvailable": False,
                "reason": "Test Update - With Auth",
                "title": "Updated Title",
                "category": "Meeting",
                "allDay": False
            },
            headers={"Content-Type": "application/json"}
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Verify the update
    print("\n4️⃣ Verifying the update")
    try:
        get_response = session.get(f"{base_url}/api/availability-exceptions")
        if get_response.status_code == 200:
            exceptions = get_response.json()
            record_19 = next((e for e in exceptions if e['id'] == 19), None)
            if record_19:
                print(f"✅ Record 19 found: {record_19['reason']} - {record_19['title']}")
            else:
                print("❌ Record 19 not found in response")
        else:
            print(f"Failed to get exceptions: {get_response.status_code}")
    except Exception as e:
        print(f"Verification Error: {e}")

if __name__ == "__main__":
    test_update_flow()
