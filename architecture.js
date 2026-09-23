(()=>{const T=THREE;
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
  for(const [y,r] of [[1.06,.30],[1.13,.27],[3.70,.21],[3.77,.25],[3.84,.29],[3.88,.31]]){
   const points=[];for(let k=0;k<=48;k++){const a=k/48*Math.PI*2;points.push([x+Math.cos(a)*r,y,z+Math.sin(a)*r]);}line(points,edge);
  }
  line([[x-.21,3.70,z+.1],[x-.29,3.84,z+.1],[x-.31,3.88,z+.1]],detail);
  line([[x+.21,3.70,z+.1],[x+.29,3.84,z+.1],[x+.31,3.88,z+.1]],detail);
 }
 [-2.46,-1.78,1.78,2.46].forEach(column);
 // Broad frieze gives the ShieldTX name a clear home.
 box(6.18,.36,2.08,0,4.20,0);
 box(6.43,.13,2.30,0,4.445,0);
 const shape=new T.Shape();shape.moveTo(-3.22,0);shape.lineTo(0,1.22);shape.lineTo(3.22,0);shape.closePath();
 solid(new T.ExtrudeGeometry(shape,{depth:2.28,bevelEnabled:false}),0,4.53,-1.14);
 line([[-2.92,4.64,1.148],[0,5.62,1.148],[2.92,4.64,1.148],[-2.92,4.64,1.148]],edge);
 line([[-2.60,4.74,1.15],[0,5.48,1.15],[2.60,4.74,1.15]],detail);
 // Fine pediment drafting lines and restrained frieze divisions.
 for(let i=-4;i<=4;i++){const x=i*.48;line([[0,5.44,1.155],[x,4.76,1.155]],detail);}
 for(let i=-5;i<=5;i++){if(Math.abs(i)<2)continue;line([[i*.46,4.08,1.05],[i*.46,4.33,1.05]],detail);}
 root.userData.materials=[edge,detail];root.userData.baseOpacity=[1,.72];
 return root;
}

window.createInstitution=institution;
const views=[];
window.mountInstitution=function(host){
 const renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2.5));renderer.setClearColor(0x004df4,0);host.append(renderer.domElement);
 const scene=new T.Scene(),model=institution();scene.add(model);const name=document.createElement('span');name.className='model-name';name.textContent='SHIELDTX';host.append(name);const camera=new T.OrthographicCamera(-4.3,4.3,3.7,-3.7,.1,100);camera.position.set(2.8,5.3,30);camera.lookAt(0,2.8,0);
 function render(){let r=host.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);let a=r.width/r.height,w=Math.max(8.4,6.6*a);camera.left=-w/2;camera.right=w/2;camera.top=w/a/2;camera.bottom=-w/a/2;camera.updateProjectionMatrix();const label=new T.Vector3(0,4.20,1.075).project(camera);name.style.left=(label.x*.5+.5)*100+'%';name.style.top=(-label.y*.5+.5)*100+'%';renderer.render(scene,camera)}new ResizeObserver(render).observe(host);render();views.push({host,renderer,scene,camera,model,render});return views.at(-1)};
window.institutionViews=views;document.querySelectorAll('.model').forEach(window.mountInstitution);
})();