import type { Metadata } from 'next';
import LiveBoard from '../../live-board';
import { requireChatGPTUser } from '../../chatgpt-auth';
import { runPath } from '@/lib/board';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Project workspace · Session Studio', robots: { index: false, follow: false } };
// Opened from the session runner (?from=run&session=…), the back arrow returns to the runner.
export default async function Page({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}) { const {id}=await params;await requireChatGPTUser(`/board/${id}`);const {from,session}=await searchParams;return <LiveBoard id={id} backToRun={from==='run'?runPath(id,typeof session==='string'&&session?session:undefined):undefined}/>; }
