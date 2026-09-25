const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('dist/scanner.js','utf8');
const snapshot=JSON.parse(fs.readFileSync('dist/assets/scanner-sample.json','utf8'));
const address=snapshot.data.address;
const other='0x0000000000000000000000000000000000000001';
const settle=async()=>{for(let i=0;i<8;i++)await new Promise(setImmediate);};
function setup(fetch){
 const elements=new Map();
 const $=id=>{
  if(!elements.has(id)) elements.set(id,{value:'',hidden:false,disabled:false,textContent:'',style:{},events:{},attrs:{},
   addEventListener(name,fn){this.events[name]=fn},setAttribute(name,v){this.attrs[name]=v},removeAttribute(name){delete this.attrs[name]},focus(){},scrollIntoView(){}});
  return elements.get(id);
 };
 vm.runInNewContext(source,{document:{querySelector:$},fetch,AbortController,setTimeout,clearTimeout,Intl,matchMedia:()=>({matches:true})});
 return {$,submit:async(value)=>{$('#wallet-address').value=value;$('#scan-form').events.submit({preventDefault(){}});await settle();}};
}
const response=data=>({ok:true,json:async()=>data});
test('invalid addresses never reach the scanner',async()=>{
 let calls=0;const t=setup(async()=>{calls++});await t.submit('not-an-address');
 assert.equal(calls,0);assert.equal(t.$('#scan-error').hidden,false);assert.equal(t.$('#wallet-address').attrs['aria-invalid'],'true');
});
test('sample returns official figures, coverage, and an address-specific detail link',async()=>{
 const t=setup(async()=>response(snapshot.data));t.$('#scan-sample').events.click();await settle();
 assert.equal(t.$('#wallet-address').value,address);assert.equal(t.$('#scan-visibility').textContent,100);
 assert.equal(t.$('#scan-pressure').textContent,25);assert.equal(t.$('#scan-copiers').textContent,'233.7K');
 assert.equal(t.$('#scan-activity').textContent,'5.8M');assert.equal(t.$('#scan-copy-status').textContent,'Partial preview');
 assert.match(t.$('#scan-data-note').textContent,/stale/);assert.equal(t.$('#scan-detail-link').href,'https://scanner.shieldtx.xyz/#scan/'+address);
 assert.equal(t.$('#scan-submit').disabled,false);
});
test('sample fallback is clearly dated and never applied to another wallet',async()=>{
 const t=setup(async url=>{if(url==='assets/scanner-sample.json')return response(snapshot);throw Error('offline')});
 await t.submit(address);assert.match(t.$('#scan-source').textContent,/Saved official sample.*25 Sept 2026/);
 await t.submit(other);assert.equal(t.$('#scan-results').hidden,true);assert.match(t.$('#scan-status').textContent,/unavailable/);
});
test('a missing wallet is not described as private or assigned the sample scores',async()=>{
 const t=setup(async()=>response({ok:true,address:other,state:'not_in_dataset',coverage:{scan:'not_in_dataset'}}));
 await t.submit(other);assert.equal(t.$('#scan-visibility').textContent,'—');assert.equal(t.$('#scan-copiers').textContent,'—');
 assert.match(t.$('#scan-data-note').textContent,/does not mean/);
});
test('editing an address cancels an older response and clears its results',async()=>{
 let resolve;const t=setup(()=>new Promise(r=>{resolve=r}));await t.submit(address);
 t.$('#wallet-address').value=other;t.$('#wallet-address').events.input();resolve(response(snapshot.data));await settle();
 assert.equal(t.$('#scan-results').hidden,true);assert.equal(t.$('#scan-status').textContent,'');
 assert.equal(t.$('#scan-full-link').href,'https://scanner.shieldtx.xyz/#scan/'+other);
});
test('a mismatched upstream wallet cannot be displayed as the queried wallet',async()=>{
 const t=setup(async()=>response(snapshot.data));await t.submit(other);
 assert.equal(t.$('#scan-results').hidden,true);assert.match(t.$('#scan-status').textContent,/unavailable/);
});
