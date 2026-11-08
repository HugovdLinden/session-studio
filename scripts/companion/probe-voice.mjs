// Account/capability check only. No audio capture, new conversation or paid API call.
import {CodexConnection,subscriptionAccount,includedAllowance} from './protocol.mjs';
import {readFile} from 'node:fs/promises';
const connection=new CodexConnection({cwd:process.cwd(),realtime:true});
let probeThread;
try{
 await connection.start();
 const account=subscriptionAccount((await connection.request('account/read',{refreshToken:false})).account);
 const allowance=includedAllowance(await connection.request('account/rateLimits/read'));
 const result=await connection.request('thread/realtime/listVoices',{});
 const offerFile=process.argv[2];
 if(!offerFile)console.log(JSON.stringify({account:account.plan,billing:account.billing,allowance,voices:result.voices,voiceSessionStarted:false}));
 else{
  const sdp=await readFile(offerFile,'utf8');if(!sdp.startsWith('v=0')||sdp.length>64000)throw new Error('Invalid test offer');
  probeThread=(await connection.request('thread/start',{cwd:process.cwd(),approvalPolicy:'never',sandbox:'read-only',developerInstructions:'This is a microphone-free voice connection check. Do not run tools or start work.'})).thread.id;
  let listener,timer;const handshake=new Promise((resolve,reject)=>{timer=setTimeout(()=>reject(new Error('No voice SDP answer was received within 25 seconds.')),25000);listener=event=>{if(event.params?.threadId!==probeThread)return;if(event.method==='thread/realtime/sdp')resolve({sdpAnswerReceived:true});if(event.method==='thread/realtime/error')reject(new Error(event.params.message));};connection.listeners.add(listener);});handshake.catch(()=>{});
  try{await connection.request('thread/realtime/start',{threadId:probeThread,version:'v3',outputModality:'audio',transport:{type:'webrtc',sdp},voiceSessionId:crypto.randomUUID(),includeStartupContext:false,clientManagedHandoffs:true,flushTranscriptTailOnSessionEnd:false,prompt:'This is a transport check. No microphone audio is supplied. Do not speak or delegate work.'});const connected=await handshake;console.log(JSON.stringify({account:account.plan,billing:account.billing,...connected,microphoneUsed:false}));}finally{clearTimeout(timer);connection.listeners.delete(listener);}
 }
}catch(error){console.log(JSON.stringify({available:false,error:error.message,voiceSessionStarted:false,paidFallback:false}));process.exitCode=1;}
finally{if(probeThread){try{await connection.request('thread/realtime/stop',{threadId:probeThread});}catch{}try{await connection.request('thread/archive',{threadId:probeThread});}catch{}}connection.stop();}
