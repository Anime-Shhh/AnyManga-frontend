import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROME_EXECUTABLE??'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',args:[...(process.env.CI?['--no-sandbox']:[]),'--disable-gpu','--no-first-run']});
const base=process.env.ANYMANGA_TEST_URL??'http://127.0.0.1:3002';
async function fixture(page){
 await page.route('**/api/manga/health',r=>r.fulfill({status:204}));
 await page.route('**/api/manga/chapterimages?**',route=>{const n=Number(new URL(route.request().url()).searchParams.get('chapter').split('-')[1]);return route.fulfill({json:{manga:'Controls fixture',slug:'controls-fixture',provider:'weebcentral',language:'en',chapter:{id:`chapter-${n}`,title:`Chapter ${n}`},previous:n>1?{id:`chapter-${n-1}`,title:`Chapter ${n-1}`}:null,next:{id:`chapter-${n+1}`,title:`Chapter ${n+1}`},images:Array.from({length:12},(_,i)=>`/controls-page/${n}/${i}.svg`)}})});
 await page.route('**/controls-page/**',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="750" height="1200"><rect width="100%" height="100%" fill="#30243c"/></svg>'}));
}
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});page.on('pageerror',e=>errors.push(e.message));await fixture(page);
 await page.goto(base+'/read/controls-fixture/chapter-2');await page.getByRole('heading',{name:'Chapter 2',exact:true}).waitFor();
 await page.mouse.wheel(0,3000);await page.getByRole('complementary',{name:'Reader controls'}).waitFor({state:'hidden'});
 await page.mouse.wheel(0,-300);
 const floating=page.getByRole('navigation',{name:'Floating chapter navigation'});await floating.waitFor();
 await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('body > header')).opacity)===1);
 assert.equal(await floating.getByRole('link',{name:'Home',exact:true}).getAttribute('href'),'/');
 assert.equal(await floating.getByRole('link',{name:'Manga page',exact:true}).getAttribute('href'),'/read/controls-fixture');
 await floating.getByRole('link',{name:'Next chapter',exact:true}).click();await page.getByRole('heading',{name:'Chapter 3',exact:true}).waitFor();
 await page.getByRole('navigation',{name:'Floating chapter navigation'}).getByRole('link',{name:'Previous chapter',exact:true}).click();await page.getByRole('heading',{name:'Chapter 2',exact:true}).waitFor();
 await page.goto(base+'/read/controls-fixture/chapter-1');await page.getByRole('heading',{name:'Chapter 1',exact:true}).waitFor();assert.equal(await page.getByRole('navigation',{name:'Floating chapter navigation'}).getByRole('button',{name:'Previous chapter'}).isDisabled(),true);
 for(const width of [768,1024,1280,1440,1536]){
 await page.setViewportSize({width,height:900});
 const railBox=await page.getByRole('navigation',{name:'Floating chapter navigation'}).boundingBox();const pageBox=await page.getByAltText('Page 1',{exact:true}).boundingBox();assert(railBox.x>=pageBox.x+pageBox.width,`desktop controls overlap the page image at ${width}px`);
 }
 await page.close();

 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});phone.on('pageerror',e=>errors.push(e.message));await fixture(phone);
 await phone.goto(base+'/read/controls-fixture/chapter-2');await phone.getByRole('heading',{name:'Chapter 2',exact:true}).waitFor();
 await phone.evaluate(()=>window.scrollTo(0,3000));
 const touch=await phone.context().newCDPSession(phone);
 await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:150,y:650}]});
 await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:150,y:500}]});
 await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await phone.getByRole('button',{name:'Open reader controls'}).waitFor({state:'hidden'});
 // Upward scrolling alone stays unobtrusive on a phone.
 await phone.evaluate(()=>window.scrollTo(0,2800));assert.equal(await phone.getByRole('button',{name:'Open reader controls'}).count(),0);
 await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:150,y:650}]});
 await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:150,y:350}]});
 await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await phone.waitForFunction(()=>window.scrollY>2800);
 assert.equal(await phone.getByRole('button',{name:'Open reader controls'}).count(),0,'a swipe revealed the controls');
 await phone.evaluate(()=>new Promise(resolve=>{let prior=scrollY,stable=0;function frame(){stable=scrollY===prior?stable+1:0;prior=scrollY;if(stable>=8)resolve();else requestAnimationFrame(frame)}requestAnimationFrame(frame)}));
 await phone.touchscreen.tap(150,350);const toggle=phone.getByRole('button',{name:'Open reader controls'});await toggle.waitFor();
 assert.equal(await toggle.getAttribute('aria-expanded'),'false');assert.equal(await phone.getByRole('navigation',{name:'Floating chapter navigation'}).count(),0);
 await phone.waitForFunction(()=>Number(getComputedStyle(document.querySelector('body > header')).opacity)===1);
 await toggle.tap();const mobileNav=phone.getByRole('navigation',{name:'Floating chapter navigation'});await mobileNav.waitFor();
 assert.equal(await phone.getByRole('button',{name:'Close reader controls'}).getAttribute('aria-expanded'),'true');
 await phone.keyboard.press('Escape');await mobileNav.waitFor({state:'hidden'});
 await phone.getByRole('button',{name:'Open reader controls'}).tap();await phone.getByRole('navigation',{name:'Floating chapter navigation'}).getByRole('link',{name:'Next chapter',exact:true}).tap();
 await phone.getByRole('heading',{name:'Chapter 3',exact:true}).waitFor();assert.equal(await phone.getByRole('navigation',{name:'Floating chapter navigation'}).count(),0);
 assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth),390);
 await phone.close();

 const notice=await browser.newPage({viewport:{width:390,height:844}});notice.on('pageerror',e=>errors.push(e.message));let healthy=false;
 await fixture(notice);
 await notice.unroute('**/api/manga/health');
 await notice.route('**/api/manga/health',route=>route.fulfill({status:healthy?204:503,body:healthy?undefined:'Unavailable'}));
 await notice.route('**/api/manga/featured',route=>route.fulfill({json:[]}));await notice.route('**/api/manga/popular',route=>route.fulfill({json:[]}));await notice.route('**/api/manga/category?**',route=>route.fulfill({json:[]}));
 await notice.route('**/api/manga/discovery',route=>route.fulfill({json:{featured:[],sections:[],sources:[],updatedAt:'2026-01-01T00:00:00Z'}}));
 for(const path of ['/','/read','/read/controls-fixture/chapter-2']){
  healthy=false;await notice.goto(base+path);await notice.getByText('Servers are currently down.',{exact:true}).waitFor();
  const guide=notice.getByRole('link',{name:'Self-hosting guide'});assert.match(await guide.getAttribute('href'),/^https:\/\/github.com\/Anime-Shhh\/AnyManga-Backend\//);
  assert.equal(await notice.evaluate(()=>document.documentElement.scrollWidth),390);
  healthy=true;await notice.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await notice.getByText('Servers are currently down.',{exact:true}).waitFor({state:'hidden'});
 }
 await notice.context().setOffline(true);await notice.getByText('You’re offline. Reconnect to check server status.',{exact:true}).waitFor();await notice.context().setOffline(false);
 await notice.getByText('You’re offline. Reconnect to check server status.',{exact:true}).waitFor({state:'hidden'});
 assert.deepEqual(errors,[]);
 console.log('PASS laptop scroll controls; phone tap then hamburger; links/disabled previous/Escape; home+browse outage and recovery; offline state; no mobile overflow');
}finally{await browser.close()}
