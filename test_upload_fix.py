#!/usr/bin/env python3

import requests
import io
import os

def test_upload_endpoint():
    print("🧪 TESTING VIDEO UPLOAD ENDPOINT")
    print("=" * 50)
    
    # Create a small test file
    test_content = b"test video content for athlete skill upload"
    test_file = io.BytesIO(test_content)
    
    base_url = "http://localhost:5001"
    
    # Test 1: Upload without context (should go to skill-reference/)
    print("\n📤 Test 1: Upload without context parameter")
    try:
        files = {'file': ('test-video-general.mp4', test_file, 'video/mp4')}
        response = requests.post(f"{base_url}/api/admin/media", files=files)
        
        if response.status_code == 200:
            data = response.json()
            url = data.get('url', '')
            print(f"✅ Upload successful: {response.status_code}")
            print(f"📁 Storage path: {'skill-reference' if 'skill-reference' in url else 'other'}")
            print(f"🔗 URL: {url}")
        else:
            print(f"❌ Upload failed: {response.status_code}")
            print(f"📄 Response: {response.text}")
    except Exception as e:
        print(f"❌ Request failed: {e}")
    
    # Test 2: Upload with athlete-skill context (should go to athlete-skills/)
    print("\n📤 Test 2: Upload with athlete-skill context")
    try:
        test_file.seek(0)  # Reset file pointer
        files = {'file': ('test-video-athlete.mp4', test_file, 'video/mp4')}
        response = requests.post(f"{base_url}/api/admin/media?context=athlete-skill", files=files)
        
        if response.status_code == 200:
            data = response.json()
            url = data.get('url', '')
            print(f"✅ Upload successful: {response.status_code}")
            print(f"📁 Storage path: {'athlete-skills' if 'athlete-skills' in url else 'other'}")
            print(f"🔗 URL: {url}")
        else:
            print(f"❌ Upload failed: {response.status_code}")
            print(f"📄 Response: {response.text}")
    except Exception as e:
        print(f"❌ Request failed: {e}")
    
    print("\n🎯 CONCLUSION")
    print("=" * 50)
    print("✅ If Test 1 shows 'skill-reference' and Test 2 shows 'athlete-skills', the fix is working!")
    print("❌ If both show 'skill-reference', there may be an authentication issue (admin login required)")

if __name__ == "__main__":
    test_upload_endpoint()
