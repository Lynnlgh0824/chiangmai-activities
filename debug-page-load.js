const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Monitor console
  page.on('console', msg => console.log('Browser Console:', msg.text()));
  
  // Monitor network requests
  page.on('request', request => {
    if (request.url().includes('api')) {
      console.log('API Request:', request.url());
    }
  });
  
  page.on('response', async response => {
    if (response.url().includes('api')) {
      console.log('API Response:', response.status(), response.url());
      try {
        const body = await response.json();
        console.log('API Data count:', body.data?.length || 0);
      } catch(e) {
        console.log('API Response body:', await response.text());
      }
    }
  });
  
  console.log('Navigating to http://localhost:5173');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  
  // Wait a bit for JS to execute
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Check page content
  const activitiesHTML = await page.$eval('#activities', el => el.innerHTML);
  console.log('Activities HTML length:', activitiesHTML.length);
  console.log('Activities HTML (first 500 chars):', activitiesHTML.substring(0, 500));
  
  const activityCards = await page.$$eval('.activity-card', els => els.length);
  console.log('Activity cards count:', activityCards);
  
  await browser.close();
})();
