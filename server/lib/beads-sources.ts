import fs from 'node:fs';
import path from 'node:path';
import { config, type BeadsSource } from './config.js';
import { withMutex } from './mutex.js';

const SOURCE_ID_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;
const STATE_FILE_PATH = path.join(config.home, '.nerve', 'beads-sources.json');
const OPENCLAW_ROOT = config.beads.sources.find((source) => source.id === 'openclaw')?.rootPath
  ?? path.join(config.home, '.openclaw');

interface PersistedBeadsSourceEntry {
  id: string;
  label: string;
  rootPath: string;
}

interface PersistedBeadsSourcesState {
  sources?: PersistedBeadsSourceEntry[];
  lastSourceId?: string | null;
}

export interface ManagedBeadsSourceDto {
  id: string;
  label: string;
  kind: 'openclaw' | 'project';
  isDefault: boolean;
  isCustom: boolean;
}

interface ManagedBeadsSource {
  source: BeadsSource;
  isCustom: boolean;
}

function expandHomePath(input: string): string {
  if (input === '~') return config.home;
  if (input.startsWith('~/')) return path.join(config.home, input.slice(2));
  return input;
}

function normalizeRootPath(input: string): string {
  const expanded = expandHomePath(input.trim());
  const resolved = path.resolve(expanded);
  try {
    return fs.realpathSync(resolved);
  } catch {
    return resolved;
  }
}

function isWithinDirectory(targetPath: string, rootPath: string): boolean {
  const relative = path.relative(rootPath, targetPath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function isAllowedSourcePath(rootPath: string): boolean {
  return rootPath === OPENCLAW_ROOT || isWithinDirectory(rootPath, config.beads.projectsRoot);
}

function sourceKindForPath(rootPath: string): 'openclaw' | 'project' {
  return rootPath === OPENCLAW_ROOT ? 'openclaw' : 'project';
}

function toDto({ source, isCustom }: ManagedBeadsSource): ManagedBeadsSourceDto {
  return {
    id: source.id,
    label: source.label,
    kind: source.kind,
    isDefault: source.id === config.beads.defaultSourceId,
    isCustom,
  };
}

function readPersistedState(): PersistedBeadsSourcesState {
  try {
    const raw = fs.readFileSync(STATE_FILE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as PersistedBeadsSourcesState;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writePersistedState(next: PersistedBeadsSourcesState): void {
  fs.mkdirSync(path.dirname(STATE_FILE_PATH), { recursive: true });
  fs.writeFileSync(STATE_FILE_PATH, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
}

function sanitizePersistedEntry(entry: PersistedBeadsSourceEntry): PersistedBeadsSourceEntry | null {
  if (!entry || typeof entry !== 'object') return null;
  const id = typeof entry.id === 'string' ? entry.id.trim().toLowerCase() : '';
  const label = typeof entry.label === 'string' ? entry.label.trim() : '';
  const rawRootPath = typeof entry.rootPath === 'string' ? entry.rootPath.trim() : '';
  if (!id || !label || !rawRootPath || !SOURCE_ID_PATTERN.test(id)) return null;

  const rootPath = normalizeRootPath(rawRootPath);
  if (!isAllowedSourcePath(rootPath)) return null;

  try {
    const stat = fs.statSync(rootPath);
    if (!stat.isDirectory()) return null;
  } catch {
    return null;
  }

  return { id, label, rootPath };
}

function loadManagedSources(): ManagedBeadsSource[] {
  const managed: ManagedBeadsSource[] = config.beads.sources.map((source) => ({ source, isCustom: false }));
  const seenIds = new Set(managed.map((entry) => entry.source.id));
  const seenRoots = new Set(managed.map((entry) => entry.source.rootPath));
  const persisted = readPersistedState();

  for (const rawEntry of persisted.sources ?? []) {
    const entry = sanitizePersistedEntry(rawEntry);
    if (!entry) continue;
    if (seenIds.has(entry.id) || seenRoots.has(entry.rootPath)) continue;

    const source: BeadsSource = {
      id: entry.id,
      label: entry.label,
      rootPath: entry.rootPath,
      kind: sourceKindForPath(entry.rootPath),
    };
    managed.push({ source, isCustom: true });
    seenIds.add(source.id);
    seenRoots.add(source.rootPath);
  }

  return managed;
}

function buildUniqueSourceId(seed: string, existingIds: Set<string>): string {
  const base = seed
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-') || 'source';

  let candidate = base;
  let index = 2;
  while (existingIds.has(candidate) || !SOURCE_ID_PATTERN.test(candidate)) {
    candidate = `${base}-${index}`;
    index += 1;
  }
  return candidate;
}

export function listManagedBeadsSourceDtos(): ManagedBeadsSourceDto[] {
  return loadManagedSources().map(toDto);
}

export function getManagedLastSourceId(): string | null {
  const persisted = readPersistedState();
  const candidate = typeof persisted.lastSourceId === 'string' ? persisted.lastSourceId.trim().toLowerCase() : '';
  if (!candidate) return null;
  return loadManagedSources().some((entry) => entry.source.id === candidate) ? candidate : null;
}

export function resolveManagedBeadsSource(sourceId?: string | null): BeadsSource | null {
  const managed = loadManagedSources();
  const requestedId = sourceId?.trim().toLowerCase();
  const fallbackId = getManagedLastSourceId() || config.beads.defaultSourceId;
  const resolvedId = requestedId || fallbackId;
  return managed.find((entry) => entry.source.id === resolvedId)?.source ?? null;
}

export async function addManagedBeadsSource(input: { label?: string; rootPath: string }): Promise<ManagedBeadsSourceDto> {
  return withMutex(`beads-sources:${STATE_FILE_PATH}`, async () => {
    const rootPath = normalizeRootPath(input.rootPath || '');
    if (!rootPath) throw new Error('rootPath is required');
    if (!isAllowedSourcePath(rootPath)) {
      throw new Error(`Beads source path must be ~/.openclaw or inside ${config.beads.projectsRoot}`);
    }

    let stat;
    try {
      stat = fs.statSync(rootPath);
    } catch {
      throw new Error('Beads source path does not exist');
    }
    if (!stat.isDirectory()) throw new Error('Beads source path must be a directory');

    const managed = loadManagedSources();
    const existingByRoot = managed.find((entry) => entry.source.rootPath === rootPath);
    if (existingByRoot) {
      throw new Error(`Beads source already tracked as "${existingByRoot.source.label}"`);
    }

    const state = readPersistedState();
    const persistedEntries = (state.sources ?? []).map(sanitizePersistedEntry).filter((entry): entry is PersistedBeadsSourceEntry => Boolean(entry));
    const existingIds = new Set(managed.map((entry) => entry.source.id));
    const inferredLabel = input.label?.trim() || path.basename(rootPath) || 'Tracked Project';
    const id = buildUniqueSourceId(inferredLabel, existingIds);
    const nextEntry: PersistedBeadsSourceEntry = { id, label: inferredLabel, rootPath };

    writePersistedState({
      ...state,
      sources: [...persistedEntries, nextEntry],
      lastSourceId: id,
    });

    return {
      id,
      label: inferredLabel,
      kind: sourceKindForPath(rootPath),
      isDefault: id === config.beads.defaultSourceId,
      isCustom: true,
    };
  });
}

export async function removeManagedBeadsSource(sourceId: string): Promise<void> {
  await withMutex(`beads-sources:${STATE_FILE_PATH}`, async () => {
    const normalizedId = sourceId.trim().toLowerCase();
    if (!normalizedId) throw new Error('sourceId is required');
    if (config.beads.sources.some((source) => source.id === normalizedId)) {
      throw new Error('Env-configured Beads sources cannot be removed in-app');
    }

    const state = readPersistedState();
    const persistedEntries = (state.sources ?? []).map(sanitizePersistedEntry).filter((entry): entry is PersistedBeadsSourceEntry => Boolean(entry));
    const nextEntries = persistedEntries.filter((entry) => entry.id !== normalizedId);
    if (nextEntries.length === persistedEntries.length) {
      throw new Error(`Unknown custom Beads source: ${normalizedId}`);
    }

    const lastSourceId = state.lastSourceId?.trim().toLowerCase() === normalizedId ? null : state.lastSourceId ?? null;
    writePersistedState({
      sources: nextEntries,
      lastSourceId,
    });
  });
}

export async function setManagedLastSourceId(sourceId: string | null | undefined): Promise<string | null> {
  return withMutex(`beads-sources:${STATE_FILE_PATH}`, async () => {
    const normalizedId = sourceId?.trim().toLowerCase() || null;
    const state = readPersistedState();

    if (!normalizedId) {
      writePersistedState({
        ...state,
        lastSourceId: null,
      });
      return null;
    }

    const managed = loadManagedSources();
    if (!managed.some((entry) => entry.source.id === normalizedId)) {
      throw new Error(`Unknown Beads source: ${normalizedId}`);
    }

    writePersistedState({
      ...state,
      lastSourceId: normalizedId,
    });
    return normalizedId;
  });
}

export function getBeadsSourcesStateFilePath(): string {
  return STATE_FILE_PATH;
}
