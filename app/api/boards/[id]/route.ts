import { NextResponse } from 'next/server';
import { boardErrorResponse, readBoard, readItems, readTemplates } from '@/lib/board-server';
import { member } from '@/lib/server-access';
export const dynamic='force-dynamic';
// ?meta=1 skips items and templates so phones only download the section list.
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
 try{await member();const {id}=await params;const board=await readBoard(id);const meta=new URL(request.url).searchParams.has('meta');const [items,templates]=meta?[[],[]]:await Promise.all([readItems(id),readTemplates(id)]);return NextResponse.json({board,items,templates},{headers:{'Cache-Control':'no-store'}});}
 catch(e){return boardErrorResponse(e,'The board could not load. Retrying…');}
}
