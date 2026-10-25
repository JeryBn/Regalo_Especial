import * as THREE from 'three';

// Procedural light, dust lanes and a stellar bulge; no remote image assets.
export function createGalaxy(index, random, makePoints, mobile) {
  const group=new THREE.Group(),size=34+random()*24;
  const palettes=[['#fff0d8','#9cafd0'],['#ffe8c5','#b9a6bf'],['#fff3e0','#8ca9ba'],['#fff0db','#a6a5cb']];
  const inner=new THREE.Color(palettes[index%4][0]),outer=new THREE.Color(palettes[index%4][1]);
  const arms=2+index%2,twist=4.5+random()*1.5;
  const image=document.createElement('canvas');image.width=512;image.height=512;
  const ctx=image.getContext('2d'),center=256;
  const halo=ctx.createRadialGradient(center,center,0,center,center,250);
  halo.addColorStop(0,'rgba(255,228,189,.75)');halo.addColorStop(.12,'rgba(220,197,170,.3)');halo.addColorStop(.4,'rgba(140,151,185,.07)');halo.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=halo;ctx.fillRect(0,0,512,512);
  const color=outer.getStyle();
  for(let i=0;i<8500;i++) {const r=Math.pow(random(),.65)*238,a=(i%arms)/arms*Math.PI*2+r/238*twist,scatter=(random()-.5)*(.25+r/238*.65),x=center+Math.cos(a+scatter)*r,y=center+Math.sin(a+scatter)*r;
    ctx.globalAlpha=(1-r/260)*(.0015+random()*.004);ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,2+random()*7,0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha=1;
  // Branching dust lanes interrupt the luminous arms instead of forming perfect rings.
  ctx.globalCompositeOperation='destination-out';
  for(let arm=0;arm<arms;arm++){ctx.strokeStyle='rgba(0,0,0,.5)';ctx.lineWidth=3.2;ctx.beginPath();for(let r=36;r<238;r+=2){const a=arm/arms*Math.PI*2+r/238*twist+.08+Math.sin(r*.12)*.025,x=center+Math.cos(a)*r,y=center+Math.sin(a)*r;r===36?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();}
  ctx.globalCompositeOperation='source-over';const bulge=ctx.createRadialGradient(center,center,0,center,center,72);bulge.addColorStop(0,'rgba(255,249,229,.95)');bulge.addColorStop(.12,'rgba(255,232,194,.8)');bulge.addColorStop(.4,'rgba(244,210,166,.3)');bulge.addColorStop(1,'rgba(230,196,155,0)');ctx.fillStyle=bulge;ctx.fillRect(175,175,162,162);
  const texture=new THREE.CanvasTexture(image);texture.colorSpace=THREE.SRGBColorSpace;
  const disk=new THREE.Mesh(new THREE.PlaneGeometry(size*2.3,size*2.3),new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:.55,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));disk.rotation.x=-Math.PI/2;group.add(disk);
  const positions=[],colors=[],sizes=[],count=mobile?4500:10500;
  for(let i=0;i<count;i++){let r,a,y;const core=random()<.22;
    if(core){r=Math.pow(random(),1.7)*size*.25;a=random()*Math.PI*2;y=(random()-.5)*size*.18*(1-r/(size*.3));}
    else {r=Math.pow(random(),.7)*size;a=(i%arms)/arms*Math.PI*2+r/size*twist+(random()-.5)*(.25+r/size*.7);y=(random()-.5)*size*.045;}
    const radialNoise=1+(random()-.5)*.1;positions.push(Math.cos(a)*r*radialNoise,y,Math.sin(a)*r*radialNoise);
    const c=inner.clone().lerp(outer,Math.min(1,r/size*1.4)),b=.25+random()*.4;colors.push(c.r*b,c.g*b,c.b*b);sizes.push((.12+random()*.3)*(random()<.015?2.5:1));}
  group.add(makePoints(positions,colors,sizes));
  const haloStars=[],haloColors=[],haloSizes=[];
  for(let i=0;i<(mobile?300:700);i++){const a=random()*Math.PI*2,v=Math.acos(random()*2-1),r=size*(.3+random()*.8);haloStars.push(Math.sin(v)*Math.cos(a)*r,Math.cos(v)*r*.4,Math.sin(v)*Math.sin(a)*r);haloColors.push(.7,.68,.62);haloSizes.push(.12+random()*.18);}group.add(makePoints(haloStars,haloColors,haloSizes));
  group.rotation.set((random()-.5)*2.5,random()*6.28,(random()-.5)*2.2);
  return {group,size,speed:(index%2?1:-1)*(.003+random()*.004)};
}

