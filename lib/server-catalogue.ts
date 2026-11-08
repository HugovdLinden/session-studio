import { env } from 'cloudflare:workers';
import { allSourceMethods, withDemoRatings, withFacilitatorEstimates } from './catalogue';
import type { Method, Ratings } from './types';
export function database() { if(!env.DB)throw new Error('The method library is temporarily unavailable. Your draft is preserved.');return env.DB; }
export async function readCatalogue(demo=false):Promise<Method[]> {
 const result=await database().prepare('SELECT method_id, metadata, revision FROM method_metadata').all<{method_id:string;metadata:string;revision:number}>();
 const rows=new Map(result.results.map(r=>[r.method_id,r]));
 const methods=allSourceMethods.map(m=>{const row=rows.get(m.id);return row?{...m,...JSON.parse(row.metadata),revision:row.revision,metadataOrigin:'user' as const}:m;});
 return demo?withDemoRatings(methods):withFacilitatorEstimates(methods);
}
export async function saveMetadata(id:string,ratings:Ratings,revision:number) {
 const m=allSourceMethods.find(x=>x.id===id);if(!m)throw new Error('Unknown method.');
 if(m.knownMin!==undefined&&(ratings.minParticipants!==m.knownMin||ratings.maxParticipants!==m.knownMax))throw new Error('Preserve the participant limits specified by the source.');
 const db=database();const stamp=new Date().toISOString();
 const statement=revision===0?db.prepare('INSERT INTO method_metadata (method_id,metadata,revision,updated_at) VALUES (?,?,1,?) ON CONFLICT(method_id) DO NOTHING').bind(id,JSON.stringify(ratings),stamp):db.prepare('UPDATE method_metadata SET metadata=?,revision=revision+1,updated_at=? WHERE method_id=? AND revision=?').bind(JSON.stringify(ratings),stamp,id,revision);
 const result=await statement.run();if(result.meta.changes!==1)throw new Error('This record changed elsewhere. Reload the library before saving again.');
 return {revision:revision+1};
}
