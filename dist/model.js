(() => {
'use strict';
if(!window.THREE)return;
const T=window.THREE, views=[];
const rayLabels=['Copy bots','Media desks','Wallet tracking','PnL scrutiny','Position watchers','Strategy mirroring','Liquidation alerts','Reputation exposure'];
// Anchor every threat to the same outer orbit, preserving its approach angle.
const orbitCircle=document.querySelector('.ball-orbit circle');
const orbit={x:+orbitCircle.getAttribute('cx'),y:+orbitCircle.getAttribute('cy'),r:+orbitCircle.getAttribute('r')};
const rayOrigins=[[82,165],[522,348],[394,88],[93,488],[526,198],[65,325],[390,524],[214,88]].map(([x,y])=>{
 const angle=Math.atan2(y-orbit.y,x-orbit.x);
 return [orbit.x+orbit.r*Math.cos(angle),orbit.y+orbit.r*Math.sin(angle)];
});
let rayStart=null, rayElements=[];
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function institution(){
 const root=new T.Group();root.name='ShieldTX_Four_Column_Institution';
 // Depth-only surfaces retain clean occlusion; all visible architecture is white ink.
 const stone=new T.MeshBasicMaterial({color:0xffffff,colorWrite:false,depthWrite:true,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1});
 const edge=new T.LineBasicMaterial({color:0xffffff,transparent:true,opacity:1});
 const detail=new T.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.72});
 function solid(geo,x,y,z){const mesh=new T.Mesh(geo,stone);mesh.position.set(x,y,z);root.add(mesh);const outline=new T.LineSegments(new T.EdgesGeometry(geo,30),edge);mesh.add(outline);return mesh;}
 const box=(w,h,d,x,y,z)=>{const mesh=solid(new T.BoxGeometry(w,h,d),x,y,z);return mesh;};
 function line(points,material=detail){const line=new T.Line(new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(...p))),material);root.add(line);return line;}
 // Four solid, distinct treads; hidden back edges are depth-occluded.
 for(let i=0;i<4;i++)box(7.45-i*.42,.19,3.35-i*.39,0,.095+i*.19,0);
 box(5.95,.14,1.95,0,.83,0);
 function column(x){
  const z=.55;
  box(.70,.14,.70,x,.97,z);
  solid(new T.CylinderGeometry(.285,.32,.12,48),x,1.10,z);
  // A tapered, genuinely fluted shaft with restrained engraved lines.
  const radial=96,levels=10,pos=[],indices=[];
  for(let j=0;j<=levels;j++){const t=j/levels,base=.245-.045*t+Math.sin(t*Math.PI)*.012;for(let k=0;k<=radial;k++){const a=k/radial*Math.PI*2,r=base-.009*(.5+.5*Math.cos(a*16));pos.push(Math.cos(a)*r,1.17+t*2.52,Math.sin(a)*r);}}
  for(let j=0;j<levels;j++)for(let k=0;k<radial;k++){const a=j*(radial+1)+k,b=a+radial+1;indices.push(a,b,a+1,b,b+1,a+1);}
  const shaft=new T.BufferGeometry();shaft.setAttribute('position',new T.Float32BufferAttribute(pos,3));shaft.setIndex(indices);shaft.computeVertexNormals();solid(shaft,x,0,z);
  for(let k=1;k<8;k++){const a=k*Math.PI/8;const pts=[];for(let j=0;j<=10;j++){const t=j/10,r=.245-.045*t+Math.sin(t*Math.PI)*.012+.002;pts.push([x+Math.cos(a)*r,1.18+t*2.50,z+Math.sin(a)*r]);}line(pts);}
  solid(new T.CylinderGeometry(.29,.20,.18,48),x,3.79,z);
  box(.66,.14,.66,x,3.95,z);
 }
 [-2.46,-.84,.84,2.46].forEach(column);
 // Broad frieze gives the ShieldTX name a clear home.
 box(6.18,.36,2.08,0,4.20,0);
 box(6.43,.13,2.30,0,4.445,0);
 const shape=new T.Shape();shape.moveTo(-3.22,0);shape.lineTo(0,1.22);shape.lineTo(3.22,0);shape.closePath();
 solid(new T.ExtrudeGeometry(shape,{depth:2.28,bevelEnabled:false}),0,4.53,-1.14);
 line([[-2.92,4.64,1.148],[0,5.62,1.148],[2.92,4.64,1.148],[-2.92,4.64,1.148]],edge);
 line([[-2.60,4.74,1.15],[0,5.48,1.15],[2.60,4.74,1.15]],detail);
 root.userData.materials=[edge,detail];root.userData.baseOpacity=[1,.72];
 return root;
}
function initRays(){
 const svg=document.querySelector('.attack-rays');svg.replaceChildren();svg.setAttribute('viewBox','0 0 600 600');svg.setAttribute('preserveAspectRatio','xMidYMid meet');
 const ns='http://www.w3.org/2000/svg';
 const el=(tag,attrs)=>{const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);return n;};
 rayElements=rayLabels.map((label,i)=>{const [x,y]=rayOrigins[i],g=el('g',{'class':'threat-ray','opacity':0});const path=el('path',{d:`M${x} ${y}L${x} ${y}`,fill:'none',stroke:'#d7e9ff','stroke-width':1.1});const dot=el('circle',{r:2.4,fill:'#ffffff'});const text=el('text',{x,y:y-12,fill:'#edf6ff','text-anchor':x>480?'end':x<110?'start':'middle'});text.textContent=label.toUpperCase();g.append(path,dot,text);svg.append(g);return{g,path,dot,text,x,y};});
}
function rays(v,time,cx,cy){
 const svg=document.querySelector('.attack-rays'),ready=v.phase>=.998;
 svg.classList.toggle('is-active',ready);svg.dataset.state=ready?'incoming':'waiting';
 if(!ready){rayStart=null;rayElements.forEach(r=>r.g.setAttribute('opacity','0'));return;}
 if(rayStart===null)rayStart=time;
 const quiet=document.documentElement.classList.contains('motion-off');
 // A fixed screen-space clearance encloses the coin at every rotation.
 const boundaryRadius=.50/(v.camera.right-v.camera.left)*600+12;
 svg.dataset.clearanceRadius=boundaryRadius.toFixed(3);
 svg.dataset.centerX=cx.toFixed(3);svg.dataset.centerY=cy.toFixed(3);
 const seconds=(time-rayStart)/1000;
 rayElements.forEach((r,i)=>{
  const age=(seconds-i*.88)%7.04,live=quiet?i<4:age>=0&&age<2.30;
  if(!live){r.g.setAttribute('opacity','0');return;}
  const f=quiet?1:clamp(age/1.75),alpha=quiet?.7:clamp(age/.22)*clamp((2.30-age)/.45);
  const dx=cx-r.x,dy=cy-r.y,len=Math.hypot(dx,dy),stopRadius=boundaryRadius+2.4,endX=cx-dx/len*stopRadius,endY=cy-dy/len*stopRadius;
  const px=r.x+(endX-r.x)*f,py=r.y+(endY-r.y)*f;
  r.path.setAttribute('d',`M${r.x} ${r.y}L${px} ${py}`);r.dot.setAttribute('cx',px);r.dot.setAttribute('cy',py);r.g.setAttribute('opacity',alpha.toFixed(3));
 });
}
function makeView(host,hero){
 if(!host)return;
 let renderer;try{renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch{host.classList.add('model-unavailable');host.textContent='Interactive model unavailable in this browser.';return;}
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x004fef,0);host.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true');
 const scene=new T.Scene(),camera=new T.OrthographicCamera(-4.3,4.3,4.3,-4.3,.1,100);
 camera.position.set(3.5,6.0,29);camera.lookAt(0,2.9,0);
 scene.add(new T.AmbientLight(0xdce9ff,.82));const light=new T.DirectionalLight(0xeaf4ff,.8);light.position.set(-5,9,9);scene.add(light);
 const model=hero?null:institution();if(model)scene.add(model);
 const view={host,hero,renderer,scene,camera,institution:model,visible:true,phase:0};
 if(hero){
  const contour=new T.ShapePath();
  for(const c of window.shieldDollarCommands){if(c.type==='M')contour.moveTo(c.x,-c.y);else if(c.type==='L')contour.lineTo(c.x,-c.y);else if(c.type==='Q')contour.quadraticCurveTo(c.x1,-c.y1,c.x,-c.y);else if(c.type==='C')contour.bezierCurveTo(c.x1,-c.y1,c.x2,-c.y2,c.x,-c.y);else if(c.type==='Z')contour.currentPath.closePath();}
  // Blueprint coin: opaque cobalt faces, white engraved contours, hatched edge.
  const orb=new T.Group();orb.name='DollarCoin';
  const white=new T.MeshBasicMaterial({color:0xffffff});
  const blue=new T.MeshBasicMaterial({color:0x004fef});
  const disc=new T.Shape();disc.absarc(0,0,.48,0,Math.PI*2,false);
  const bodyGeo=new T.ExtrudeGeometry(disc,{depth:.075,bevelEnabled:false,curveSegments:96});bodyGeo.center();
  orb.add(new T.Mesh(bodyGeo,blue));
  const outlines=contour.subPaths.map(path=>path.getPoints(18));
  const bounds=new T.Box2().setFromPoints(outlines.flat());
  const center=bounds.getCenter(new T.Vector2()),scale=.63/(bounds.max.y-bounds.min.y);
  function stroke(points,radius,parent){
   const curve=new T.CurvePath();
   for(let i=1;i<points.length;i++)curve.add(new T.LineCurve3(points[i-1],points[i]));
   parent.add(new T.Mesh(new T.TubeGeometry(curve,points.length*2,radius,5,false),white));
  }
  for(const side of [-1,1]){
   const face=new T.Group();face.position.z=side*.040;
   if(side<0)face.rotation.y=Math.PI;
   orb.add(face);
   for(const [radius,width] of [[.48,.0035],[.443,.0024],[.428,.0018]]){
    face.add(new T.Mesh(new T.TorusGeometry(radius,width,6,128),white));
   }
   for(const start of [.15,Math.PI+.15]){
    const points=[];
    for(let i=0;i<=60;i++){const angle=start+i/60*2.55;points.push(new T.Vector3(Math.cos(angle)*.401,Math.sin(angle)*.401,.001));}
    stroke(points,.0018,face);
   }
   for(const path of outlines){
    const points=path.map(p=>new T.Vector3((p.x-center.x)*scale*1.12,(p.y-center.y)*scale,.002));
    if(points[0].distanceTo(points[points.length-1])>1e-6)points.push(points[0].clone());
    stroke(points,.0035,face);
   }
  }
  const milling=[];
  for(let i=0;i<72;i++){
   const a=i*Math.PI*2/72,b=a+.024;
   milling.push(Math.cos(a)*.481,Math.sin(a)*.481,-.037,Math.cos(b)*.481,Math.sin(b)*.481,.037);
  }
  const millingGeo=new T.BufferGeometry();millingGeo.setAttribute('position',new T.Float32BufferAttribute(milling,3));
  orb.add(new T.LineSegments(millingGeo,new T.LineBasicMaterial({color:0xffffff})));
  orb.rotation.y=-.20;orb.rotation.z=-.10;orb.position.set(0,2.73,.72);scene.add(orb);view.orb=orb;host.dataset.object='dollar-coin';
  const shine=new T.PointLight(0xffffff,1.4);shine.position.set(-1,5,5);scene.add(shine);
  const halo=new T.Mesh(new T.PlaneGeometry(1.7,1.7),new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{strength:{value:1}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform float strength;void main(){float d=length(vUv-.5)*2.;float a=pow(max(0.,1.-d),3.)*.43*strength;gl_FragColor=vec4(.05,1.,.85,a);}'}));scene.add(halo);view.halo=halo;halo.scale.setScalar(.75);halo.visible=false;
 }
 function resize(){const r=host.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);const aspect=r.width/r.height,span=Math.max(host.id==='flow-model'?8.8:8.5,aspect*6.75);camera.left=-span/2;camera.right=span/2;camera.top=span/aspect/2;camera.bottom=-span/aspect/2;camera.updateProjectionMatrix();renderView(view,performance.now());}
 new ResizeObserver(resize).observe(host);new IntersectionObserver(entries=>{view.visible=entries[0].isIntersecting;if(view.visible)renderView(view,performance.now());},{rootMargin:'80px'}).observe(host);views.push(view);resize();
 host.dataset.model='webgl';host.dataset.pillars=hero?'0':'4';host.dataset.meshes=String(model?model.children.filter(c=>c.isMesh).length:1);
 return view;
}
function renderView(v,time=0){
 if(!v.visible&&!v.hero)return;
 const p=v.hero?v.phase:0,fade=1-clamp(p/.62);
 // Architecture lives in its own hero-anchored canvas; the travelling coin
 // has a separate canvas and cannot carry the institution into another section.
 if(v.institution)v.institution.visible=true;
 const name=new T.Vector3(0,4.20,1.065).project(v.camera);
 v.host.parentElement.style.setProperty('--name-x',`${(name.x*.5+.5)*100}%`);v.host.parentElement.style.setProperty('--name-y',`${(-name.y*.5+.5)*100}%`);
 if(v.hero){
  // The coin descends independently; incoming rays start only after arrival.
  const start=new T.Vector3(0,2.73,.72),depth=start.clone().project(v.camera).z;
  const center=new T.Vector3(0,1-2*299/600,depth).unproject(v.camera);
  v.orb.position.copy(start).lerp(center,clamp((p-.12)/.86));
  const quiet=document.documentElement.classList.contains('motion-off');
  v.orb.rotation.y=quiet?-.20:-.20+(time%8000)/8000*Math.PI*2;
  v.host.dataset.rotation=v.orb.rotation.y.toFixed(3);
  v.halo.position.copy(v.orb.position);v.halo.quaternion.copy(v.camera.quaternion);v.halo.material.uniforms.strength.value=.3;
  const q=v.orb.position.clone().project(v.camera),x=(q.x*.5+.5),y=(-q.y*.5+.5);
  const stage=v.host.parentElement;stage.style.setProperty('--orbit-opacity',String(p>=.999?.18:0));stage.style.setProperty('--orb-x',`${x*100}%`);stage.style.setProperty('--orb-y',`${y*100}%`);stage.dataset.institution=fade>.001?'visible':'faded';stage.dataset.orb=p>=.999?'arrived':'travelling';stage.style.setProperty('--transit-clearance',String(clamp(p/.07)*clamp((1-p)/.07)));
  rays(v,time,x*600,y*600);
 }
 v.renderer.render(v.scene,v.camera);
}
initRays();
makeView(document.getElementById('hero-model'),false);
const hero=makeView(document.getElementById('orb-model'),true);makeView(document.getElementById('flow-model'),false);
window.shieldScene={flowCenter(){const v=views.find(v=>v.host.id==='flow-model');if(!v)return null;const p=new T.Vector3(0,2.42,1.3).project(v.camera),r=v.host.getBoundingClientRect();return{x:r.left+(p.x*.5+.5)*r.width,y:r.top+(-p.y*.5+.5)*r.height};},setProgress(p){if(hero){hero.phase=clamp(p);renderView(hero,performance.now());}},refresh(){views.forEach(v=>renderView(v,performance.now()));}};
document.dispatchEvent(new Event('shield-model-ready'));
let last=0;function tick(t){if(t-last>33&&!document.hidden&&!document.documentElement.classList.contains('motion-off')){views.filter(v=>v.hero).forEach(v=>{const r=v.host.getBoundingClientRect();v.visible=r.bottom>0&&r.top<innerHeight;if(v.visible)renderView(v,t);});last=t;}requestAnimationFrame(tick);}requestAnimationFrame(tick);
})();
