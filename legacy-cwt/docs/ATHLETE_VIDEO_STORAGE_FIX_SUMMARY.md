# 🎯 ATHLETE PROGRESS VIDEO STORAGE FIX

## ❌ **Problem Identified**
Athlete progress videos uploaded via the test modal were being stored in the **`site-media/skill-reference/`** folder instead of the **`site-media/athlete-skills/`** folder.

## 🔍 **Root Cause Analysis**
1. **TestSkillDialog** (test modal) uses `useUploadMedia()` hook for video uploads
2. **`useUploadMedia()`** calls `/api/admin/media` endpoint 
3. **`/api/admin/media`** was hardcoded to store ALL uploads in `skill-reference/` folder
4. **No differentiation** between athlete progress videos and general skill reference videos

## ✅ **Solution Implemented**

### 1. **Server-Side Changes** (`/server/routes.ts`)
- Modified `/api/admin/media` endpoint to support **context-based folder routing**
- Added **query parameter `context`** to determine storage folder:
  - `context=athlete-skill` → stores in `athlete-skills/` folder
  - No context or other values → stores in `skill-reference/` folder (default)

### 2. **Client-Side Changes**

#### **Updated `useUploadMedia()` Hook** (`/client/src/hooks/useAthleteProgress.ts`)
- Enhanced to support **both old and new usage patterns**:
  - `uploadMedia.mutateAsync(file)` → stores in `skill-reference/` (backwards compatible)
  - `uploadMedia.mutateAsync({ file, context: 'athlete-skill' })` → stores in `athlete-skills/`

#### **Updated TestSkillDialog** (`/client/src/components/admin/TestSkillDialog.tsx`)
- Changed athlete skill video uploads to use **`context: 'athlete-skill'`**
- Ensures all progress videos from test modal go to correct folder

## 📊 **Current Database Analysis**
Based on the check script, existing videos show:
- **❌ 8 videos** incorrectly stored in `skill-reference/` folder  
- **❓ 3 videos** with external URLs (example.com - demo data)
- **✅ 0 videos** currently in correct `athlete-skills/` folder

## 🧪 **How to Verify the Fix**

### **Manual Testing** (Recommended)
1. **Login as admin** at `http://localhost:5173/admin-login`
2. **Go to Athletes section** and select an athlete
3. **Click "Test" button** on any skill to open the test modal
4. **Upload a video file** using the file upload field
5. **Check the database** using the verification script:
   ```bash
   python3 check_video_storage.py
   ```
6. **Look for new entries** with `✅ CORRECT (athlete-skills/)` storage status

### **Database Verification Script**
```bash
cd /workspaces/coach-will-gymnastics-clean
python3 check_video_storage.py
```

This script shows:
- **Recent athlete skill videos** with storage folder analysis
- **Storage folder summary** showing distribution across folders
- **✅/❌ Status indicators** for correct vs incorrect storage

## 🎯 **Expected Results After Fix**

### **Before Fix:**
```
📊 STORAGE FOLDER ANALYSIS
❌ skill-reference: 8 videos
❓ other: 3 videos
```

### **After Fix (new uploads):**
```
📊 STORAGE FOLDER ANALYSIS  
✅ athlete-skills: X videos (new uploads)
❌ skill-reference: 8 videos (old uploads)
❓ other: 3 videos (demo data)
```

## 🔧 **Technical Implementation Details**

### **File Path Logic:**
```typescript
// Server-side logic
const context = req.query.context as string;
let filePath: string;

if (context === 'athlete-skill' || context === 'athlete-progress') {
  filePath = `athlete-skills/${fileName}`;
} else {
  filePath = `skill-reference/${fileName}`; // Default
}
```

### **Client Usage:**
```typescript
// Old usage (still works - goes to skill-reference/)
const url = await uploadMedia.mutateAsync(file);

// New usage (goes to athlete-skills/)
const url = await uploadMedia.mutateAsync({ 
  file, 
  context: 'athlete-skill' 
});
```

## 📁 **Supabase Storage Structure**

### **Before:**
```
site-media/
└── skill-reference/
    ├── general-skill-videos.mp4
    ├── athlete-progress-videos.mov  ❌ (wrong location)
    └── site-content-uploads.jpg
```

### **After:**
```
site-media/
├── athlete-skills/              ✅ (new folder)
│   ├── progress-video-1.mp4    ✅ (correct location)
│   └── progress-video-2.mov    ✅ (correct location)
└── skill-reference/
    ├── general-skill-videos.mp4  ✅ (correct location)
    └── site-content-uploads.jpg  ✅ (correct location)
```

## ✅ **Backwards Compatibility**
- **Existing uploads** continue to work (URLs unchanged)
- **Old client code** continues to work (falls back to skill-reference/)
- **General site uploads** (banner videos, hero images) unaffected
- **Skill reference videos** (AdminSkillsManager) unaffected

## 🚀 **Deployment Status**
- ✅ **Server changes applied** and running
- ✅ **Client changes applied** and compiled  
- ✅ **Database verification script** available
- 🧪 **Ready for manual testing** by uploading athlete progress videos

---

**Next Step:** Upload a test video through the athlete progress test modal to verify the fix works correctly! 🎬
