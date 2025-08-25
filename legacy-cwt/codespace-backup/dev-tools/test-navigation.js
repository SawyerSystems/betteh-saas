/**
 * Blog and Tip Navigation Test
 * 
 * This script tests navigation from list pages to detail pages
 * for blog posts and tips.
 */

const puppeteer = require('puppeteer');

async function runTest() {
  console.log('Starting navigation test...');
  
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    console.log('Browser launched successfully');
    
    // Test blog navigation
    console.log('\n--- Testing Blog Navigation ---');
    await page.goto('http://localhost:5173/blog');
    console.log('Loaded blog listing page');
    
    // Wait for content to load
    await page.waitForSelector('.blog-post-card', { timeout: 5000 });
    
    // Get the first blog post link
    const blogLinks = await page.$$eval('.blog-post-card a', links => 
      links.map(link => link.getAttribute('href'))
    );
    
    if (blogLinks.length === 0) {
      console.log('❌ No blog posts found to test navigation');
    } else {
      console.log(`Found ${blogLinks.length} blog posts`);
      console.log(`First blog post link: ${blogLinks[0]}`);
      
      // Navigate to the first blog post
      await page.goto(`http://localhost:5173${blogLinks[0]}`);
      await page.waitForSelector('h1', { timeout: 5000 });
      
      const blogTitle = await page.$eval('h1', el => el.textContent);
      console.log(`✅ Successfully loaded blog post: "${blogTitle}"`);
    }
    
    // Test tips navigation
    console.log('\n--- Testing Tips Navigation ---');
    await page.goto('http://localhost:5173/tips');
    console.log('Loaded tips listing page');
    
    // Wait for content to load
    await page.waitForSelector('.tip-card', { timeout: 5000 });
    
    // Get the first tip link
    const tipLinks = await page.$$eval('.tip-card a', links => 
      links.map(link => link.getAttribute('href'))
    );
    
    if (tipLinks.length === 0) {
      console.log('❌ No tips found to test navigation');
    } else {
      console.log(`Found ${tipLinks.length} tips`);
      console.log(`First tip link: ${tipLinks[0]}`);
      
      // Navigate to the first tip
      await page.goto(`http://localhost:5173${tipLinks[0]}`);
      await page.waitForSelector('h3', { timeout: 5000 });
      
      const tipTitle = await page.$eval('h3', el => el.textContent);
      console.log(`✅ Successfully loaded tip: "${tipTitle}"`);
    }
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

runTest();
