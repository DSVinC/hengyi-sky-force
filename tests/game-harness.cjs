const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function setup(){
 let draws=0,fills=0,depth=0;const rotations=[],captures=[];
 const gradient={addColorStop(){}};
 const context=new Proxy({save(){depth++;},restore(){depth--;},rotate(a){rotations.push(a);},drawImage(){draws++;},fill(){fills++;},createLinearGradient(){return gradient;},createRadialGradient(){return gradient;}},{get(t,k){return k in t?t[k]:()=>{};}});
 function target(){return {events:{},style:{},setAttribute(k,v){this[k]=v;},addEventListener(k,fn){(this.events[k]??=[]).push(fn);}};}
 const canvas=Object.assign(target(),{getContext(){return context;},setPointerCapture(id){captures.push(id);},getBoundingClientRect(){return {left:0,top:0,width:480,height:800};}});
 const music=target(),bomb=target(),window=target();
 class Image{constructor(){this.complete=false;this.naturalWidth=0;this.naturalHeight=0;}}
 class Audio{play(){return Promise.resolve();}pause(){}}
 const sandbox={Image,Audio,console,Math:Object.create(Math),innerWidth:480,innerHeight:800,document:{querySelector:s=>s==='#g'?canvas:s==='#bomb-control'?bomb:music,createElement:()=>({...canvas})},addEventListener:window.addEventListener.bind(window),requestAnimationFrame(){}};
 vm.createContext(sandbox);
 for(const file of ['combat.js','progression.js','aircraft.js','pickups.js','mobile-controls.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox);
 const game=fs.readFileSync(path.join(root,'index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];vm.runInContext(game,sandbox);
 return {run:s=>vm.runInContext(s,sandbox),bomb,stats:()=>({draws,fills,depth,rotations:[...rotations],captures:[...captures]}),dispatch(where,type,data={}){const t={canvas,bomb,window}[where];const e={pointerId:1,clientX:240,clientY:680,button:0,detail:1,preventDefault(){},stopPropagation(){},...data};if(t['on'+type])t['on'+type](e);for(const fn of t.events[type]||[])fn(e);}};
}
module.exports={setup,root};
