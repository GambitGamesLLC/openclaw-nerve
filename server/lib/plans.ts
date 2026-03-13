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

interface ParsedPlan {
  frontmatter: PlanFrontmatter;
  body: string;
}

const PLAN_ROOT_NAME = '.plans';

export function getPlansRoot(): string {
  return path.resolve(process.cwd(), PLAN_ROOT_NAME);
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

export async function listRepoPlans(): Promise<PlanSummary[]> {
  const plansRoot = getPlansRoot();

  try {
    const stat = await fs.stat(plansRoot);
    if (!stat.isDirectory()) return [];
  } catch {
    return [];
  }

  const relativePaths = await collectPlanFiles(plansRoot);
  const summaries = await Promise.all(relativePaths.map(async (relativePath) => {
    const absolutePath = resolvePlanPath(relativePath);
    if (!absolutePath) return null;

    const [content, stat] = await Promise.all([
      fs.readFile(absolutePath, 'utf-8'),
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

export function resolvePlanPath(relativePath: string): string | null {
  const normalized = path.posix.normalize(relativePath.trim());
  if (!normalized || !normalized.startsWith('.plans/') || normalized.includes('..')) {
    return null;
  }

  const resolved = path.resolve(process.cwd(), normalized);
  const root = getPlansRoot();
  const rootPrefix = root.endsWith(path.sep) ? root : `${root}${path.sep}`;

  if (resolved !== root && !resolved.startsWith(rootPrefix)) {
    return null;
  }

  if (!isMarkdownFile(resolved)) {
    return null;
  }

  return resolved;
}

export async function readRepoPlan(relativePath: string): Promise<PlanDocument | null> {
  const absolutePath = resolvePlanPath(relativePath);
  if (!absolutePath) return null;

  try {
    const [content, stat] = await Promise.all([
      fs.readFile(absolutePath, 'utf-8'),
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
