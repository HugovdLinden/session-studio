import type { Metadata } from 'next';
import SessionRunner from '../../../session-runner';
import { requireChatGPTUser } from '../../../chatgpt-auth';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Run session · Session Studio', robots: { index: false, follow: false } };
export default async function Page({params}:{params:Promise<{id:string}>}) { const {id}=await params;const user=await requireChatGPTUser(`/board/${id}/run`);return <SessionRunner id={id} storageScope={user.userId}/>; }
