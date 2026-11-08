export function speechError(code:string){return ({'not-allowed':'Microphone access was denied. Open this local site in regular Chrome and allow its microphone permission.','service-not-allowed':'Speech recognition is blocked in this browser. Open the local site in regular Chrome.','audio-capture':'No microphone is available. Check your selected microphone in Windows and Chrome.','network':'Microphone access succeeded, but the browser speech service could not connect. This can happen inside Codex’s preview even when your internet works. The microphone has been stopped. Use Windows voice typing (Win + H) below, or open the local bookmark directly in regular Chrome.','no-speech':'No speech was heard. Click the microphone and try again.','language-not-supported':'English speech recognition is unavailable in this browser.'} as Record<string,string>)[code]||'Voice input could not finish. Try again, or use Win + H in the message field.';}

export type ReleasableRecognition={onresult:unknown;onerror:unknown;onend:unknown;abort?:()=>void;stop:()=>void};
export function releaseRecognition(recognition:ReleasableRecognition|null){
 if(!recognition)return;
 // Detach before aborting: error/end events must never send a partial command.
 recognition.onresult=null;recognition.onerror=null;recognition.onend=null;
 try{if(recognition.abort)recognition.abort();else recognition.stop();}catch{try{recognition.stop();}catch{}}
}
export async function localEnglishAvailable(constructor:{available?:(options:{langs:string[];processLocally:boolean})=>Promise<string>},timeoutMs=1500){
 if(!constructor.available)return false;
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{return await Promise.race([constructor.available({langs:['en-US'],processLocally:true}).then(status=>status==='available'),new Promise<boolean>(resolve=>{timer=setTimeout(()=>resolve(false),timeoutMs);})]);}catch{return false;}finally{clearTimeout(timer);}
}
export function preferredVoice<T extends {name:string;lang:string;voiceURI:string;default?:boolean}>(voices:T[],selected=''){
 if(selected)return voices.find(v=>v.voiceURI===selected);
 return voices.filter(v=>v.lang.toLowerCase().startsWith('en')).sort((a,b)=>voiceScore(b)-voiceScore(a))[0];
}
export function microphoneConstraints(deviceId:string):MediaTrackConstraints|true{return deviceId?{deviceId:{exact:deviceId},echoCancellation:true,noiseSuppression:true}:true;}
function voiceScore(voice:{name:string;lang:string}){return (/natural|neural/i.test(voice.name)?100:0)+(/Google/i.test(voice.name)?50:0)+(/en-GB/i.test(voice.lang)?8:0)+(/female|samantha|aria|jenny/i.test(voice.name)?3:0);}
