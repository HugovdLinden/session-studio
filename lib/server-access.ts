import { getChatGPTUser } from '../app/chatgpt-auth';
export class HttpError extends Error { constructor(public status:number,message:string){super(message);} }
// Sites enforces Sam's existing visitor access list before forwarding requests.
export async function member(){const user=await getChatGPTUser();if(!user)throw new HttpError(401,'Sign in with your existing Site access.');return user;}
export function checkMutation(request:Request){const origin=request.headers.get('origin');if(!origin||origin!==new URL(request.url).origin)throw new HttpError(403,'Open Session Studio to make changes.');}
export function apiError(e:unknown){return Response.json({error:e instanceof Error?e.message:'The request failed.'},{status:e instanceof HttpError?e.status:400,headers:{'Cache-Control':'no-store'}});}
