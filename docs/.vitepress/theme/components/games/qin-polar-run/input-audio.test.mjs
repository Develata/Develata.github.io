/** Execute real adapters with deterministic browser stand-ins, using only Node built-ins. */
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {stripTypeScriptTypes} from 'node:module'
import {test} from 'node:test'
import {createContext,SourceTextModule,SyntheticModule} from 'node:vm'
async function moduleAt(file, globals={}) {
  const context=createContext(globals)
  const host=new SyntheticModule(['withBase'],function(){this.setExport('withBase',s=>s)},{context})
  const config=new SourceTextModule(stripTypeScriptTypes(readFileSync(new URL('./config.ts',import.meta.url),'utf8')),{context})
  await config.link(()=>{});await config.evaluate()
  const module=new SourceTextModule(stripTypeScriptTypes(readFileSync(new URL(file,import.meta.url),'utf8'),{mode:'transform'}),{context})
  await module.link(name=>name==='vitepress'?host:config);await module.evaluate()
  return module.namespace
}
class Surface {
  listeners=new Map();clientWidth=390
  addEventListener(name,handler){this.listeners.set(name,handler)}
  removeEventListener(name){this.listeners.delete(name)}
  focus(){}
  setPointerCapture(){}
  closest(){return null}
  send(name,event){this.listeners.get(name)?.({...event,type:name,target:this,preventDefault(){}})}
}
test('double taps boost; swipes, diagonal gestures, cancellation and stale taps do not',async()=>{
  const {InputController}=await moduleAt('./input/InputController.ts')
  const surface=new Surface(),input=new InputController(surface,()=>true,()=>{})
  const pointer=(name,x,y,time)=>surface.send(name,{isPrimary:true,button:0,pointerId:1,clientX:x,clientY:y,timeStamp:time})
  const tap=time=>{pointer('pointerdown',100,100,time);pointer('pointerup',100,100,time+30);pointer('lostpointercapture',100,100,time+31)}
  tap(0);assert.equal(input.read(),0);tap(150);assert.equal(input.read(),16)
  tap(500);pointer('pointerdown',100,100,620);pointer('pointerup',200,100,750)
  assert.equal(input.read(),2);tap(820);assert.equal(input.read(),0)
  input.clear();pointer('pointerdown',100,100,1000);pointer('pointerup',200,190,1100)
  assert.equal(input.read(),0)
  tap(1300);surface.send('pointercancel',{});tap(1450);assert.equal(input.read(),0)
  input.clear();tap(2000);tap(2500);assert.equal(input.read(),0)
  input.dispose();assert.equal(surface.listeners.size,0)
})
test('both Shift keys and E map to semantic BOOST; repeats and modifiers are ignored',async()=>{
  const {InputController}=await moduleAt('./input/InputController.ts')
  const surface=new Surface(),input=new InputController(surface,()=>true,()=>{})
  for(const code of ['ShiftLeft','ShiftRight','KeyE']) {surface.send('keydown',{code});assert.equal(input.read(),16)}
  surface.send('keydown',{code:'KeyE',repeat:true});assert.equal(input.read(),0)
  surface.send('keydown',{code:'KeyE',ctrlKey:true});assert.equal(input.read(),0)
  input.dispose()
})
test('audio is lazy, reused, paused, muted, restarted and detached on disposal',async()=>{
  const instances=[]
  class Audio {
    paused=true;currentTime=0;playbackRate=1
    constructor(src){this.src=src;instances.push(this)}
    play(){this.paused=false;return Promise.resolve()}
    pause(){this.paused=true}
    removeAttribute(){this.src=''}
    load(){this.loaded=true}
  }
  const {GameAudio}=await moduleAt('./audio/GameAudio.ts',{Audio})
  const music=new GameAudio();assert.equal(instances.length,0)
  music.start();assert.equal(instances.length,1)
  const audio=instances[0];assert.equal(audio.volume,0.4);assert.equal(audio.loop,true);assert.equal(audio.paused,false)
  music.setMuted(true);assert.equal(audio.muted,true)
  audio.currentTime=5;music.pause();assert.equal(audio.paused,true)
  music.resume();assert.equal(audio.currentTime,5);assert.equal(audio.paused,false)
  music.stop();assert.equal(audio.currentTime,0);assert.equal(audio.paused,true)
  music.start();assert.equal(instances.length,1);assert.equal(audio.playbackRate,1)
  music.dispose();assert.equal(audio.paused,true);assert.equal(audio.src,'');assert.equal(audio.loaded,true)
})
test('rejected audio play remains nonfatal',async()=>{
  class Audio {currentTime=0;play(){return Promise.reject(new Error('blocked'))}pause(){}removeAttribute(){}load(){}}
  const {GameAudio}=await moduleAt('./audio/GameAudio.ts',{Audio})
  const music=new GameAudio();music.start();await Promise.resolve();music.pause();music.dispose()
})
