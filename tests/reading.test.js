import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createDustWish} from '../src/dust-wish.js';
import {paginateMessage} from '../src/message-layout.js';
import {loadReadGalaxies} from '../src/progress.js';
const messages=JSON.parse(fs.readFileSync(new URL('../src/wishes.json',import.meta.url)));
const data=new Map();
globalThis.localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v))};
globalThis.window={innerWidth:390};
globalThis.document={createElement:()=>({getContext:()=>({measureText:s=>({width:s.length*24}),fillText(){},getImageData:()=>({data:new Uint8ClampedArray(1000*240*4)})})})};
function setup(){
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(58,1,.03,18000);camera.position.z=24;camera.updateMatrixWorld();
  let state=null, completions=[];
  const wish=createDustWish(scene,()=>{},id=>completions.push(id),value=>{state=value;});
  const tick=(seconds=4)=>{for(let i=0;i<seconds*60;i++)wish.update(1/60,camera,1);};
  return {wish,tick,state:()=>state,completions,scene};
}
test('los 21 textos conservan todas sus palabras y caben en tres líneas por fragmento',()=>{
  assert.equal(messages.length,21);
  for(const width of [620,860])for(const text of messages){
    const pages=paginateMessage(text,s=>s.length*24,width);
    assert.equal(pages.flat().join(' '),text.trim().replace(/\s+/g,' '));
    for(const page of pages){assert.ok(page.length<=3);for(const line of page)assert.ok(line.length*24<=width);}
  }
});
test('lectura manual, límites, bloqueo de clics rápidos y confirmación solo al final',()=>{
  data.clear();const app=setup();app.wish.set(0,messages[0]);app.tick();
  assert.equal(app.state().index,0);assert.equal(app.state().ready,true);
  app.tick(90);assert.equal(app.state().index,0);assert.equal(app.completions.length,0);
  app.wish.page(-1);assert.equal(app.state().index,0);
  app.wish.page(0);assert.equal(app.completions.length,0);
  app.wish.page(1);app.wish.page(1);app.tick();assert.equal(app.state().index,1);
  app.wish.page(-1);app.tick();assert.equal(app.state().index,0);
  while(app.state().index<app.state().total-1){app.wish.page(1);app.tick();}
  app.wish.page(1);assert.equal(app.state().index,app.state().total-1);
  app.wish.page(0);app.wish.page(0);assert.deepEqual(app.completions,[0]);app.wish.dispose();assert.equal(app.scene.children.length,0);
});
test('ida y vuelta guarda fragmentos por galaxia y los restaura al recrear la escena',()=>{
  data.clear();const app=setup();app.wish.set(0,messages[0]);app.tick();app.wish.page(1);app.tick();
  app.wish.set(null,'');assert.equal(app.state(),null);
  app.wish.set(1,messages[1]);app.tick();app.wish.page(1);app.tick();app.wish.page(1);app.tick();
  app.wish.set(0,messages[0]);app.tick();assert.equal(app.state().index,1);
  app.wish.set(1,messages[1]);app.tick();assert.equal(app.state().index,2);app.wish.dispose();
  const reloaded=setup();reloaded.wish.set(1,messages[1]);reloaded.tick();assert.equal(reloaded.state().index,2);reloaded.wish.dispose();
});
test('datos guardados incorrectos no rompen el progreso ni la lectura',()=>{
  data.set('universo21-read','[0,0,20,21,-1,"2",null]');assert.deepEqual(loadReadGalaxies(),[0,20]);
  data.set('universo21-read','{broken');assert.deepEqual(loadReadGalaxies(),[]);
  data.set('universo21-fragments','{"0":9999}');const app=setup();app.wish.set(0,messages[0]);app.tick();assert.equal(app.state().index,app.state().total-1);app.wish.dispose();
});
test('los 21 mensajes se pueden completar una sola vez sin perder el orden',()=>{
  data.clear();const app=setup();
  for(let i=0;i<messages.length;i++){
    app.wish.set(i,messages[i]);app.tick();
    while(app.state().index<app.state().total-1){app.wish.page(1);app.tick();}
    app.wish.page(0);app.wish.page(0);
  }
  assert.deepEqual(app.completions,Array.from({length:21},(_,i)=>i));app.wish.dispose();
});
