import type { ReactNode } from 'react';

export interface ReferencePlanSummary {
  path: string;
  title: string;
  status: string | null;
  planId: string | null;
  beadIds: string[];
  archived: boolean;
}

export interface InlineReferenceOptions {
  searchQuery?: string;
  plans?: ReferencePlanSummary[];
  pathLinkPrefixes?: string[];
  onOpenPlanReference?: (path: string) => void;
  onOpenPath?: (path: string) => void;
  onOpenTask?: (taskId: string) => void;
}

const DEFAULT_BEAD_PREFIXES = new Set(['nerve', 'oc']);
const SAFE_REPO_PATH_PATTERN = /^(?:src|server|docs)\/[A-Za-z0-9._/-]+$/;
const SAFE_REPO_FILE_NAMES = new Set([
  'package.json',
  'README.md',
  'vite.config.ts',
  'vite.config.js',
  'vite.config.mts',
  'vite.config.mjs',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
]);

function highlightText(text: string, query?: string): ReactNode {
  if (!query?.trim()) return text;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) => (
    i % 2 === 1
      ? <mark key={i} className="search-highlight">{part}</mark>
      : part
  ));
}

function splitToken(token: string): { leading: string; core: string; trailing: string } {
  const match = token.match(/^([("'`[]*)(.*?)([.,:;!?\])"'`]*)$/);
  if (!match) return { leading: '', core: token, trailing: '' };
  return {
    leading: match[1] || '',
    core: match[2] || '',
    trailing: match[3] || '',
  };
}

function normalizeRepoPath(candidate: string): string {
  return candidate.replace(/^(?:\.\/)+/, '');
}

function isPlanPath(candidate: string): boolean {
  return /^\.plans\/[A-Za-z0-9._/-]+\.md$/i.test(candidate);
}

function isSafeRepoPath(candidate: string): boolean {
  const normalized = normalizeRepoPath(candidate);
  return SAFE_REPO_PATH_PATTERN.test(normalized) || SAFE_REPO_FILE_NAMES.has(normalized);
}

function normalizePathLinkPrefixes(prefixes?: string[]): string[] {
  if (!prefixes) return [];

  return prefixes
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function matchPathByPrefix(candidate: string, prefixes: string[]): string | null {
  if (!candidate || prefixes.length === 0) return null;

  const matched = prefixes.find((prefix) => candidate.startsWith(prefix) && candidate.length > prefix.length);
  return matched ? candidate : null;
}

function isBeadId(candidate: string, plans: ReferencePlanSummary[]): boolean {
  const exactIds = new Set(plans.flatMap((plan) => plan.beadIds));
  if (exactIds.has(candidate)) return true;

  const match = candidate.match(/^([a-z][a-z0-9]{1,15})-([a-z0-9]{2,16})$/);
  if (!match) return false;

  const prefix = match[1];
  const knownPrefixes = new Set([
    ...DEFAULT_BEAD_PREFIXES,
    ...Array.from(exactIds).map((id) => id.split('-', 1)[0] || ''),
  ].filter(Boolean));

  return knownPrefixes.has(prefix);
}

function planHoverTitle(plan: ReferencePlanSummary): string {
  const parts = [plan.title];
  if (plan.status) parts.push(plan.status);
  if (plan.archived) parts.push('Archived');
  parts.push(plan.path);
  return parts.join(' • ');
}

function beadHoverTitle(beadId: string, plans: ReferencePlanSummary[]): string {
  const plan = plans.find((entry) => entry.beadIds.includes(beadId));
  if (!plan) return `Open ${beadId} in the board`;
  return `Open ${beadId} in the board • linked plan: ${plan.title}`;
}

export function renderInlineReferences(text: string, options: InlineReferenceOptions = {}): ReactNode {
  const {
    searchQuery,
    plans = [],
    pathLinkPrefixes,
    onOpenPlanReference,
    onOpenPath,
    onOpenTask,
  } = options;

  if (!text) return text;

  const configuredPathPrefixes = normalizePathLinkPrefixes(pathLinkPrefixes);
  const hasConfiguredPathPrefixes = configuredPathPrefixes.length > 0;

  const tokens = text.split(/(\s+)/);
  const out: ReactNode[] = [];

  tokens.forEach((token, index) => {
    if (token === '') return;
    if (/^\s+$/.test(token)) {
      out.push(token);
      return;
    }

    const { leading, core, trailing } = splitToken(token);
    if (leading) out.push(leading);

    const isPlanReference = isPlanPath(core);
    const plan = isPlanReference ? plans.find((entry) => entry.path === core) : null;

    if (isPlanReference && onOpenPlanReference) {
      out.push(
        <button
          key={`plan-${index}-${core}`}
          type="button"
          className="inline rounded-sm border border-purple/20 bg-purple/10 px-1 py-0 font-mono text-[0.92em] text-purple hover:bg-purple/15 cursor-pointer"
          onClick={() => onOpenPlanReference(core)}
          title={plan ? planHoverTitle(plan) : `Open ${core} inside Nerve`}
        >
          {highlightText(core, searchQuery)}
        </button>,
      );
    } else if (isPlanReference && onOpenPath) {
      out.push(
        <button
          key={`plan-path-${index}-${core}`}
          type="button"
          className="inline rounded-sm border border-purple/20 bg-purple/10 px-1 py-0 font-mono text-[0.92em] text-purple hover:bg-purple/15 cursor-pointer"
          onClick={() => onOpenPath(core)}
          title={`Open ${core} inside Nerve`}
        >
          {highlightText(core, searchQuery)}
        </button>,
      );
    } else if (onOpenPath) {
      const matchedConfiguredPath = matchPathByPrefix(core, configuredPathPrefixes);
      if (matchedConfiguredPath) {
        out.push(
          <button
            key={`path-prefix-${index}-${matchedConfiguredPath}`}
            type="button"
            className="inline rounded-sm border border-border/60 bg-muted/30 px-1 py-0 font-mono text-[0.92em] text-foreground hover:bg-muted/50 cursor-pointer"
            onClick={() => onOpenPath(matchedConfiguredPath)}
            title={`Open ${matchedConfiguredPath} inside Nerve`}
          >
            {highlightText(core, searchQuery)}
          </button>,
        );
      } else if (!hasConfiguredPathPrefixes && isSafeRepoPath(core)) {
        const normalizedPath = normalizeRepoPath(core);
        out.push(
          <button
            key={`path-${index}-${normalizedPath}`}
            type="button"
            className="inline rounded-sm border border-border/60 bg-muted/30 px-1 py-0 font-mono text-[0.92em] text-foreground hover:bg-muted/50 cursor-pointer"
            onClick={() => onOpenPath(normalizedPath)}
            title={`Open ${normalizedPath} inside Nerve`}
          >
            {highlightText(core, searchQuery)}
          </button>,
        );
      } else if (isBeadId(core, plans) && onOpenTask) {
        out.push(
          <button
            key={`bead-${index}-${core}`}
            type="button"
            className="inline rounded-sm border border-primary/25 bg-primary/10 px-1 py-0 font-mono text-[0.92em] text-primary hover:bg-primary/15 cursor-pointer"
            onClick={() => onOpenTask(core)}
            title={beadHoverTitle(core, plans)}
          >
            {highlightText(core, searchQuery)}
          </button>,
        );
      } else {
        out.push(highlightText(core, searchQuery));
      }
    } else if (isBeadId(core, plans) && onOpenTask) {
      out.push(
        <button
          key={`bead-${index}-${core}`}
          type="button"
          className="inline rounded-sm border border-primary/25 bg-primary/10 px-1 py-0 font-mono text-[0.92em] text-primary hover:bg-primary/15 cursor-pointer"
          onClick={() => onOpenTask(core)}
          title={beadHoverTitle(core, plans)}
        >
          {highlightText(core, searchQuery)}
        </button>,
      );
    } else {
      out.push(highlightText(core, searchQuery));
    }

    if (trailing) out.push(trailing);
  });

  return out;
}
