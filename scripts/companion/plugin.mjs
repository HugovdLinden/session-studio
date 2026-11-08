import path from 'node:path';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { CompanionService } from './service.mjs';
import { publicVoiceError } from './realtime.mjs';

export function allowedRequest(req, { port, token }, mutate) {
  if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress)) return false;
  if (![`127.0.0.1:${port}`, `localhost:${port}`].includes(req.headers.host)) return false;
  const origin = `http://${req.headers.host}`;
  if (req.headers.origin && req.headers.origin !== origin) return false;
  if (req.headers['sec-fetch-site'] === 'cross-site') return false;
  if (mutate) {
    if (req.headers.origin !== origin || !req.headers['content-type']?.startsWith('application/json')) return false;
    const supplied = Buffer.from(req.headers['x-companion-token'] || ''); const expected = Buffer.from(token);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return false;
  }
  return true;
}
export function localCompanion() {
  let service;
  return { name: 'session-studio-local-companion', enforce: 'pre', apply: 'serve',closeBundle(){service?.stop();}, configureServer(server) {
    const root = path.resolve(server.config.root); service = new CompanionService({ root });
    const token = randomBytes(32).toString('hex');
    server.httpServer?.once('close', () => service.stop());
    server.middlewares.use(async (req, res, next) => {
      if ((req.url || '').split('?')[0] !== '/api/gerd') return next();
      const send = (status, body) => { if (res.destroyed) return; res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(body)); };
      const port = server.httpServer?.address()?.port;
      if (!allowedRequest(req, { port, token }, req.method !== 'GET')) return send(403, { error: 'Open the companion from its local bookmark.' });
      try {
        if (req.method === 'GET') return send(200, { ...await service.status(), token });
        if (req.method !== 'POST') return send(405, { error: 'Method unavailable.' });
        let body = ''; for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > 256000) return send(413, { error: 'This message/context is too large.' }); }
        const input = JSON.parse(body);
        if (input.action === 'cancel') { await service.cancel(); return send(200, { cancelled: true }); }
        if(input.action==='voice_options')return send(200,await service.voice.options());
        if(input.action==='voice_context'){await service.voice.update(input);return send(200,{updated:true});}
        if(input.action==='voice_stop'||input.action==='voice_result'||input.action==='voice_test'){await service.voice.result(input);return send(200,{ok:true});}
        if(input.action==='voice_start'){
          if(req.headers.accept!=='application/x-ndjson')return send(400,{error:'Voice needs a streaming connection.'});
          res.writeHead(200,{'Content-Type':'application/x-ndjson','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.flushHeaders();
          let lease;
          const emit=(type,data)=>{if(type==='voice_ready')lease=data.sessionId;if(!res.destroyed&&!res.writableEnded){res.write(JSON.stringify({type,...data})+'\n');if(type==='voice_closed')res.end();}};
          const close=()=>{if(lease)void service.voice.stop(lease);else if(service.voice.session?.emit===emit)void service.voice.stop(service.voice.session.id);};res.once('close',close);
          try{await service.voice.start(input,emit);}catch(error){emit('voice_error',{message:error?.issues?'Check the voice settings and current project.':publicVoiceError(error)});if(!res.writableEnded)res.end();res.off('close',close);}return;
        }
        const disconnected = () => { if (!res.writableEnded) void service.cancel().catch(() => {}); };
        res.once('close', disconnected);
        if(req.headers.accept==='application/x-ndjson'){
          res.writeHead(200,{'Content-Type':'application/x-ndjson','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.flushHeaders();
          const emit=(type,data)=>{if(!res.destroyed)res.write(JSON.stringify({type,...data})+'\n');};emit('progress',{message:'Message received…'});
          try{const result=await service.ask(input,{onProgress:message=>emit('progress',{message}),onDelta:text=>emit('delta',{text})});emit('result',{result});}catch(error){emit('error',{message:error?.issues?'Check your message and selected project.':error.message||'The companion is unavailable.'});}finally{res.off('close',disconnected);res.end();}return;
        }
        try { send(200, await service.ask(input)); } finally { res.off('close', disconnected); }
      } catch (error) { send(400, { error: error?.issues ? 'Check your message and selected project.' : error.message || 'The companion is unavailable.' }); }
    });
  } };
}
