/**
 * GET /api/connect-defaults — Provides gateway connection defaults for the browser.
 *
 * The ConnectDialog in the frontend needs the WebSocket URL and auth token.
 * Instead of requiring users to enter these manually in the browser,
 * this endpoint exposes the server's configured gateway URL and token
 * so the frontend can pre-fill (or auto-connect).
 *
 * Security: The gateway token is only returned to loopback clients or when
 * NERVE_ALLOW_INSECURE=true (for Tailscale/local network access).
 * Remote clients receive the wsUrl and agentName but token is null.
 */

import { Hono } from 'hono';
import { getConnInfo } from '@hono/node-server/conninfo';
import { config } from '../lib/config.js';
import { rateLimitGeneral } from '../middleware/rate-limit.js';

const LOOPBACK_RE = /^(127\.\d+\.\d+\.\d+|::1|::ffff:127\.\d+\.\d+\.\d+)$/;

const app = new Hono();

app.get('/api/connect-defaults', rateLimitGeneral, (c) => {
  // Determine if the request originates from loopback
  let remoteIp = '';
  try {
    const info = getConnInfo(c);
    remoteIp = info.remote?.address ?? '';
  } catch {
    // fallback: not available in some test environments
  }
  const isLoopback = LOOPBACK_RE.test(remoteIp);
  
  // Also allow token when server is explicitly configured for insecure access
  // (e.g., for Tailscale or local network desktop launcher access)
  const allowInsecure = process.env.NERVE_ALLOW_INSECURE === 'true';
  const shouldReturnToken = isLoopback || allowInsecure;

  // Derive WebSocket URL for the gateway
  // The frontend always proxies through Nerve's /ws endpoint, so use the Nerve server's host
  // but point to the gateway port (18789) for the target parameter
  const reqUrl = new URL(c.req.url);
  const wsProtocol = reqUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  // Use Nerve's host:port for the proxy, frontend will add ?target=... automatically
  const wsUrl = `${wsProtocol}//${reqUrl.host}/ws`;

  return c.json({
    wsUrl,
    token: shouldReturnToken ? (config.gatewayToken || null) : null,
    agentName: config.agentName,
  });
});

export default app;
