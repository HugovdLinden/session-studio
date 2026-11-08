import { NextResponse } from 'next/server';
import { limits } from '@/lib/board';
import { addItem, boardErrorResponse } from '@/lib/board-server';
import { checkMutation, member } from '@/lib/server-access';
export const dynamic='force-dynamic';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}) {
 try{await member();checkMutation(request);
  const {id}=await params;const form=await request.formData();const field=(k:string)=>{const v=form.get(k);return typeof v==='string'?v:'';};
  const kind=field('kind');if(kind!=='photo'&&kind!=='note'&&kind!=='file')return NextResponse.json({error:'Choose a photo, a note or a PDF.'},{status:400});
  const text=field('text'),author=field('author');if(text.length>limits.text||author.length>limits.author)return NextResponse.json({error:'The note or name is too long.'},{status:400});
  const file=form.get('file');
  const item=await addItem(id,{sectionId:field('section'),kind,text,author,file:file instanceof File?file:undefined,width:Number(field('width')),height:Number(field('height'))});
  return NextResponse.json(item,{status:201});
 }catch(e){return boardErrorResponse(e,'The upload did not finish. Please retry.');}
}
