/**
 * Repo-local .plans discovery + read helpers.
 *
 * This powers the first-pass Nerve plans surface: discover markdown plans,
 * extract lightweight metadata for list display, and read a selected plan for
 * preview/open-in-editor handoff.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

export interface PlanFrontmatter {
  plan_id?: string;
  plan_title?: string;
  status?: string;
  bead_ids?: string[];
}

export interface PlanSummary {
  path: string;
  title: string;
  status: string | null;
  planId: string | null;
  beadIds: string[];
  archived: boolean;
  updatedAt: number;
  preview: string;
}

export interface PlanDocument extends PlanSummary {
  content: string;
}

export interface PlanLinkMetadata {
  planId: string | null;
  path: string | null;
  title: string | null;
}

export type LinkedPlanResolutionState = 'active' | 'archived' | 'moved' | 'missing';

export interface LinkedPlanResolution {
  state: LinkedPlanResolutionState;
  plan: PlanSummary | null;
  resolvedBy: 'metadata' | 'bead_ids';
  lastKnown: PlanLinkMetadata | null;
  metadataToWrite: PlanLinkMetadata | null;
  metadataNeedsWrite: boolean;
}

interface ParsedPlan {
  frontmatter: PlanFrontmatter;
  body: string;
}

interface FrontmatterSplit {
  hasFrontmatter: boolean;
  rawFrontmatter: string;
  body: string;
}

const PLAN_ROOT_NAME = '.plans';

function normalizeRepoRoot(repoRoot?: string): string {
  return path.resolve(repoRoot || process.cwd());
}

export function getPlansRoot(repoRoot?: string): string {
  return path.resolve(normalizeRepoRoot(repoRoot), PLAN_ROOT_NAME);
}

function isMarkdownFile(name: string): boolean {
  return name.toLowerCase().endsWith('.md');
}

export function isArchivedPlanPath(relativePath: string): boolean {
  const segments = relativePath.split(/[\\/]+/).filter(Boolean);
  return segments.includes('archive');
}

function stripWrappingQuotes(value: string): string {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function normalizeOptionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function dedupeStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const value of values) {
    const next = value.trim();
    if (!next || seen.has(next)) continue;
    seen.add(next);
    deduped.push(next);
  }

  return deduped;
}

function splitFrontmatter(content: string): FrontmatterSplit {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return { hasFrontmatter: false, rawFrontmatter: '', body: content };
  }

  return {
    hasFrontmatter: true,
    rawFrontmatter: match[1] ?? '',
    body: content.slice(match[0].length),
  };
}

function removeBeadIdsBlock(rawFrontmatter: string): string {
  const stripped = rawFrontmatter
    .replace(/(?:^|\n)bead_ids:\s*(?:\[[^\n]*\]|[^\n]*)?(?:\n[ \t]+-[^\n]*)*/m, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+|\n+$/g, '');

  return stripped;
}

function renderBeadIdsBlock(beadIds: string[]): string {
  if (beadIds.length === 0) return '';
  return `bead_ids:\n${beadIds.map((beadId) => `  - ${beadId}`).join('\n')}`;
}

export function extractBeadIdsFromPlanBody(content: string): string[] {
  const { body } = parsePlanContent(content);
  const matches = body.matchAll(/\*\*Bead ID:\*\*\s*`?([A-Za-z0-9][A-Za-z0-9_-]*)`?/gi);
  const beadIds = Array.from(matches, (match) => match[1]?.trim() ?? '').filter(Boolean);
  return dedupeStrings(beadIds);
}

function sanitizePlanIdPart(value: string): string {
  return value
    .toLowerCase()
    .replace(/\.md$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function inferPlanId(relativePath: string, frontmatter: PlanFrontmatter): string {
  const existing = frontmatter.plan_id?.trim();
  if (existing) return existing;

  const stem = sanitizePlanIdPart(path.posix.basename(relativePath));
  return `plan-${stem || 'untitled'}`;
}

export function ensurePlanLinkageFrontmatter(relativePath: string, content: string): string {
  const parsed = parsePlanContent(content);
  const split = splitFrontmatter(content);

  const inferredBeadIds = extractBeadIdsFromPlanBody(content);
  const desiredPlanId = inferPlanId(relativePath, parsed.frontmatter);
  const desiredBeadIds = dedupeStrings([...(parsed.frontmatter.bead_ids ?? []), ...inferredBeadIds]);

  let rawFrontmatter = split.rawFrontmatter.trim();

  if (!split.hasFrontmatter) {
    const sections = [
      `plan_id: ${desiredPlanId}`,
      renderBeadIdsBlock(desiredBeadIds),
    ].filter(Boolean);

    return `---\n${sections.join('\n')}\n---\n${split.body}`;
  }

  if (!/^plan_id:\s*.+$/m.test(rawFrontmatter)) {
    rawFrontmatter = [`plan_id: ${desiredPlanId}`, rawFrontmatter].filter(Boolean).join('\n');
  }

  const currentBeadIds = dedupeStrings(parsed.frontmatter.bead_ids ?? []);
  const beadIdsChanged = currentBeadIds.length !== desiredBeadIds.length
    || currentBeadIds.some((beadId, index) => beadId !== desiredBeadIds[index]);

  if (beadIdsChanged) {
    rawFrontmatter = removeBeadIdsBlock(rawFrontmatter);
    const beadBlock = renderBeadIdsBlock(desiredBeadIds);
    rawFrontmatter = [rawFrontmatter, beadBlock].filter(Boolean).join('\n');
  }

  const normalized = `---\n${rawFrontmatter.trim()}\n---\n${split.body}`;
  return normalized;
}

async function readPlanContentWithLinkageMaintenance(relativePath: string, absolutePath: string): Promise<string> {
  const content = await fs.readFile(absolutePath, 'utf-8');

  if (isArchivedPlanPath(relativePath)) {
    return content;
  }

  const updated = ensurePlanLinkageFrontmatter(relativePath, content);
  if (updated !== content) {
    await fs.writeFile(absolutePath, updated, 'utf-8');
    return updated;
  }

  return content;
}

export function parsePlanContent(content: string): ParsedPlan {
  if (!content.startsWith('---\n')) {
    return { frontmatter: {}, body: content };
  }

  const end = content.indexOf('\n---\n', 4);
  if (end === -1) {
    return { frontmatter: {}, body: content };
  }

  const rawFrontmatter = content.slice(4, end);
  const body = content.slice(end + 5);
  const frontmatter: PlanFrontmatter = {};
  let activeArrayKey: keyof PlanFrontmatter | null = null;

  for (const line of rawFrontmatter.split(/\r?\n/)) {
    if (!line.trim()) continue;

    const arrayMatch = line.match(/^\s+-\s+(.*)$/);
    if (arrayMatch && activeArrayKey === 'bead_ids') {
      const next = stripWrappingQuotes(arrayMatch[1]);
      if (!frontmatter.bead_ids) frontmatter.bead_ids = [];
      frontmatter.bead_ids.push(next);
      continue;
    }

    const keyValueMatch = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!keyValueMatch) {
      activeArrayKey = null;
      continue;
    }

    const [, rawKey, rawValue] = keyValueMatch;
    const key = rawKey as keyof PlanFrontmatter;
    const value = rawValue.trim();

    if (key === 'bead_ids') {
      activeArrayKey = 'bead_ids';
      if (!value) {
        frontmatter.bead_ids = [];
      } else if (value.startsWith('[') && value.endsWith(']')) {
        frontmatter.bead_ids = value
          .slice(1, -1)
          .split(',')
          .map(item => stripWrappingQuotes(item))
          .filter(Boolean);
      } else {
        frontmatter.bead_ids = [stripWrappingQuotes(value)];
      }
      continue;
    }

    activeArrayKey = null;
    if (key === 'plan_id' || key === 'plan_title' || key === 'status') {
      frontmatter[key] = stripWrappingQuotes(value);
    }
  }

  return { frontmatter, body };
}

export function extractPlanTitle(content: string, frontmatter: PlanFrontmatter): string {
  if (frontmatter.plan_title?.trim()) return frontmatter.plan_title.trim();

  const { body } = parsePlanContent(content);
  for (const line of body.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('# ')) return trimmed.slice(2).trim();
  }

  return 'Untitled plan';
}

function normalizeStatus(raw?: string | null): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  return trimmed;
}

export function extractPlanStatus(content: string, frontmatter: PlanFrontmatter): string | null {
  const fmStatus = normalizeStatus(frontmatter.status);
  if (fmStatus) return fmStatus;

  const { body } = parsePlanContent(content);
  const statusLine = body.match(/\*\*Status:\*\*\s*([^\n]+)/i);
  return normalizeStatus(statusLine?.[1] ?? null);
}

export function extractPlanPreview(content: string): string {
  const { body } = parsePlanContent(content);
  const lines = body.split(/\r?\n/);
  const collected: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (collected.length > 0) break;
      continue;
    }
    if (line.startsWith('#')) continue;
    if (line.startsWith('**Date:**') || line.startsWith('**Status:**') || line.startsWith('**Agent:**')) continue;
    collected.push(line);
    if (collected.join(' ').length >= 240) break;
  }

  const preview = collected.join(' ').trim();
  if (!preview) return 'No preview available.';
  return preview.length > 260 ? `${preview.slice(0, 257)}…` : preview;
}

async function collectPlanFiles(dirPath: string, relativeDir = ''): Promise<string[]> {
  const items = await fs.readdir(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const item of items) {
    const childRelative = relativeDir ? path.posix.join(relativeDir, item.name) : item.name;
    const childAbsolute = path.join(dirPath, item.name);

    if (item.isDirectory()) {
      files.push(...await collectPlanFiles(childAbsolute, childRelative));
      continue;
    }

    if (item.isFile() && isMarkdownFile(item.name)) {
      files.push(path.posix.join(PLAN_ROOT_NAME, childRelative));
    }
  }

  return files;
}

function findPlanByBeadIdFromPlans(plans: PlanSummary[], beadId: string): PlanSummary | null {
  const normalizedBeadId = beadId.trim();
  if (!normalizedBeadId) return null;
  return plans.find((plan) => plan.beadIds.includes(normalizedBeadId)) ?? null;
}

function findPlanByPlanIdFromPlans(plans: PlanSummary[], planId: string): PlanSummary | null {
  const normalizedPlanId = planId.trim();
  if (!normalizedPlanId) return null;
  return plans.find((plan) => plan.planId === normalizedPlanId) ?? null;
}

function normalizePlanLinkMetadata(metadata?: Partial<PlanLinkMetadata> | null): PlanLinkMetadata | null {
  if (!metadata) return null;

  const normalized: PlanLinkMetadata = {
    planId: normalizeOptionalString(metadata.planId),
    path: normalizeOptionalString(metadata.path),
    title: normalizeOptionalString(metadata.title),
  };

  if (!normalized.planId && !normalized.path && !normalized.title) {
    return null;
  }

  return normalized;
}

function buildPlanLinkMetadata(plan: PlanSummary): PlanLinkMetadata {
  return {
    planId: plan.planId,
    path: plan.path,
    title: plan.title,
  };
}

function isSamePlanLinkMetadata(left: PlanLinkMetadata | null, right: PlanLinkMetadata | null): boolean {
  if (!left && !right) return true;
  if (!left || !right) return false;
  return left.planId === right.planId && left.path === right.path && left.title === right.title;
}

export async function resolveRepoPlanLinkForBead(
  beadId: string,
  metadata?: Partial<PlanLinkMetadata> | null,
  repoRoot?: string,
): Promise<LinkedPlanResolution | null> {
  const normalizedBeadId = beadId.trim();
  if (!normalizedBeadId) return null;

  const plans = await listRepoPlans(repoRoot);
  const normalizedMetadata = normalizePlanLinkMetadata(metadata);

  const buildResolvedResult = (
    state: Exclude<LinkedPlanResolutionState, 'missing'>,
    plan: PlanSummary,
    resolvedBy: 'metadata' | 'bead_ids',
  ): LinkedPlanResolution => {
    const desiredMetadata = buildPlanLinkMetadata(plan);
    return {
      state,
      plan,
      resolvedBy,
      lastKnown: normalizedMetadata,
      metadataToWrite: desiredMetadata,
      metadataNeedsWrite: !isSamePlanLinkMetadata(normalizedMetadata, desiredMetadata),
    };
  };

  if (normalizedMetadata) {
    const planByPath = normalizedMetadata.path
      ? plans.find((plan) => plan.path === normalizedMetadata.path) ?? null
      : null;
    const planById = normalizedMetadata.planId
      ? findPlanByPlanIdFromPlans(plans, normalizedMetadata.planId)
      : null;

    if (planById) {
      const moved = Boolean(normalizedMetadata.path) && planById.path !== normalizedMetadata.path;
      if (moved) {
        return buildResolvedResult('moved', planById, 'metadata');
      }

      return buildResolvedResult(planById.archived ? 'archived' : 'active', planById, 'metadata');
    }

    if (planByPath) {
      return buildResolvedResult(planByPath.archived ? 'archived' : 'active', planByPath, 'metadata');
    }
  }

  const fallbackPlan = findPlanByBeadIdFromPlans(plans, normalizedBeadId);
  if (fallbackPlan) {
    return buildResolvedResult(fallbackPlan.archived ? 'archived' : 'active', fallbackPlan, 'bead_ids');
  }

  if (!normalizedMetadata) return null;

  return {
    state: 'missing',
    plan: null,
    resolvedBy: 'metadata',
    lastKnown: normalizedMetadata,
    metadataToWrite: null,
    metadataNeedsWrite: false,
  };
}

export async function findRepoPlanByBeadId(beadId: string, repoRoot?: string): Promise<PlanSummary | null> {
  const normalizedBeadId = beadId.trim();
  if (!normalizedBeadId) return null;

  const plans = await listRepoPlans(repoRoot);
  return findPlanByBeadIdFromPlans(plans, normalizedBeadId);
}

export async function listRepoPlans(repoRoot?: string): Promise<PlanSummary[]> {
  const plansRoot = getPlansRoot(repoRoot);

  try {
    const stat = await fs.stat(plansRoot);
    if (!stat.isDirectory()) return [];
  } catch {
    return [];
  }

  const relativePaths = await collectPlanFiles(plansRoot);
  const summaries = await Promise.all(relativePaths.map(async (relativePath) => {
    const absolutePath = resolvePlanPath(relativePath, repoRoot);
    if (!absolutePath) return null;

    const [content, stat] = await Promise.all([
      readPlanContentWithLinkageMaintenance(relativePath, absolutePath),
      fs.stat(absolutePath),
    ]);

    const parsed = parsePlanContent(content);
    return {
      path: relativePath,
      title: extractPlanTitle(content, parsed.frontmatter),
      status: extractPlanStatus(content, parsed.frontmatter),
      planId: parsed.frontmatter.plan_id?.trim() || null,
      beadIds: parsed.frontmatter.bead_ids ?? [],
      archived: isArchivedPlanPath(relativePath),
      updatedAt: Math.floor(stat.mtimeMs),
      preview: extractPlanPreview(content),
    } satisfies PlanSummary;
  }));

  return summaries
    .filter((plan): plan is PlanSummary => Boolean(plan))
    .sort((a, b) => {
      if (a.archived !== b.archived) return a.archived ? 1 : -1;
      return b.updatedAt - a.updatedAt;
    });
}

export function resolvePlanPath(relativePath: string, repoRoot?: string): string | null {
  const normalized = path.posix.normalize(relativePath.trim());
  if (!normalized || !normalized.startsWith('.plans/') || normalized.includes('..')) {
    return null;
  }

  const resolved = path.resolve(normalizeRepoRoot(repoRoot), normalized);
  const root = getPlansRoot(repoRoot);
  const rootPrefix = root.endsWith(path.sep) ? root : `${root}${path.sep}`;

  if (resolved !== root && !resolved.startsWith(rootPrefix)) {
    return null;
  }

  if (!isMarkdownFile(resolved)) {
    return null;
  }

  return resolved;
}

export async function readRepoPlan(relativePath: string, repoRoot?: string): Promise<PlanDocument | null> {
  const absolutePath = resolvePlanPath(relativePath, repoRoot);
  if (!absolutePath) return null;

  try {
    const [content, stat] = await Promise.all([
      readPlanContentWithLinkageMaintenance(relativePath, absolutePath),
      fs.stat(absolutePath),
    ]);
    const parsed = parsePlanContent(content);

    return {
      path: relativePath,
      title: extractPlanTitle(content, parsed.frontmatter),
      status: extractPlanStatus(content, parsed.frontmatter),
      planId: parsed.frontmatter.plan_id?.trim() || null,
      beadIds: parsed.frontmatter.bead_ids ?? [],
      archived: isArchivedPlanPath(relativePath),
      updatedAt: Math.floor(stat.mtimeMs),
      preview: extractPlanPreview(content),
      content,
    };
  } catch {
    return null;
  }
}
