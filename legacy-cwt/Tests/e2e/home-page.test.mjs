import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

async function testHomePage() {
  console.log('🧪 Testing home page implementation...');
  
  try {
    const response = await fetch('http://localhost:5173/');
    const html = await response.text();
    
    console.log(`✅ Home page response: ${response.status}`);
    
    // Parse the HTML
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Initial app div content - this is where React will hydrate
    const appDiv = document.getElementById('root');
    console.log('Root div found:', !!appDiv);
    
    // Check for React scripts
    const scripts = document.querySelectorAll('script');
    console.log(`Found ${scripts.length} script tags`);
    
    // Look for our video sources in the rendered HTML or JavaScript
    const mp4SourceInHtml = html.includes('/attached_assets/Banner_video_new.MP4');
    const movSourceInHtml = html.includes('/banner-video.mov');
    
    console.log(`MP4 video path found in HTML: ${mp4SourceInHtml}`);
    console.log(`MOV video path found in HTML: ${movSourceInHtml}`);
    
    // Open our test pages
    console.log('\n📋 Test Pages:');
    console.log('1. Video Check Page: http://localhost:5173/video-check.html');
    console.log('2. Test Banner Video: http://localhost:5173/test-banner-video.html');
    console.log('3. Main Application: http://localhost:5173/');
    
    console.log('\n⚠️ Note: The React application is client-side rendered, so the video elements');
    console.log('   may not appear in the initial HTML but should be visible in the browser.');
    
    // Check for vite client script
    const viteClientScript = Array.from(scripts).find(s => 
      s.src && s.src.includes('@vite/client')
    );
    console.log('Vite client script found:', !!viteClientScript);
    
    // Client-side rendered app confirmation
    if (appDiv && viteClientScript) {
      console.log('✅ Application appears to be a client-side rendered React app');
      console.log('   Open http://localhost:5173/ in a browser to view the final rendered page');
    }
    
  } catch (error) {
    console.log(`❌ Error testing home page: ${error.message}`);
  }
}

// Run the test after a short delay to ensure server is ready
setTimeout(() => {
  testHomePage();
}, 2000);
