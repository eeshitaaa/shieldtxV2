/* Consume one forward gesture only at section 2's exit. All other sections scroll freely. */
(() => {
 'use strict';
 class SectionGate {
  constructor(){this.passed=new Set();this.pending=null;}
  attempt(y,delta,anchors,gesture){
   if(this.pending){
    if(this.pending.gesture===gesture)return this.pending.anchor;
    this.passed.add(this.pending.anchor.id);this.pending=null;
   }
   const anchor=anchors.find(a=>!this.passed.has(a.id)&&a.top>=y-2&&a.top<=y+delta+2);
   if(anchor){this.pending={anchor,gesture};return anchor;}
   return null;
  }
  release(){if(this.pending)this.passed.add(this.pending.anchor.id);this.pending=null;}
  rewind(y,anchors){this.pending=null;for(const a of anchors)if(y<a.top-40)this.passed.delete(a.id);}
 }
 if(typeof module!=='undefined')module.exports={SectionGate};
 if(typeof document==='undefined')return;
 const root=document.documentElement,gate=new SectionGate();
 const sections=[...document.querySelectorAll('#problem')];
 let gesture=0,lastWheel=-Infinity,lastY=scrollY,touchY=0,bypassUntil=0;
 const enabled=()=>!root.classList.contains('motion-off')&&!document.querySelector('dialog[open]');
 const anchors=()=>{
  const header=parseFloat(getComputedStyle(root).getPropertyValue('--header'))||86;
  return sections.map(el=>{const r=el.getBoundingClientRect();return {id:el.id,top:Math.max(0,r.top+scrollY-header-24,r.bottom+scrollY-innerHeight)};});
 };
 const clear=()=>{gate.release();delete root.dataset.sectionPause;};
 const jump=y=>{window.scrollTo({top:y,behavior:'instant'});lastY=scrollY;};
 const ignored=target=>!!target?.closest('input,textarea,select,[contenteditable="true"],dialog,#navigation.open');
 function intent(event,delta){
  if(ignored(event.target)||event.ctrlKey||event.metaKey)return;
  if(!enabled()){clear();return;}
  if(delta<0){clear();bypassUntil=0;gate.rewind(scrollY+delta,anchors());return;}
  if(!delta||performance.now()<bypassUntil)return;
  const anchor=gate.attempt(scrollY,delta,anchors(),gesture);
  if(anchor){event.preventDefault();root.dataset.sectionPause=anchor.id;jump(anchor.top);}
  else delete root.dataset.sectionPause;
 }
 addEventListener('wheel',e=>{
  const now=performance.now();
  // Group trackpad momentum into its originating gesture, not dozens of fake scrolls.
  if(now-lastWheel>160)gesture++;
  lastWheel=now;
  intent(e,e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1));
 },{passive:false});
 addEventListener('touchstart',e=>{if(e.touches.length===1){gesture++;touchY=e.touches[0].clientY;}},{passive:true});
 addEventListener('touchmove',e=>{if(e.touches.length!==1)return;const y=e.touches[0].clientY;intent(e,touchY-y);touchY=y;},{passive:false});
 addEventListener('keydown',e=>{
  if(ignored(e.target)||e.target?.closest('button,summary,a'))return;
  const delta={ArrowDown:40,ArrowUp:-40,PageDown:innerHeight*.85,PageUp:-innerHeight*.85,End:root.scrollHeight,Home:-root.scrollHeight,' ':innerHeight*.85*(e.shiftKey?-1:1)}[e.key];
  if(delta!==undefined){if(!e.repeat)gesture++;intent(e,delta);}
  if(e.key==='Escape')clear();
 });
 // Clamp any remaining native inertia to the same exit until a new gesture arrives.
 addEventListener('scroll',()=>{
  const y=scrollY,list=anchors();
  if(!enabled()){clear();lastY=y;return;}
  if(performance.now()<bypassUntil){list.forEach(a=>{if(a.top<y-2)gate.passed.add(a.id);else gate.passed.delete(a.id);});lastY=y;return;}
  if(y<lastY-1){clear();gate.rewind(y,list);lastY=y;return;}
  if(y>lastY){const anchor=gate.attempt(lastY,y-lastY,list,gesture);if(anchor){root.dataset.sectionPause=anchor.id;jump(anchor.top);return;}}
  lastY=y;
 },{passive:true});
 function bypass(){clear();bypassUntil=performance.now()+1600;}
 document.addEventListener('click',e=>{if(e.target.closest('a[href^="#"],.flow-step,#motion-toggle,.scan-open'))bypass();},true);
 addEventListener('hashchange',bypass);addEventListener('popstate',bypass);addEventListener('resize',clear);
 new MutationObserver(()=>{if(!enabled()&&gate.pending)clear();}).observe(root,{attributes:true,attributeFilter:['class']});
 anchors().forEach(a=>{if(a.top<scrollY-2)gate.passed.add(a.id);});
})();
