import { createServer } from 'node:http';
import { once } from 'node:events';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

// A real HTTP origin deliberately pauses its second chunk. This exercises the
// Next.js forwarder as well as the browser; route.fulfill would buffer the body.
let pdf='%PDF-1.4\n%'+ 'fixture '.repeat(4000)+'\n';
const offsets=[0];
for(const object of ['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Count 1 /Kids [3 0 R] >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << >> /Contents 4 0 R >>','<< /Length 0 >>\nstream\n\nendstream']){
 offsets.push(Buffer.byteLength(pdf));pdf+=`${offsets.length-1} 0 obj\n${object}\nendobj\n`;
}
const xref=Buffer.byteLength(pdf);pdf+=`xref\n0 5\n0000000000 65535 f \n${offsets.slice(1).map(x=>String(x).padStart(10,'0')+' 00000 n \n').join('')}trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
const bytes=Buffer.from(pdf), cut=Math.floor(bytes.length/2);
let release, mode='success', requestClosed=false;
const origin=createServer(async(req,res)=>{
 if(req.url!='/chapters'){res.writeHead(204);res.end();return}
 req.resume();await once(req,'end');requestClosed=false;
 res.on('close',()=>{requestClosed=true;release?.()});
 if(mode==='http-error'){res.writeHead(503,{'content-type':'application/json'});res.end(JSON.stringify({error:'Downloads are busy. Please try again shortly.'}));return}
 const waiting=new Promise(resolve=>{release=resolve});
 res.writeHead(200,{'content-type':'application/pdf','cache-control':'no-store, no-transform','x-anymanga-pages':'1'});
 res.write(bytes.subarray(0,cut));
 await waiting;
 if(!res.destroyed)res.end(mode==='truncated'?Buffer.from('interrupted'):bytes.subarray(cut));
});
origin.listen(18080,'127.0.0.1');await once(origin,'listening');
const browser=await chromium.launch({executablePath:process.env.CHROME_EXECUTABLE??'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',args:[...(process.env.CI?['--no-sandbox']:[]),'--disable-gpu','--no-first-run']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},acceptDownloads:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));const downloads=[];page.on('download',d=>downloads.push(d));
 await page.route('**/api/manga/mangapage?**',r=>r.fulfill({json:{slug:'stream-fixture',name:'Stream fixture',chapterEntries:[{id:'chapter-1',title:'Chapter 1'}]}}));
 const open=async()=>{await page.goto((process.env.ANYMANGA_TEST_URL??'http://127.0.0.1:3002')+'/download?manga=stream-fixture');await page.getByRole('button',{name:'Download PDF',exact:true}).waitFor()};
 await open();await page.getByRole('button',{name:'Download PDF',exact:true}).click();
 await page.getByText('Receiving PDF as pages are processed…',{exact:true}).waitFor();
 const stats=page.getByLabel('Download transfer statistics');await stats.filter({hasText:'KiB received'}).waitFor();assert.match(await stats.innerText(),/\/s/);assert.equal(downloads.length,0,'saved before the stream finished');
 assert.equal(await page.getByRole('button',{name:'Downloading…'}).isDisabled(),true);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);
 release();await page.getByText('PDF downloaded.',{exact:true}).waitFor();assert.equal(downloads.length,1);assert.equal(await downloads[0].failure(),null);
 await open();await page.getByRole('button',{name:'Download PDF',exact:true}).click();await page.getByText('Receiving PDF as pages are processed…',{exact:true}).waitFor();await page.getByRole('button',{name:'Cancel',exact:true}).click();await page.getByText('Download cancelled.',{exact:true}).waitFor();
 for(let i=0;i<40&&!requestClosed;i++)await new Promise(r=>setTimeout(r,50));assert(requestClosed,'cancel did not reach the origin');assert.equal(downloads.length,1);
 mode='truncated';await open();await page.getByRole('button',{name:'Download PDF',exact:true}).click();await page.getByText('Receiving PDF as pages are processed…',{exact:true}).waitFor();release();await page.getByRole('alert').filter({hasText:'interrupted'}).waitFor();assert.equal(downloads.length,1,'saved a truncated PDF');
 mode='http-error';await open();await page.getByRole('button',{name:'Download PDF',exact:true}).click();await page.getByRole('alert').filter({hasText:'Downloads are busy'}).waitFor();assert.equal(downloads.length,1);
 assert.deepEqual(errors,[]);console.log('PASS real progressive origin -> Next.js -> browser; live bytes/speed; complete PDF save; cancel reaches origin; truncated/error responses never saved; mobile layout');
}finally{release?.();await browser.close();origin.closeAllConnections();await new Promise(resolve=>origin.close(resolve))}
