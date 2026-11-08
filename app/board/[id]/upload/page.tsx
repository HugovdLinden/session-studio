import type { Metadata } from 'next';
import BoardUpload from '../../../board-upload';
import { requireChatGPTUser } from '../../../chatgpt-auth';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Add to the workspace · Session Studio', robots: { index: false, follow: false } };
// Phones also sign in through the Site; only people on the existing access list can upload.
export default async function Page({params}:{params:Promise<{id:string}>}) { const {id}=await params;await requireChatGPTUser(`/board/${id}/upload`);return <BoardUpload id={id}/>; }
