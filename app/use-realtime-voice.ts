'use client';
import {useEffect,useRef,useState} from 'react';
import {microphoneConstraints} from '@/lib/companion-voice';
import type {GerdContext} from './gerd';
type Phase='off'|'checking'|'connecting'|'listening'|'thinking'|'speaking'|'muted';
type VoiceOptions={voices:string[];defaultVoice:string;billing:string};
type VoiceEvent={type:string;sessionId?:string;sdp?:string;message?:string;role?:string;text?:string;reply?:unknown};
type VoiceCall={peer:RTCPeerConnection;stream:MediaStream|null;audio:HTMLAudioElement;abort:AbortController;sessionId:string;generation:number;testOnly:boolean;timer?:ReturnType<typeof setTimeout>;contextTimer?:ReturnType<typeof setInterval>;observer?:MutationObserver;inputListener?:()=>void;channel?:RTCDataChannel};
type Props={token?:string;configured:boolean;microphone:string;getContext:()=>GerdContext;onTranscript:(role:'user'|'assistant',text:string)=>void;onWork:(reply:unknown,message:string)=>void;onError:(message:string)=>void};
export function useRealtimeVoice(props:Props){
 const callbacks=useRef(props);callbacks.current=props;
 const [phase,setPhase]=useState<Phase>('off'),[voices,setVoices]=useState<string[]>([]),[voice,setVoice]=useState(''),[muted,setMuted]=useState(false),[outputMuted,setOutputMuted]=useState(false),[liveText,setLiveText]=useState(''),[testOnly,setTestOnly]=useState(false);
 const live=useRef<VoiceCall|null>(null);
 const [audioReceived,setAudioReceived]=useState(false);
 const mounted=useRef(true),counter=useRef(0),busy=useRef(false),dirty=useRef(false),selected=useRef(''),micMuted=useRef(false),speakerMuted=useRef(false);
 selected.current=voice;
 async function post(body:unknown,signal?:AbortSignal){const response=await fetch('/api/gerd',{method:'POST',headers:{'Content-Type':'application/json','X-Companion-Token':callbacks.current.token||''},body:JSON.stringify(body),signal});const data=await response.json() as Record<string,unknown>;if(!response.ok)throw new Error(String(data.error||'The voice connection could not be updated.'));return data;}
 async function loadOptions(){if(!callbacks.current.configured)throw new Error('Reconnect assistant before loading conversation voices. You can still select and test your microphone.');const data=await post({action:'voice_options'}) as VoiceOptions;if(data.billing!=='subscription-only')throw new Error('Subscription voice could not be verified.');if(mounted.current){setVoices(data.voices);if(!selected.current){selected.current=data.defaultVoice;setVoice(data.defaultVoice);}}return data;}
 function release(){const call=live.current;live.current=null;counter.current++;busy.current=false;if(!call)return;clearTimeout(call.timer);clearInterval(call.contextTimer);call.observer?.disconnect();if(call.inputListener){document.removeEventListener('input',call.inputListener,true);document.removeEventListener('click',call.inputListener,true);}call.abort.abort();call.channel?.close();call.stream?.getTracks().forEach(track=>track.stop());call.peer.close();call.audio.pause();call.audio.srcObject=null;}
 async function stop(){const id=live.current?.sessionId;release();if(mounted.current){setPhase('off');setLiveText('');setTestOnly(false);setMuted(false);setOutputMuted(false);}micMuted.current=false;speakerMuted.current=false;if(id)try{await post({action:'voice_stop',sessionId:id},AbortSignal.timeout(4000));}catch{}}
 function fail(message:string){callbacks.current.onError(message);void stop();}
 useEffect(()=>{mounted.current=true;try{const stored=localStorage.getItem('studio-companion-realtime-voice');if(stored){selected.current=stored;setVoice(stored);}}catch{}return()=>{mounted.current=false;const id=live.current?.sessionId;release();if(id)void post({action:'voice_stop',sessionId:id},AbortSignal.timeout(3000)).catch(()=>{});};},[]);
 function selectVoice(value:string){setVoice(value);selected.current=value;try{localStorage.setItem('studio-companion-realtime-voice',value);}catch{}}
 async function updateContext(force=false){const call=live.current;if(!call?.sessionId||busy.current||(!force&&!dirty.current))return;dirty.current=false;const context=callbacks.current.getContext();await post({action:'voice_context',sessionId:call.sessionId,context});}
 async function handle(call:VoiceCall,event:VoiceEvent){
  if(live.current!==call)return;
  if(event.type==='voice_ready'){
   call.sessionId=event.sessionId!;await call.peer.setRemoteDescription({type:'answer',sdp:event.sdp!});if(!call.testOnly)await updateContext(true);
   if(live.current!==call)return;
   call.stream?.getAudioTracks().forEach(track=>{track.enabled=!micMuted.current;});
   if(call.peer.connectionState==='connected'){clearTimeout(call.timer);setPhase(micMuted.current?'muted':'listening');}
   call.inputListener=()=>{dirty.current=true;};document.addEventListener('input',call.inputListener,true);document.addEventListener('click',call.inputListener,true);
   call.observer=new MutationObserver(records=>{if(records.some(record=>{const el=record.target instanceof Element?record.target:record.target.parentElement;return !el?.closest('[data-companion-root]');}))dirty.current=true;});call.observer.observe(document.body,{childList:true,subtree:true});
   call.contextTimer=setInterval(()=>{if(!call.testOnly)void updateContext().catch(()=>{});void call.peer.getStats().then(stats=>{if(live.current!==call)return;stats.forEach(report=>{if(report.type==='inbound-rtp'&&(report.kind==='audio'||report.mediaType==='audio')&&report.bytesReceived>0)setAudioReceived(true);});}).catch(()=>{});},1200);
   if(call.testOnly)await post({action:'voice_test',sessionId:call.sessionId});
   return;
  }
  if(event.type==='voice_error'){fail(event.message||'Voice connection failed. Text chat remains available.');return;}
  if(event.type==='voice_closed'){await stop();if(event.message)callbacks.current.onError(event.message);return;}
  if(event.type==='voice_transcript_delta'){setLiveText(previous=>previous+(event.text||''));if(event.role==='assistant')setPhase('speaking');return;}
  if(event.type==='voice_transcript'){setLiveText('');if(event.role==='user'||event.role==='assistant')callbacks.current.onTranscript(event.role,event.text||'');if(event.role==='assistant'&&!busy.current)setPhase(micMuted.current?'muted':'listening');return;}
  if(event.type==='voice_thinking'){busy.current=true;call.stream?.getAudioTracks().forEach(track=>{track.enabled=false;});setPhase('thinking');return;}
  if(event.type==='voice_work'){busy.current=true;call.stream?.getAudioTracks().forEach(track=>{track.enabled=false;});setPhase('thinking');callbacks.current.onWork(event.reply,event.message||'');return;}
  if(event.type==='voice_work_error'){busy.current=false;callbacks.current.onError(event.message||'The website request could not be validated.');await reportResult(event.message||'No website change was applied.');}
 }
 async function start({connectionTest=false}={}){
  if(live.current)return;if(!callbacks.current.configured){callbacks.current.onError('Connect the local companion before starting voice.');return;}
  if(!window.RTCPeerConnection||!navigator.mediaDevices?.getUserMedia){callbacks.current.onError('This browser cannot open the voice connection. Use a current browser on the local bookmark.');return;}
  setPhase('checking');setLiveText('');setTestOnly(connectionTest);setAudioReceived(false);
  const generation=++counter.current,peer=new RTCPeerConnection(),audio=new Audio(),abort=new AbortController();audio.autoplay=true;
  const call={peer,stream:null,audio,abort,sessionId:'',generation,testOnly:connectionTest} as VoiceCall;live.current=call;
  call.timer=setTimeout(()=>{if(live.current===call)fail('The voice connection did not become ready. Please retry.');},40000);
  try{
   const options=await loadOptions();const chosen=selected.current||options.defaultVoice;if(!options.voices.includes(chosen))throw new Error('Your saved conversation voice is unavailable. Choose a listed voice.');if(live.current!==call)return;
   if(connectionTest)peer.addTransceiver('audio',{direction:'sendrecv'});
   else{const stream=await navigator.mediaDevices.getUserMedia({audio:microphoneConstraints(callbacks.current.microphone)});if(live.current!==call){stream.getTracks().forEach(track=>track.stop());return;}call.stream=stream;stream.getAudioTracks().forEach(track=>{track.enabled=false;peer.addTrack(track,stream);});}
   peer.ontrack=event=>{if(live.current!==call)return;audio.srcObject=event.streams[0]??new MediaStream([event.track]);audio.muted=speakerMuted.current;void audio.play().catch(()=>callbacks.current.onError('Audio playback was blocked. Press the speaker button to enable voice replies.'));};
   peer.onconnectionstatechange=()=>{if(live.current!==call)return;if(peer.connectionState==='connected'){clearTimeout(call.timer);setPhase(micMuted.current?'muted':'listening');}if(peer.connectionState==='failed'||peer.connectionState==='closed')fail('The audio connection ended. Your microphone has been stopped.');};
   const channel=peer.createDataChannel('oai-events');call.channel=channel;
   channel.onmessage=event=>{if(live.current!==call)return;try{const data=JSON.parse(event.data);const type=String(data.type||'');if(/speech_started$/.test(type)){setPhase(micMuted.current?'muted':'listening');dirty.current=true;void updateContext().catch(()=>{});}if(/output_audio.*(delta|started)|audio\.delta$/.test(type))setPhase('speaking');if(/output_audio.*done|response\.done$/.test(type))setPhase(micMuted.current?'muted':'listening');}catch{}};
   const offer=await peer.createOffer();await peer.setLocalDescription(offer);if(live.current!==call)return;setPhase('connecting');
   const response=await fetch('/api/gerd',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/x-ndjson','X-Companion-Token':callbacks.current.token||''},body:JSON.stringify({action:'voice_start',sdp:offer.sdp,voice:chosen,context:callbacks.current.getContext()}),signal:abort.signal});
   if(!response.ok){const data=await response.json() as {error?:string};throw new Error(data.error||'Voice could not connect.');}if(!response.body)throw new Error('Voice streaming is unavailable.');
   const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='';
   while(live.current===call){const chunk=await reader.read();buffer+=decoder.decode(chunk.value,{stream:!chunk.done});let end;while((end=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,end);buffer=buffer.slice(end+1);if(line.trim())await handle(call,JSON.parse(line));}if(chunk.done)break;}
   if(live.current===call){if(buffer.trim())await handle(call,JSON.parse(buffer));await stop();}
  }catch(error){if(live.current===call&&!abort.signal.aborted)fail(error instanceof Error?error.message:'Voice could not start.');}
 }
 function toggleMute(){micMuted.current=!micMuted.current;live.current?.stream?.getAudioTracks().forEach(track=>{track.enabled=!micMuted.current&&!busy.current;});setMuted(micMuted.current);setPhase(micMuted.current?'muted':'listening');}
 function toggleOutput(){speakerMuted.current=!speakerMuted.current;if(live.current){live.current.audio.muted=speakerMuted.current;if(!speakerMuted.current)void live.current.audio.play().catch(()=>callbacks.current.onError('This browser could not play the voice output.'));}setOutputMuted(speakerMuted.current);}
 async function reportResult(text:string){busy.current=false;const id=live.current?.sessionId;if(!id)return;try{await updateContext(true);await post({action:'voice_result',sessionId:id,text});live.current?.stream?.getAudioTracks().forEach(track=>{track.enabled=!micMuted.current;});setPhase(micMuted.current?'muted':'listening');}catch(error){if(live.current)callbacks.current.onError((error as Error).message);}}
 return{phase,testOnly,audioReceived,active:phase!=='off',voices,voice,selectVoice,loadOptions,start,stop,muted,toggleMute,outputMuted,toggleOutput,liveText,reportResult};
}
