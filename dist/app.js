(() => {
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const reducedPreference=matchMedia('(prefers-reduced-motion: reduce)');
let motionChoice=null, context, resizeTimer, solutionTrigger, activeStep=-1, flowTimeline, tradeNumber=1, setFlowPlaying, firstTradeComplete=false, scrollDriver;
let flowReleased=false,releaseFlowRunway;
const TRADE_END=12.2, STEP_TIMES=[1.8,4.4,6.6,10.5];
const reduced=()=>motionChoice===null?reducedPreference.matches:motionChoice;
const stepCopy=[
 'Your wallet opens. USDC moves into your ShieldTX balance.',
 'ShieldTX separates your funding wallet from the account that trades.',
 'A fresh account keeps your main wallet out of the public trading trail.',
 'Execute on Hyperliquid. Closing proceeds return to your ShieldTX balance.'
];
function step(n){n=Math.max(0,Math.min(3,n));if(activeStep===n)return;activeStep=n;$('.step-count').textContent=`0${n+1} / 04`;$('#step-copy').textContent=stepCopy[n];$$('.flow-step').forEach((b,i)=>{b.classList.toggle('active',i===n);b.setAttribute('aria-pressed',String(i===n));});$$('.flow-node').forEach((el,i)=>el.classList.toggle('is-active',i===n));}
function setup(){
 if(context)context.revert();flowTimeline?.kill();tradeNumber=1;firstTradeComplete=flowReleased;scrollDriver=null;solutionTrigger=null;activeStep=-1;
 const desktop=innerWidth>760, enabled=!reduced()&&window.gsap&&window.ScrollTrigger;
 document.documentElement.classList.toggle('motion-off',!enabled);document.body.classList.toggle('has-motion',!!enabled&&desktop);
 const hero=$('.hero'),problem=$('.problem'),stage=$('.visual-stage'),institutionStage=$('.institution-stage');
 institutionStage.style.top='';
 stage.style.top='';stage.style.transform='';stage.style.translate='';stage.style.rotate='';stage.style.scale='';stage.style.opacity='';problem.style.minHeight='';problem.style.paddingTop='';problem.style.paddingBottom='';
 // The institution stays hero-anchored; the separate dollar layer travels continuously.
 let heroTop=55,problemTop=0;
 if(desktop){
   const artHeight=stage.getBoundingClientRect().height;
   heroTop=Math.max(24,(hero.offsetHeight-artHeight)/2);
   institutionStage.style.top=`${heroTop}px`;
   const bottom=$('.problem-bottom').offsetHeight,copy=$('.problem .narrative-copy');
   // Reserve a separate scanner row; center text and orbit in the same upper area.
   problem.style.paddingTop='24px';problem.style.paddingBottom=`${bottom+24}px`;
   problem.style.minHeight=`${Math.max(artHeight*.9,copy.offsetHeight)+bottom+50}px`;
   problemTop=problem.offsetTop+1+(problem.offsetHeight-2-bottom-artHeight)/2;
 }else{
   const artHeight=stage.getBoundingClientRect().height;heroTop=hero.offsetHeight-artHeight-66;institutionStage.style.top=`${heroTop}px`;
   const copy=$('.problem .narrative-copy'),copyHeight=copy.offsetHeight,copyTop=copy.offsetTop;
   const bottom=$('.problem-bottom').offsetHeight;
   problem.style.minHeight=`${copyTop+copyHeight+artHeight+bottom+40}px`;problemTop=problem.offsetTop+copyTop+copyHeight+16;
 }
 stage.style.top=`${heroTop}px`;
 if(!window.gsap||!window.ScrollTrigger)return;
 gsap.registerPlugin(ScrollTrigger);
 const fr=$('.flow-diagram').getBoundingClientRect(), ar=$$('.diagram-art').slice(0,4).map(el=>el.getBoundingClientRect());
 const center=window.shieldScene?.flowCenter();
 const points=ar.map(r=>({x:r.left+r.width/2-fr.left,y:r.top+r.height/2-fr.top}));
 const target=center?{x:center.x-fr.left,y:center.y-fr.top}:points[1];
 for(const svg of $$('.routes,.transfer-layer'))svg.setAttribute('viewBox',`0 0 ${fr.width} ${fr.height}`);
 const paths=$$('.flow-route');
 if(desktop){
 paths.forEach((p,i)=>{const start=points[i].x+(i===1?ar[1].width/2-14:i===0?48:45),end=points[i+1].x-(i===0?ar[1].width/2-14:i===1?45:60);p.setAttribute('d',`M${start} ${points[i].y}H${end}`);});
 const ry=$('.flow-grid').getBoundingClientRect().bottom-fr.top+30;
 $('.return-route').setAttribute('d',`M${points[3].x+63} ${points[3].y+54}V${ry-10}Q${points[3].x+63} ${ry} ${points[3].x+53} ${ry}H${target.x+10}Q${target.x} ${ry} ${target.x} ${ry-10}V${ry-25}`);
 }else{
 paths[0].setAttribute('d',`M${points[0].x+30} ${points[0].y}H${points[1].x-46}`);
 paths[1].setAttribute('d',`M${points[1].x+48} ${points[1].y+65}H${fr.width-10}V${points[2].y-20}H${points[2].x+38}`);
 paths[2].setAttribute('d',`M${points[2].x-30} ${points[2].y}H${points[3].x+43}`);
 const ry=$('.flow-grid').getBoundingClientRect().bottom-fr.top+30,rx=fr.width-3;
 $('.return-route').setAttribute('d',`M${points[3].x} ${points[3].y+62}V${ry-8}Q${points[3].x} ${ry} ${points[3].x+8} ${ry}H${rx-8}Q${rx} ${ry} ${rx} ${ry-8}V${points[1].y+76}Q${rx} ${points[1].y+66} ${rx-10} ${points[1].y+66}H${points[1].x+38}`);
 }
 
 context=gsap.context(()=>{
   const scanner=$('.scanner-callout'),border=$('.scanner-border'),edge=$('.scanner-light');
   const sw=scanner.clientWidth,sh=scanner.clientHeight;
   border.setAttribute('viewBox',`0 0 ${sw} ${sh}`);
   edge.setAttribute('d',`M1 1H${sw-1}`);
   const borderLength=edge.getTotalLength(),beam=Math.min(100,sw*.16);
   edge.setAttribute('stroke-dasharray',`${beam} ${borderLength+beam}`);
   if(enabled){
     // The panel follows scroll in both directions; the light plays only after opening.
     const scannerContents=$$('.scanner-intro,.scanner-callout>.scan-open');
     let lightPlayed=false;
     const borderSweep=gsap.timeline({paused:true})
       .fromTo(edge,{attr:{'stroke-dashoffset':beam},opacity:0},{attr:{'stroke-dashoffset':-borderLength},duration:1.2,ease:'none'},0)
       .to(edge,{opacity:.65,duration:.12,ease:'sine.out'},0)
       .to(edge,{opacity:0,duration:.22,ease:'sine.inOut'},.98);
     gsap.timeline({scrollTrigger:{trigger:scanner,start:'top 95%',end:'bottom 88%',scrub:.45,invalidateOnRefresh:true},
       onUpdate(){
         if(this.progress()>=.999&&!lightPlayed){
           lightPlayed=true;
           const r=scanner.getBoundingClientRect();
           if(r.bottom>$('.header').offsetHeight&&r.top<innerHeight)borderSweep.restart();
         }else if(this.progress()<.995&&lightPlayed){lightPlayed=false;borderSweep.pause(0);}
       }})
       .fromTo(scanner,{clipPath:'inset(0 0 100% 0)'},{clipPath:'inset(0 0 0% 0)',duration:1,ease:'none'},0)
       .fromTo(scannerContents,{y:-12,opacity:.2},{y:0,opacity:1,duration:1,ease:'none'},0);

   }

   const phase={value:0};
   const placeDollarStage=()=>{
     const p=phase.value,ease=p*p*(3-2*p);
     stage.style.transform=`translate3d(0,${(problemTop-heroTop)*ease}px,0)`;stage.dataset.travelProgress=p.toFixed(4);
     // On mobile, the intervening copy occupies the art's lane. Fade while passing it.
     stage.style.opacity=String(desktop?1:p<.2?1-p/.2:p>.8?(p-.8)/.2:0);
   };
   const paintScene=()=>{institutionStage.style.opacity=String(1-Math.min(1,phase.value/.62));placeDollarStage();window.shieldScene?.setProgress(phase.value);$('.edge-label').classList.toggle('exposed',phase.value>.65);};
   if(enabled){
     gsap.to('.scroll-cue',{autoAlpha:0,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'top -100',scrub:true}});
     // Read the journey's actual scroll position on every refresh. Never reuse a
     // scrub tween's cached start value after the later trade section collapses.
     const follow=gsap.quickTo(phase,'value',{duration:.45,ease:'power2.out',onUpdate:paintScene});
     const journeyTrigger=ScrollTrigger.create({trigger:problem,
       start:()=>Math.max(80,problem.getBoundingClientRect().top+scrollY-innerHeight*(desktop?.96:1.01)),
       end:desktop?'top 17%':'top 29%',invalidateOnRefresh:true,
       onUpdate:self=>follow(self.progress),
       onRefresh:self=>{follow.tween.pause();phase.value=self.progress;paintScene();}
     });
     phase.value=journeyTrigger.progress;paintScene();
   }else{
     const showPhase=exposed=>{phase.value=exposed?1:0;paintScene();gsap.set('.institution-stage',{opacity:exposed?0:1});};
     ScrollTrigger.create({trigger:problem,start:'top 65%',onEnter:()=>showPhase(true),onLeaveBack:()=>showPhase(false)});
     showPhase(problem.getBoundingClientRect().top<innerHeight*.65);
   }
   const paths=$$('.flow-route,.return-route'),diagram=$('.flow-diagram');
   paths.forEach(p=>{const len=p.getTotalLength();gsap.set(p,{strokeDasharray:len,strokeDashoffset:len,opacity:0});p.style.markerEnd='none';});
   const draw=(tl,index,start,duration)=>tl.to(paths[index],{strokeDashoffset:0,opacity:1,duration,ease:'none',onUpdate(){paths[index].style.markerEnd=Number(gsap.getProperty(paths[index],'strokeDashoffset'))<2?'url(#flow-arrow)':'none';}},start);
   diagram.dataset.trade='1';
   gsap.set('#fund-wallet .wallet-flap',{scaleY:1,skewX:0,y:0});gsap.set('#fund-wallet .wallet-clasp',{x:0,opacity:1});
   gsap.set('#fresh-wallet',{opacity:1});gsap.set('.account-current',{opacity:0,y:14});gsap.set('.account-history',{opacity:0});
   gsap.set('#execution',{opacity:.4});gsap.set('.execution-check,.new-plus',{opacity:0});gsap.set('.candles',{opacity:.15});
   const chart=$('.chart-trace'),chartLength=chart.getTotalLength();gsap.set(chart,{strokeDasharray:chartLength,strokeDashoffset:chartLength});
   gsap.set('#flow-dollar',{opacity:0});$('#flow-dollar-position').setAttribute('transform',`translate(${points[0].x} ${points[0].y})`);gsap.set('#return-particle',{opacity:0});
   $('.account-number').textContent='ACCOUNT 01';
   // Sample by distance along the curve, so bends cannot accelerate the dollar.
   const fundingPath=document.createElementNS('http://www.w3.org/2000/svg','path'),a=points[0],lift=desktop?100:58;
   fundingPath.setAttribute('d',`M${a.x} ${a.y}C${a.x+12} ${a.y-lift} ${target.x-48} ${target.y-lift*.7} ${target.x} ${target.y}`);
   const fundingLength=fundingPath.getTotalLength();
   flowTimeline=gsap.timeline({paused:true,repeat:0,onUpdate(){
     const t=flowTimeline.time(),phase=t<3?'fund':t<5.2?'shield':t<7.8?'create':t<9.4?'execute':'return';
     step(t<3?0:t<5.2?1:t<7.8?2:3);diagram.dataset.phase=phase;
     const f=Math.max(0,Math.min(1,(t-1)/2)),point=fundingPath.getPointAtLength(f*fundingLength);
     $('#flow-dollar-position').setAttribute('transform',`translate(${point.x} ${point.y})`);
     diagram.dataset.flowTime=t.toFixed(3);
     paths.forEach((path,i)=>path.style.markerEnd=t>=[3,5.2,7.8,11.8][i]?'url(#flow-arrow)':'none');
     if(t>=9.4)$('#step-copy').textContent='Closing proceeds return to your ShieldTX balance. Ready for the next trade.';
   },onRepeat(){
     tradeNumber++;diagram.dataset.trade=String(tradeNumber);$('.account-number').textContent=`ACCOUNT ${String(tradeNumber).padStart(2,'0')}`;
     gsap.set('.history-one',{opacity:.35});gsap.set('.history-two',{opacity:tradeNumber>2?.18:0});
   }});
   // One continuous sequence; the first pass is scrubbed, subsequent passes repeat.
   flowTimeline.to('#fund-wallet .wallet-clasp',{x:8,opacity:.35,duration:.4,ease:'none'},0)
    .to('#fund-wallet .wallet-flap',{scaleY:.44,skewX:-10,y:14,duration:.6,ease:'none'},.3)
    .to('#flow-dollar',{opacity:1,duration:.3,ease:'none'},.7)
    .to('#fund-wallet .wallet-flap',{scaleY:1,skewX:0,y:0,duration:.6,ease:'none'},2.2)
    .to('#fund-wallet .wallet-clasp',{x:0,opacity:1,duration:.4,ease:'none'},2.6);
   draw(flowTimeline,0,1,2);draw(flowTimeline,1,3.6,1.6);
   flowTimeline.to('.account-current',{opacity:1,y:0,duration:1,ease:'none'},5.2).to('.new-plus',{opacity:1,duration:.4,ease:'none'},5.8);
   draw(flowTimeline,2,6.2,1.6);
   flowTimeline.to('#execution',{opacity:1,duration:.6,ease:'none'},7.6)
    .to('.candles',{opacity:1,duration:.6,ease:'none'},7.8)
    .to(chart,{strokeDashoffset:0,duration:1.2,ease:'none'},7.8)
    .to('.execution-check',{opacity:1,duration:.4,ease:'none'},9);
   draw(flowTimeline,3,9.4,2.4);
   const returnPath=paths[3],length=returnPath.getTotalLength(),travel={p:0};
   flowTimeline.to('#return-particle',{opacity:1,duration:.15,ease:'none'},9.4)
    .to(travel,{p:1,duration:2.4,ease:'none',onUpdate(){const pt=returnPath.getPointAtLength(travel.p*length);$('#return-particle').setAttribute('cx',pt.x);$('#return-particle').setAttribute('cy',pt.y);}},9.4)
    .to('#return-particle',{opacity:0,duration:.4,ease:'none'},11.8);
   // Settlement remains visible before a soft, synchronized reset.
   flowTimeline.to('.account-current',{y:-9,opacity:0,duration:.6,ease:'sine.inOut'},12.6)
    .to('#flow-dollar,.flow-route,.return-route,.execution-check',{opacity:0,duration:.6,ease:'none'},12.6)
    .to('#execution',{opacity:.4,duration:.6,ease:'none'},12.6).to({}, {duration:.2},13.2);
   const inView=()=>{const r=diagram.getBoundingClientRect(),header=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header'));return r.bottom>header+90&&r.top<innerHeight*.88;};
   setFlowPlaying=(play)=>{diagram.dataset.playing=String(play);if(play){flowTimeline.repeat(-1).play();}else flowTimeline.pause();};
   const finishFirst=()=>{if(firstTradeComplete)return;firstTradeComplete=true;diagram.dataset.firstTrade='complete';flowTimeline.repeat(-1);if(inView())setFlowPlaying(true);};
   diagram.dataset.firstTrade=flowReleased?'complete':'scroll';diagram.dataset.playing='false';
   step(0);
   if(enabled){
     if(!flowReleased){
     const progress={value:0};let furthestProgress=0;
     scrollDriver=gsap.to(progress,{value:1,duration:1,ease:'none',onUpdate(){if(firstTradeComplete)return;furthestProgress=Math.max(furthestProgress,progress.value);flowTimeline.pause().time(furthestProgress*TRADE_END);if(progress.value>=.9999)finishFirst();},scrollTrigger:{trigger:desktop?'.solution-story':'.flow-diagram',start:desktop?()=>`top top+=${parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header'))+24}`:'top 65%',end:desktop?'bottom bottom':'bottom 45%',scrub:.35,invalidateOnRefresh:true}});
     solutionTrigger=scrollDriver.scrollTrigger;
     }else{flowTimeline.pause().time(TRADE_END);}
     ScrollTrigger.create({trigger:'.flow-diagram',start:'top 88%',end:()=>`bottom top+=${parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header'))+90}`,onEnter(){if(firstTradeComplete)setFlowPlaying(true);},onEnterBack(){if(firstTradeComplete)setFlowPlaying(true);},onLeave(){if(firstTradeComplete)setFlowPlaying(false);},onLeaveBack(){if(firstTradeComplete)setFlowPlaying(false);}});
   }else{flowTimeline.pause().time(TRADE_END);gsap.set('.account-current,.account-history',{opacity:1,y:0});gsap.set('#flow-dollar',{opacity:1});paths.forEach(p=>{p.style.opacity='1';p.style.strokeDashoffset='0';p.style.markerEnd='url(#flow-arrow)';});}
   releaseFlowRunway=()=>{
     if(flowReleased||!enabled)return;
     const story=$('.solution-story'),inner=$('.solution-inner');
     const start=solutionTrigger?.start??story.getBoundingClientRect().top+scrollY;
     if(scrollY<=start+2)return;
     // Preserve the visible content's screen position when removing the scrub distance.
     const ir=inner.getBoundingClientRect();
     const anchor=ir.bottom>0&&ir.top<innerHeight?inner:$('.product');
     const before=anchor.getBoundingClientRect().top;
     flowReleased=true;firstTradeComplete=true;diagram.dataset.firstTrade='complete';
     scrollDriver?.scrollTrigger?.kill();scrollDriver?.kill();scrollDriver=null;solutionTrigger=null;
     story.classList.add('flow-released');
     const compensation=anchor.getBoundingClientRect().top-before;
     window.scrollTo({top:Math.max(0,scrollY+compensation),behavior:'instant'});
     ScrollTrigger.refresh();
     if(inView())setFlowPlaying(true);
   };
   const cards=$$('.stack-wallet'),slots=[{x:23,y:34,opacity:.45},{x:76,y:49,opacity:.7},{x:130,y:64,opacity:1}];
   cards.forEach((c,i)=>gsap.set(c,slots[i]));
   if(enabled){
     const stack=$('.wallet-stack'),cycle=gsap.timeline({paused:true,repeat:-1});
     for(let k=0;k<3;k++){
       const t=k*3.4,back=cards[k%3],middle=cards[(k+1)%3],front=cards[(k+2)%3];
       cycle.to(back,{x:8,y:22,opacity:0,duration:.45,ease:'sine.in'},t+.8)
        .to(middle,{...slots[0],duration:.8,ease:'power2.inOut'},t+.8)
        .to(front,{...slots[1],duration:.8,ease:'power2.inOut'},t+.8)
        .set(back,{x:slots[2].x,y:slots[2].y+24,opacity:0},t+1.25)
        .call(()=>stack.append(back),null,t+1.25)
        .to(back,{...slots[2],duration:.8,ease:'power2.out'},t+1.3);
     }
     cycle.to({}, {duration:1.3},8.9);
     ScrollTrigger.create({trigger:'.fresh-art',start:'top bottom',end:'bottom top',onToggle:self=>self.isActive?cycle.play():cycle.pause()});
   }
   if(enabled){$$('.feature').forEach(el=>gsap.fromTo(el,{opacity:.4,y:22},{opacity:1,y:0,duration:.6,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 93%',toggleActions:'play none none reverse'}}));}
 });
 ScrollTrigger.refresh();
}
$$('.flow-step').forEach(button=>button.addEventListener('click',()=>{const n=Number(button.dataset.step),time=STEP_TIMES[n];if(!firstTradeComplete&&solutionTrigger){window.scrollTo({top:solutionTrigger.start+(solutionTrigger.end-solutionTrigger.start)*time/TRADE_END,behavior:reduced()?'instant':'smooth'});}else{setFlowPlaying(false);flowTimeline.time(time);if(!reduced())setFlowPlaying(true);}}));
// Reverse travel never retraces the first trade or retains its extra scroll runway.
let reverseTouchY=0,previousScrollY=scrollY;
const reverseAllowed=target=>!target?.closest('dialog,input,textarea,select,[contenteditable="true"]');
addEventListener('wheel',e=>{if(e.deltaY<0&&!e.ctrlKey&&reverseAllowed(e.target))releaseFlowRunway?.();},{passive:true});
addEventListener('touchstart',e=>{if(e.touches.length===1)reverseTouchY=e.touches[0].clientY;},{passive:true});
addEventListener('touchmove',e=>{if(e.touches.length!==1)return;const y=e.touches[0].clientY;if(y>reverseTouchY&&reverseAllowed(e.target))releaseFlowRunway?.();reverseTouchY=y;},{passive:true});
addEventListener('keydown',e=>{if(reverseAllowed(e.target)&&(['ArrowUp','PageUp','Home'].includes(e.key)||(e.key===' '&&e.shiftKey)))releaseFlowRunway?.();});
addEventListener('scroll',()=>{if(scrollY<previousScrollY-2)releaseFlowRunway?.();previousScrollY=scrollY;},{passive:true});
const featureObserver=new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('active',e.isIntersecting)),{threshold:.2});$$('.feature').forEach(el=>featureObserver.observe(el));
const ringObserver=new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('motion-visible',e.isIntersecting)),{threshold:.1});ringObserver.observe($('.closing'));
$('.menu-toggle').addEventListener('click',()=>{const open=$('#navigation').classList.toggle('open');$('.menu-toggle').setAttribute('aria-expanded',String(open));$('.menu-toggle').setAttribute('aria-label',open?'Close menu':'Open menu');});
$$('#navigation a').forEach(link=>link.addEventListener('click',()=>{$('#navigation').classList.remove('open');$('.menu-toggle').setAttribute('aria-expanded','false');$('.menu-toggle').setAttribute('aria-label','Open menu');}));
const dialog=$('#scan-dialog');let scanOpener;
function closeScan(){dialog.close();document.body.classList.remove('no-scroll');scanOpener?.focus();}
$$('.scan-open').forEach(b=>b.addEventListener('click',()=>{scanOpener=b;dialog.showModal();document.body.classList.add('no-scroll');$('#wallet-address').focus();}));
$('.scan-close').addEventListener('click',closeScan);dialog.addEventListener('cancel',e=>{e.preventDefault();closeScan();});dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeScan();}});
reducedPreference.addEventListener('change',setup);
let lastWidth=innerWidth,lastHeight=innerHeight;window.addEventListener('resize',()=>{if(Math.abs(lastWidth-innerWidth)<2&&(innerWidth<=760||Math.abs(lastHeight-innerHeight)<2))return;lastWidth=innerWidth;lastHeight=innerHeight;clearTimeout(resizeTimer);resizeTimer=setTimeout(setup,180);});
setup();
document.fonts.ready.then(setup);
document.addEventListener('shield-model-ready',setup);
window.addEventListener('load',()=>window.ScrollTrigger?.refresh(),{once:true});
})();
