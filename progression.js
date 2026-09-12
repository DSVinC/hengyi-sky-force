'use strict';
let stageTransition = null;
const stageNames=['地球近轨道','小行星带','红色前哨基地','空间站外围','虚空裂隙','战损舰队','离子风暴','虫群母巢','最终防线','最终决战'];
const reduceStageMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
function beginStageTransition() {
  if (state !== 1) return;
  stageTransition={from:level,to:Math.min(10,level+1),elapsed:0,duration:reduceStageMotion?1000:3000,
    startX:p.x,startY:p.y,final:level===10};
  state=5;eb=[];bullets=[];playerMissiles=[];touch=false;activePointerId=null;keys={};
  missileCD=0;shake=0;
}
function advanceStageTransition(dt) {
  if (!stageTransition) return;
  const t=stageTransition;
  t.elapsed=Math.min(t.duration,t.elapsed+Math.max(0,dt));
  const f=t.elapsed/t.duration,ease=1-Math.pow(1-f,3);
  p.x=t.startX+(W/2-t.startX)*ease;
  p.y=t.startY+(H*.7-t.startY)*ease;p.bank=0;
  items=items.filter(i=>{
    const pull=1-Math.exp(-Math.max(0,dt)/110);
    i.x+=(p.x-i.x)*pull;i.y+=(p.y-i.y)*pull;
    if(D(i,p)<27||f===1){collect(i);return false;}return true;
  });
  parts.forEach(q=>q.l--);parts=parts.filter(q=>q.l>0);
  if(f<1)return;
  if(t.final){state=4;stageTransition=null;musicSync();return;}
  level=t.to;clear();prepare();p.x=W/2;p.y=H*.7;inv=90;state=1;stageTransition=null;musicSync();
}
function stageBlend() {
  if(!stageTransition||stageTransition.final)return 0;
  const v=C((stageTransition.elapsed/stageTransition.duration-.18)/.65,0,1);
  return v*v*(3-2*v);
}
function drawBackgroundPanel(stage) {
  if(!bgSheet.complete||!bgSheet.naturalWidth)return false;
  const cellW=bgSheet.naturalWidth/bgCols,cellH=bgSheet.naturalHeight/bgRows;
  const index=C(stage-1,0,9),col=index%bgCols,row=Math.floor(index/bgCols);
  x.drawImage(bgSheet,col*cellW+3,row*cellH+cellH*bgCropTop,cellW-6,cellH*(1-bgCropTop)-3,0,0,W,H);
  return true;
}
function drawStageTransition() {
  if(!stageTransition)return;
  const t=stageTransition,f=t.elapsed/t.duration;
  x.save();
  if(!reduceStageMotion){
    x.strokeStyle='#bdeaff';x.globalAlpha=Math.sin(f*Math.PI)*.3;x.lineWidth=1.4;
    for(let i=0;i<20;i++){const sx=(i*137)%W,sy=(frame*(7+i%4)+i*83)%H;x.beginPath();x.moveTo(sx,sy);x.lineTo(sx,sy+30+40*Math.sin(f*Math.PI));x.stroke();}
    x.globalAlpha=.75;x.fillStyle='#7ddfff';x.beginPath();x.moveTo(p.x-8,p.y+22);x.lineTo(p.x,p.y+55+22*Math.sin(f*Math.PI));x.lineTo(p.x+8,p.y+22);x.fill();
  }
  x.globalAlpha=1;
  const label=t.final?'任务完成':f<.4?`第 ${t.from} 关完成`:`第 ${t.to} 关 · ${stageNames[t.to-1]}`;
  x.fillStyle='#031226c9';x.beginPath();x.roundRect(35,270,410,90,18);x.fill();
  x.textAlign='center';x.fillStyle='#c7f6ff';x.font='bold 25px sans-serif';x.fillText(label,W/2,306);
  x.fillStyle='#dceaff';x.font='14px sans-serif';x.fillText(t.final?'正在汇总任务成果':'正在飞往下一战区',W/2,334);
  x.restore();
}
