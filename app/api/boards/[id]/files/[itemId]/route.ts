import { boardErrorResponse, readFile } from '@/lib/board-server';
import { member } from '@/lib/server-access';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{id:string;itemId:string}>}) {
 try{await member();const {id,itemId}=await params;const file=await readFile(id,itemId);
 // Documents download rather than render inside the site.
 const disposition=file.contentType.startsWith('image/')?'inline':`attachment; filename*=UTF-8''${encodeURIComponent(file.fileName??'document.pdf')}`;
 return new Response(file.body,{headers:{'Content-Type':file.contentType,'Content-Disposition':disposition,'Cache-Control':'private, max-age=31536000, immutable','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'"}});}
 catch(e){return boardErrorResponse(e,'The photo could not load.');}
}
