export const env:Record<string,any>={};
let identity=new Headers();
export function setIdentity(email?:string){identity=new Headers(email?{'oai-authenticated-user-id':email,'oai-authenticated-user-email':email}:{});}
export async function headers(){return identity;}
export function redirect(url:string):never {throw new Error(`redirect:${url}`);}

export const NextResponse=Response;
