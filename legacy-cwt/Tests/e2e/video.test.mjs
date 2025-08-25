import fetch from 'node-fetch';

async function testVideoAccess() {
  console.log('🧪 Testing video file accessibility...');
  
  const baseUrl = 'http://localhost:5173';
  const videoPaths = [
    '/attached_assets/Banner_video_new.MP4',
    '/banner-video.mov'
  ];
  
  for (const path of videoPaths) {
    try {
      console.log(`Testing ${path}...`);
      const response = await fetch(`${baseUrl}${path}`, {
        method: 'HEAD'  // Only get headers, not the full file
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        const contentLength = response.headers.get('content-length');
        console.log(`✅ Success: ${path}`);
        console.log(`   Content-Type: ${contentType}`);
        console.log(`   Content-Length: ${formatBytes(contentLength)}`);
      } else {
        console.log(`❌ Failed: ${path} - Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Error accessing ${path}: ${error.message}`);
    }
  }
}

function formatBytes(bytes, decimals = 2) {
  if (!bytes) return 'unknown';
  
  bytes = parseInt(bytes);
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Wait for the server to be fully started
setTimeout(() => {
  testVideoAccess();
}, 2000);
