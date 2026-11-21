import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROME_EXECUTABLE ?? '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',args:[...(process.env.CI?['--no-sandbox']:[]),'--disable-gpu','--no-first-run','--disable-background-networking']});
try {
 const page=await browser.newPage({viewport:{width:1100,height:800}});
 const metadata=[];const images=[];const failures=[];
 page.on('pageerror',error=>failures.push(error.message));
 await page.route('**/api/manga/health',r=>r.fulfill({status:204}));
 await page.route('**/api/manga/chapterimages?**',route=>{
  const u=new URL(route.request().url());const id=u.searchParams.get('chapter');metadata.push(id);
  const n=Number(id.split('-')[1]);
  return route.fulfill({json:{manga:'Prefetch fixture',slug:'prefetch-fixture',language:'en',provider:'weebcentral',chapter:{id,title:`Chapter ${n}`},previous:n>1?{id:`chapter-${n-1}`,title:`Chapter ${n-1}`}:null,next:{id:`chapter-${n+1}`,title:`Chapter ${n+1}`},images:Array.from({length:12},(_,i)=>`/fixture-page/${n}/${i+1}.svg`)}});
 });
 await page.route('**/fixture-page/**',route=>{
  images.push(new URL(route.request().url()).pathname);
  return route.fulfill({contentType:'image/svg+xml',headers:{'cache-control':'public, max-age=3600'},body:'<svg xmlns="http://www.w3.org/2000/svg" width="750" height="1200"><rect width="100%" height="100%" fill="#333"/></svg>'});
 });
 await page.goto(`${process.env.ANYMANGA_TEST_URL ?? 'http://127.0.0.1:3002'}/read/prefetch-fixture/chapter-1`);
 await page.getByRole('heading',{name:'Chapter 1',exact:true}).waitFor();
 await page.waitForFunction(()=>document.querySelector('img[alt="Page 1"]')?.naturalWidth>0);
 await new Promise(resolve=>setTimeout(resolve,1000));
 assert.deepEqual(metadata,['chapter-1','chapter-2']);
 assert.equal(images.some(url=>url.startsWith('/fixture-page/2/')),false,'next images loaded before near-end trigger');
 await page.getByAltText('Page 10',{exact:true}).scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>performance.getEntriesByType('resource').filter(x=>x.name.includes('/fixture-page/2/')).length>=3);
 assert.deepEqual(images.filter(url=>url.startsWith('/fixture-page/2/')).sort(),['/fixture-page/2/1.svg','/fixture-page/2/2.svg','/fixture-page/2/3.svg']);
 await page.getByRole('link',{name:'Next chapter',exact:true}).last().click();
 await page.getByRole('heading',{name:'Chapter 2',exact:true}).waitFor();
 assert.equal(metadata.filter(id=>id==='chapter-2').length,1,'Next re-fetched cached metadata');
 assert.equal(await page.getByRole('status').count(),0);
 await page.getByRole('link',{name:'Previous chapter',exact:true}).first().click();
 await page.getByRole('heading',{name:'Chapter 1',exact:true}).waitFor();
 assert.equal(metadata.filter(id=>id==='chapter-1').length,1,'Previous re-fetched visited chapter');
 assert.deepEqual(failures,[]);
 console.log('PASS: metadata prefetch; no early next images; near-end first three images; cached Next/Previous; no browser errors');
}finally{await browser.close()}
