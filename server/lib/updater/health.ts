/**
 * Post-restart health checks.
 * Polls /health (2xx) and /api/version (version match).
 * 3 retries with 2s/4s/8s backoff, 60s total timeout.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import http from 'node:http';
import type { HealthResult } from './types.js';

const BACKOFFS = [2_000, 4_000, 8_000];
const TOTAL_TIMEOUT = 60_000;
const REQUEST_TIMEOUT = 5_000;

/**
 * Check that the server is healthy and reports the expected version.
 */
export async function checkHealth(cwd: string, targetVersion: string): Promise<HealthResult> {
  const port = readPort(cwd);
  const baseUrl = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + TOTAL_TIMEOUT;

  for (let attempt = 0; Date.now() < deadline; attempt++) {
    // Wait before retrying (skip wait on first attempt)
    if (attempt > 0) {
      const backoff = BACKOFFS[Math.min(attempt - 1, BACKOFFS.length - 1)];
      await sleep(backoff);
    }

    try {
      // 1. Readiness — GET /health expects 2xx
      const healthRes = await httpGet(`${baseUrl}/health`, REQUEST_TIMEOUT);
      if (healthRes.status < 200 || healthRes.status >= 300) continue;

      // 2. Version — GET /api/version expects matching version
      const versionRes = await httpGet(`${baseUrl}/api/version`, REQUEST_TIMEOUT);
      if (versionRes.status < 200 || versionRes.status >= 300) continue;

      const data = JSON.parse(versionRes.body) as { version: string };
      if (data.version === targetVersion) {
        return { healthy: true, versionMatch: true, reportedVersion: data.version };
      }

      // Version mismatch — may be stale process, keep retrying until deadline
      if (Date.now() > deadline) {
        return {
          healthy: true,
          versionMatch: false,
          reportedVersion: data.version,
          error: `Version mismatch: expected ${targetVersion}, got ${data.version}`,
        };
      }
      continue;
    } catch {
      // Connection refused, timeout, etc. — retry
      continue;
    }
  }

  return {
    healthy: false,
    versionMatch: false,
    error: `Health check timed out after ${TOTAL_TIMEOUT / 1_000}s (port ${port})`,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────

function readPort(cwd: string): number {
  const envPath = join(cwd, '.env');
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const match = /^PORT=(\d+)/.exec(line.trim());
      if (match) return parseInt(match[1], 10);
    }
  }
  return 3080;
}

function httpGet(
  url: string,
  timeoutMs: number,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      let body = '';
      res.on('data', (chunk: Buffer) => {
        body += chunk.toString();
      });
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('request timeout'));
    });
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
