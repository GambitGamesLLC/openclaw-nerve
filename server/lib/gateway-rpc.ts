/**
 * Shared gateway RPC client.
 *
 * Extracts the `openclaw gateway call` pattern from ws-proxy into a shared
 * module so workspace routes, file-browser, and memories can call gateway
 * RPC methods (e.g. `agents.files.list/get/set`) as a fallback when the
 * workspace directory is not locally accessible.
 * @module
 */

import { execFile } from 'node:child_process';
import { dirname } from 'node:path';
import { resolveOpenclawBin } from './openclaw-bin.js';

// ── Types ────────────────────────────────────────────────────────────

export interface GatewayFileEntry {
  name: string;
  path: string;
  missing: boolean;
  size: number;
  updatedAtMs: number;
}

export interface GatewayFileWithContent extends GatewayFileEntry {
  content: string;
}

// ── Core RPC call ────────────────────────────────────────────────────

const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Execute a gateway RPC call via the CLI (`openclaw gateway call`).
 *
 * Shells out to the `openclaw` binary, passing the method and params as
 * JSON. Returns the parsed JSON response, or `{ ok: true, raw: stdout }`
 * if the output isn't valid JSON.
 */
export function gatewayRpcCall(
  method: string,
  params: Record<string, unknown>,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const bin = resolveOpenclawBin();
    const args = ['gateway', 'call', method, '--params', JSON.stringify(params)];
    // Ensure nvm/fnm/volta node is in PATH for #!/usr/bin/env node shebangs
    const nodeBinDir = dirname(process.execPath);
    const existingPath = process.env.PATH;
    const env = { ...process.env, PATH: existingPath ? `${nodeBinDir}:${existingPath}` : nodeBinDir };
    execFile(bin, args, { timeout: timeoutMs, maxBuffer: 1024 * 1024, env }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(stderr?.trim() || err.message));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch {
        resolve({ ok: true, raw: stdout.trim() });
      }
    });
  });
}

// ── Typed file RPC wrappers ──────────────────────────────────────────

/**
 * List top-level workspace files for an agent via gateway RPC.
 */
export async function gatewayFilesList(agentId: string): Promise<GatewayFileEntry[]> {
  const result = await gatewayRpcCall('agents.files.list', { agentId }) as { files?: GatewayFileEntry[] };
  return result.files ?? [];
}

/**
 * Read a top-level workspace file via gateway RPC.
 * Returns null if the file is not found or unsupported.
 */
export async function gatewayFilesGet(agentId: string, name: string): Promise<GatewayFileWithContent | null> {
  try {
    const result = await gatewayRpcCall('agents.files.get', { agentId, name }) as GatewayFileWithContent;
    if (!result || result.missing) return null;
    return result;
  } catch {
    return null;
  }
}

/**
 * Write a top-level workspace file via gateway RPC.
 */
export async function gatewayFilesSet(agentId: string, name: string, content: string): Promise<void> {
  await gatewayRpcCall('agents.files.set', { agentId, name, content });
}
