/** Real Chromium smoke for opt-in React model layout. Does not publish any site. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import puppeteer from 'puppeteer-core';

const host='http://127.0.0.1:8789';
const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','8789','--strictPort'],{stdio:'ignore'});
let browser;
async function ready(){
 for(let i=0;i<75;i++){
   try{const r=await fetch(host+'/');if(r.ok)return;}catch{}
   await new Promise(resolve=>setTimeout(resolve,200));
 }
 throw Error('Vite preview failed to start');
}
const cardIds=page=>page.$$eval('[data-ve-model-pilot="1"] [data-ve-id]',els=>els.map(el=>el.getAttribute('data-ve-id')));
(async()=>{
 try{
   await ready();
   browser=await puppeteer.launch({headless:true,executablePath:process.env.CHROME_BIN??'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
   const page=await browser.newPage();await page.setViewport({width:1280,height:800});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(host+'/',{waitUntil:'networkidle2'});
   assert.equal(await page.$('[data-ve-model-pilot="1"]'),null,'normal visitors must never see pilot');
   assert.equal(await page.evaluate(()=>performance.getEntriesByType('resource').some(e=>e.name.includes('ReactModelPilot-'))),false,'normal visitors must not fetch lazy pilot chunk');
   await page.goto(host+'/?visual_editor_model=1',{waitUntil:'networkidle2'});
   await page.waitForSelector('[data-ve-model-pilot="1"] [data-ve-id="subtitle"]');
   assert.deepEqual(await cardIds(page),['title','subtitle','footer']);
   await page.click('[data-ve-id="subtitle"]');
   await page.click('[data-action="up"]');
   await page.waitForFunction(()=>Array.from(document.querySelectorAll('[data-ve-model-pilot="1"] [data-ve-id]')).map(e=>e.getAttribute('data-ve-id')).join(',')==='subtitle,title,footer');
   await page.click('[data-action="duplicate"]');
   await page.waitForFunction(()=>Boolean(document.querySelector('[data-ve-id="copy-1"]')));
   assert.deepEqual(await cardIds(page),['subtitle','copy-1','title','footer']);
   await page.click('[data-action="undo"]');
   await page.waitForFunction(()=>!document.querySelector('[data-ve-id="copy-1"]'));
   await page.click('[data-action="redo"]');
   await page.waitForFunction(()=>Boolean(document.querySelector('[data-ve-id="copy-1"]')));
   await page.click('[data-ve-id="copy-1"]');
   await page.click('[data-action="remove"]');
   await page.waitForFunction(()=>!document.querySelector('[data-ve-id="copy-1"]'));
   await page.click('[data-action="undo"]');
   await page.waitForFunction(()=>Boolean(document.querySelector('[data-ve-id="copy-1"]')));
   assert.deepEqual(errors,[]);
   await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
   assert.equal(await page.$('[data-ve-model-pilot="1"]'),null,'pilot should still exist on mobile');
   await page.goto(host+'/',{waitUntil:'networkidle2'});
   assert.equal(await page.$('[data-ve-model-pilot="1"]'),null);
   console.log('M4 React model browser: opt-in/no-fetch, declarative move, factory clone, delete, undo/redo, 1280/390 success');
 }finally{
   if(browser)await browser.close();
   server.kill('SIGTERM');
 }
})().catch(err=>{console.error(err);process.exitCode=1;});
