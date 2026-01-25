const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Log console
  page.on('console', msg => console.log('Console:', msg.text()));
  
  console.log('Loading page...');
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
  
  console.log('Waiting 5 seconds for data load...');
  await page.waitForTimeout(5000);
  
  // Check content
  const activitiesHTML = await page.locator('#activities').innerHTML();
  console.log('Activities HTML length:', activitiesHTML.length);
  console.log('Contains "activity-card"?', activitiesHTML.includes('activity-card'));
  
  const cardCount = await page.locator('.activity-card').count();
  console.log('Activity cards found:', cardCount);
  
  // Check loading element
  const loadingVisible = await page.locator('#loading').isVisible();
  console.log('Loading element visible?', loadingVisible);
  
  await browser.close();
})();
