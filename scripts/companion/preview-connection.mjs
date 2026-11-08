import http from 'node:http';

// A review copy shares the already-running local companion, not its state files.
// Validate the incoming preview origin before rewriting headers for the upstream.
export function previewRequestAllowed(req, port) {
  const host = req.headers.host;
  return ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress)
    && [`127.0.0.1:${port}`, `localhost:${port}`].includes(host)
    && (!req.headers.origin || req.headers.origin === `http://${host}`)
    && req.headers['sec-fetch-site'] !== 'cross-site'
    && (req.method === 'GET' || (req.method === 'POST'
      && req.headers.origin === `http://${host}`
      && req.headers['content-type']?.startsWith('application/json')));
}

export function companionPreviewConnection(address) {
  const upstream = new URL(address);
  if (upstream.protocol !== 'http:' || upstream.hostname !== '127.0.0.1'
      || !upstream.port || upstream.username || upstream.password || upstream.pathname !== '/'
      || upstream.search || upstream.hash) throw new Error('Companion preview needs a local loopback address.');
  return {
    name: 'session-studio-companion-preview', enforce: 'pre', apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if ((req.url || '').split('?')[0] !== '/api/gerd') return next();
        const fail = (status, error) => {
          if (res.destroyed || res.writableEnded) return;
          if (res.headersSent) return res.destroy();
          res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
          res.end(JSON.stringify({ error }));
        };
        const port = server.httpServer?.address()?.port;
        if (!previewRequestAllowed(req, port)) return fail(403, 'Open Gerd from this local preview.');
        if (Number(upstream.port) === port) return fail(503, 'The assistant connection needs a different local port.');
        const headers = { host: upstream.host, accept: req.headers.accept || 'application/json' };
        if (req.method === 'POST') {
          headers.origin = upstream.origin;
          headers['content-type'] = req.headers['content-type'];
          // The companion validates its own session token. Never invent or persist one.
          headers['x-companion-token'] = req.headers['x-companion-token'] || '';
        }
        const request = http.request(new URL('/api/gerd', upstream), { method: req.method, headers }, response => {
          res.writeHead(response.statusCode || 502, {
            'Content-Type': response.headers['content-type'] || 'application/json',
            'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
          });
          response.on('error', () => res.destroy());
          response.pipe(res);
        });
        request.on('error', () => fail(503, 'Gerd is disconnected. Start the local companion, then choose Reconnect assistant. Your draft is safe.'));
        req.on('aborted', () => request.destroy());
        res.on('close', () => request.destroy());
        req.pipe(request);
      });
    },
  };
}
