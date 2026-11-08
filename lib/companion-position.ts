export type PetPosition={x:number;y:number};
export type PanelRect={left:number;top:number;width:number;height:number};
export type PanelCorner='nw'|'ne'|'sw'|'se';
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
export function clampPanel(rect:PanelRect,width:number,height:number):PanelRect{
 const maxW=Math.max(1,width-24),maxH=Math.max(1,height-24);
 const w=clamp(rect.width,Math.min(280,maxW),maxW),h=clamp(rect.height,Math.min(240,maxH),maxH);
 return{left:clamp(rect.left,12,Math.max(12,width-12-w)),top:clamp(rect.top,12,Math.max(12,height-12-h)),width:w,height:h};
}
export function resizePanel(rect:PanelRect,corner:PanelCorner,dx:number,dy:number,width:number,height:number):PanelRect{
 const start=clampPanel(rect,width,height),minW=Math.min(280,Math.max(1,width-24)),minH=Math.min(240,Math.max(1,height-24));
 let left=start.left,top=start.top,right=left+start.width,bottom=top+start.height;
 if(corner.includes('w'))left=clamp(left+dx,12,right-minW);else right=clamp(right+dx,left+minW,width-12);
 if(corner.includes('n'))top=clamp(top+dy,12,bottom-minH);else bottom=clamp(bottom+dy,top+minH,height-12);
 return{left,top,width:right-left,height:bottom-top};
}
export const petSize={width:96,height:128};
export function petLayout(width:number,height:number,position:PetPosition,viewportTop=0,viewportHeight=height){
 const margin=12,w=Math.max(0,width-petSize.width-margin*2),h=Math.max(0,height-petSize.height-margin*2);
 const x=margin+Math.max(0,Math.min(1,position.x))*w,y=margin+Math.max(0,Math.min(1,position.y))*h;
 const down=viewportTop+y+petSize.height/2<viewportHeight/2;
 const panelWidth=Math.min(420,Math.max(120,width-margin*2));
 const panelX=Math.max(margin,Math.min(width-margin-panelWidth,x+petSize.width/2>width/2?x+petSize.width-panelWidth:x));
 const panelHeight=Math.max(60,down?height-y-petSize.height-margin-8:y-margin-8);
 return{x,y,down,panelWidth,panelLeft:panelX-x,panelHeight};
}
export function normalizePet(x:number,y:number,width:number,height:number):PetPosition{return{x:Math.max(0,Math.min(1,(x-12)/Math.max(1,width-petSize.width-24))),y:Math.max(0,Math.min(1,(y-12)/Math.max(1,height-petSize.height-24)))};}
