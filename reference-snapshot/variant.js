(()=>{'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const card=document.documentElement.classList.contains('card-mode'),pref=matchMedia('(prefers-reduced-motion: reduce)');let off=pref.matches,ctx,flow,autoplay=false,flowTrigger,resizeTimer,lastWidth=innerWidth,lastStep=-1;
const descriptions=['Your funding wallet opens. USDC enters ShieldTX.','Your balance sits inside the shielding layer.','ShieldTX creates a fresh account for your trade.','Your order executes on Hyperliquid.','Closing proceeds return. Ready for the next trade.'];
function step(p){let i=Math.min(4,Math.floor(p*5));if(i===lastStep)return;lastStep=i;$('#step-number').textContent=`0${i+1} / 05`;$('#step-description').textContent=descriptions[i];$$('[data-stage]').forEach((el,n)=>el.setAttribute('aria-pressed',String(n===i)));$('.flow-panel').dataset.phase=String(i);if(innerWidth<=760&&autoplay&&!off){$('.flow-viewport').scrollTo({left:[0,105,310,450,105][i],behavior:'smooth'});}}
function routeInit(){ $$('.route-lines path').forEach(path=>{let l=path.getTotalLength();path.style.strokeDasharray=l;path.style.strokeDashoffset=l;path.style.opacity=0;}); }
function draw(tl,id,start,duration){let path=$(id);tl.to(path,{strokeDashoffset:0,opacity:1,duration,ease:'none'},start);}
function buildFlow(){
 if(flow)flow.kill();routeInit();lastStep=-1;
 gsap.set('#fund-wallet .wallet-flap',{rotationX:0,skewX:0,scaleY:1,y:0});gsap.set('#fund-wallet .wallet-clasp',{x:0,opacity:1});
 gsap.set('#fresh-wallet,#execution',{opacity:.25});gsap.set('.execution-check',{opacity:0});gsap.set('#flow-dollar',{opacity:0,attr:{transform:'translate(125 173)'}});gsap.set('#return-particle',{opacity:0});
 flow=gsap.timeline({paused:true,onUpdate(){step(flow.progress());},onComplete(){if(autoplay&&!off){$('.flow-panel').dataset.cycles=String(Number($('.flow-panel').dataset.cycles||0)+1);flow.restart(true);}}});
 // A shallow fold opens the wallet face; its back stays in place.
 flow.to('#fund-wallet .wallet-clasp',{x:8,opacity:.25,duration:.35,ease:'power2.inOut'},.1)
 .to('#fund-wallet .wallet-flap',{scaleY:.48,skewX:-12,y:14,duration:.65,ease:'power2.inOut'},.25)
 .to('#flow-dollar',{opacity:1,attr:{transform:'translate(125 155)'},duration:.18},.55)
 .to('#flow-dollar',{attr:{transform:'translate(125 90)'},duration:.8,ease:'power2.out'},.6)
 .to('#flow-dollar',{attr:{transform:'translate(435 160)'},duration:1.25,ease:'power2.inOut'},1.5)
 .to('#fund-wallet .wallet-flap',{scaleY:1,skewX:0,y:0,duration:.6,ease:'power2.inOut'},2)
 .to('#fund-wallet .wallet-clasp',{x:0,opacity:1,duration:.35},2.5);
 draw(flow,'#route-fund',1.45,1.1);
 draw(flow,'#route-account',4.35,.9);
 flow.to('#fresh-wallet',{opacity:1,duration:.7},4.6).fromTo('#fresh-wallet .new-plus',{opacity:0},{opacity:1,duration:.5},5);
 draw(flow,'#route-trade',6.35,.85);flow.to('#execution',{opacity:1,duration:.6},6.65).to('.execution-check',{opacity:1,duration:.4},7.2);
 draw(flow,'#route-return',8.05,1.6);
 const returnPath=$('#route-return'),length=returnPath.getTotalLength(),position={p:0};
 flow.to('#return-particle',{opacity:1,duration:.1},8.05).to(position,{p:1,duration:1.6,ease:'none',onUpdate(){let pt=returnPath.getPointAtLength(position.p*length);$('#return-particle').setAttribute('cx',pt.x);$('#return-particle').setAttribute('cy',pt.y);}},8.05).to('#return-particle',{opacity:0,duration:.25},9.65);
 flow.to({}, {duration:1.4},9.7);step(0);
}
function placeDollar(progress){
 const journey=$('.journey').getBoundingClientRect(),a=$('.hero-art').getBoundingClientRect(),b=$('.problem-art').getBoundingClientRect(),d=$('.travelling-dollar');
 const w=d.offsetWidth,h=d.offsetHeight;
 const sx=a.left-journey.left+a.width*.5-w/2,sy=a.top-journey.top+a.height*.545-h/2;
 const ex=b.left-journey.left+b.width*.5-w/2,ey=b.top-journey.top+b.height*(230/420)-h/2;
 gsap.set(d,{left:sx,top:sy,x:(ex-sx)*progress,y:(ey-sy)*progress});
 // On narrow screens, conceal the travelling symbol while it passes the copy.
 if(innerWidth<=760&&!card){const copy=$('.problem-copy').getBoundingClientRect(),cy=journey.top+sy+(ey-sy)*progress;d.style.opacity=Math.max(clamp((copy.top-cy-h)/24),clamp((cy-copy.bottom)/24));}else{d.style.opacity=1;}
 $('.institution-shell').style.opacity=1-clamp(progress*2.5);
 $('.problem').classList.toggle('rays-on',progress>.985);
 d.dataset.position=progress>.985?'problem':progress<.01?'hero':'travelling';
}
function setup(){
 ctx?.revert();autoplay=false;document.documentElement.classList.toggle('motion-off',off);$('#motion-toggle').textContent=`Motion ${off?'off':'on'} ◎`;$('#motion-toggle').setAttribute('aria-pressed',String(off));
 $('#play-flow').textContent='Watch the flow ↻';
 gsap.registerPlugin(ScrollTrigger);buildFlow();
 ctx=gsap.context(()=>{
 const phase={p:0};
 if(card){placeDollar(0);$('.problem').classList.add('rays-on');let ghost=$('.travelling-dollar').cloneNode(true);ghost.className='card-dollar';$('.problem-art').append(ghost);flow.progress(.91);return;}
 const travel=ScrollTrigger.create({trigger:'.problem',start:'top 96%',end:'top 30%',scrub:.5,onUpdate(s){phase.p=s.progress;placeDollar(phase.p);},onRefresh(s){placeDollar(s.progress);}});
 placeDollar(travel.progress);
 if(innerWidth>760&&!off){flowTrigger=ScrollTrigger.create({trigger:'.flow-story',start:'top 100px',end:'bottom bottom',onUpdate(s){if(autoplay&&s.progress<.985&&s.direction<0){autoplay=false;flow.pause();$('#play-flow').textContent='Watch the flow ↻';}if(!autoplay){flow.progress(s.progress);if(s.progress>=.999&&s.isActive){autoplay=true;$('#play-flow').textContent='Pause flow Ⅱ';flow.restart(true);}}},onLeave(){const r=$('.flow-panel').getBoundingClientRect();if(!off&&r.bottom>150&&r.top<innerHeight){autoplay=true;flow.restart(true);$('#play-flow').textContent='Pause flow Ⅱ';}else{autoplay=false;flow.pause();$('#play-flow').textContent='Replay flow ↻';}},onLeaveBack(){autoplay=false;flow.pause(0);$('#play-flow').textContent='Watch the flow ↻';}});}else{flowTrigger=null;flow.progress(1);}
 if(off){flow.progress(1);}
 });
 ScrollTrigger.refresh();window.institutionViews?.forEach(v=>v.render());
}
$('#play-flow').addEventListener('click',()=>{if(off){off=false;setup();}autoplay=!autoplay;if(autoplay){flow.progress()>.98?flow.restart():flow.play();$('#play-flow').textContent='Pause flow Ⅱ';}else{flow.pause();$('#play-flow').textContent='Continue flow ↻';}});
$$('[data-stage]').forEach(button=>button.addEventListener('click',()=>{autoplay=false;flow.pause();let p=[.12,.32,.52,.72,.94][+button.dataset.stage];flow.progress(p);$('#play-flow').textContent='Continue flow ↻';if(innerWidth<=760){const target=[0,110,320,500,300][+button.dataset.stage];$('.flow-viewport').scrollTo({left:target,behavior:off?'instant':'smooth'});}}));
const features=new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('active',e.isIntersecting&&!off)),{threshold:.2});$$('.feature').forEach(el=>features.observe(el));
const flowVisibility=new IntersectionObserver(entries=>{if(entries[0].isIntersecting&&innerWidth<=760&&!off&&!card&&!autoplay){autoplay=true;flow.restart();$('#play-flow').textContent='Pause flow Ⅱ';}if(!entries[0].isIntersecting&&autoplay){autoplay=false;flow.pause();$('#play-flow').textContent='Continue flow ↻';}},{threshold:.1});flowVisibility.observe($('.flow-panel'));
$('#motion-toggle').addEventListener('click',()=>{off=!off;setup();});pref.addEventListener('change',e=>{off=e.matches;setup();});
$('.menu-toggle').addEventListener('click',()=>{let open=$('#navigation').classList.toggle('open');$('.menu-toggle').setAttribute('aria-expanded',open);$('.menu-toggle').setAttribute('aria-label',open?'Close menu':'Open menu');});$$('#navigation a').forEach(el=>el.addEventListener('click',()=>{$('#navigation').classList.remove('open');$('.menu-toggle').setAttribute('aria-expanded','false');}));
const dialog=$('#scan-dialog');let opener;
$('.scan-open').addEventListener('click',e=>{opener=e.currentTarget;dialog.showModal();$('#wallet-address').focus();});function close(){dialog.close();opener?.focus();}$('.close').addEventListener('click',close);dialog.addEventListener('cancel',()=>opener?.focus());dialog.addEventListener('click',e=>{if(e.target===dialog){let r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
$('#scan-form').addEventListener('submit',e=>{e.preventDefault();let input=$('#wallet-address'),value=input.value.trim();if(!/^0x[a-fA-F0-9]{40}$/.test(value)){$('#scan-error').hidden=false;$('#scan-error').textContent='Enter 0x followed by 40 hexadecimal characters.';input.setAttribute('aria-invalid','true');input.focus();return;}input.removeAttribute('aria-invalid');$('#scan-error').hidden=true;window.open('https://scanner.shieldtx.xyz/#scan/'+encodeURIComponent(value),'_blank','noopener,noreferrer');});
$('#wallet-address').addEventListener('input',()=>{$('#scan-error').hidden=true;$('#wallet-address').removeAttribute('aria-invalid');});
window.addEventListener('resize',()=>{if(innerWidth===lastWidth)return;lastWidth=innerWidth;clearTimeout(resizeTimer);resizeTimer=setTimeout(setup,180);});document.fonts.ready.then(setup);window.addEventListener('load',()=>ScrollTrigger.refresh());
})();
