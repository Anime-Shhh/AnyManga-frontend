import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROME_EXECUTABLE??'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',args:[...(process.env.CI?['--no-sandbox']:[]),'--disable-gpu','--no-first-run']});
const base=process.env.ANYMANGA_TEST_URL??'http://127.0.0.1:3002';
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2uCAAAAAASUVORK5CYII=','base64');
try{
 const page=await browser.newPage();let refreshes=0;
 const fixture={manga:'Image fixture',slug:'image-fixture',provider:'mangaread',chapter:{id:'chapter-1',title:'Chapter 1'},images:['https://direct-image.invalid/page.png'],imageFallbacks:{'https://direct-image.invalid/page.png':'/fixture-proxy.png'},next:null,previous:null};
 await page.route('**/api/manga/chapterimages?**',route=>{if(new URL(route.request().url()).searchParams.get('refresh')==='1')refreshes++;return route.fulfill({json:fixture})});
 await page.route('https://direct-image.invalid/**',route=>route.abort());
 await page.route('**/fixture-proxy.png',route=>route.fulfill({contentType:'image/png',body:png}));
 await page.goto(base+'/read/image-fixture/chapter-1');
 await page.waitForFunction(()=>document.querySelector('img[alt="Page 1"]')?.naturalWidth>0);
 assert.equal(await page.getByAltText('Page 1',{exact:true}).getAttribute('src'),'/fixture-proxy.png');assert.equal(refreshes,0);
 // A failed fallback refreshes metadata once, then offers the existing source switch.
 await page.unroute('**/fixture-proxy.png');await page.route('**/fixture-proxy.png',r=>r.fulfill({status:502,body:'Unavailable'}));
 await page.goto(base+'/read/image-fixture/chapter-1');
 await page.getByRole('button',{name:'Try another source'}).waitFor();
 assert.equal(refreshes,1,'metadata refresh should be bounded to one attempt');
 console.log('PASS direct failure -> proxy fallback; fallback failure -> one metadata refresh -> source switch');
}finally{await browser.close()}
