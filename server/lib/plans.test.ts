import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ensurePlanLinkageFrontmatter,
  extractPlanPreview,
  extractPlanStatus,
  extractPlanTitle,
  findRepoPlanByBeadId,
  listRepoPlans,
  parsePlanContent,
  readRepoPlan,
  resolveRepoPlanLinkForBead,
} from './plans.js';

const originalCwd = process.cwd();
let tempDir: string;

async function writePlan(relativePath: string, content: string) {
  const target = path.join(tempDir, relativePath);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, content, 'utf-8');
}

describe('plans helpers', () => {
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nerve-plans-'));
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('parses frontmatter arrays and extracts metadata', () => {
    const parsed = parsePlanContent(`---
plan_id: plan-123
plan_title: Example Plan
status: in_progress
bead_ids:
  - nerve-413
  - nerve-ux7
---
# Ignored title

Preview body
`);

    expect(parsed.frontmatter).toEqual({
      plan_id: 'plan-123',
      plan_title: 'Example Plan',
      status: 'in_progress',
      bead_ids: ['nerve-413', 'nerve-ux7'],
    });
    expect(extractPlanTitle('---\nplan_title: Example Plan\n---\n# Title\n', parsed.frontmatter)).toBe('Example Plan');
    expect(extractPlanStatus('---\nstatus: in_progress\n---\n', parsed.frontmatter)).toBe('in_progress');
    expect(extractPlanPreview('---\nplan_title: Example Plan\n---\n# Heading\n\nPreview body\n')).toBe('Preview body');
  });

  it('discovers repo-local plans and classifies archived entries', async () => {
    await writePlan('.plans/2026-03-12-active.md', `---
plan_id: plan-active
bead_ids: [nerve-413]
---
# Active Plan

Active preview.
`);
    await writePlan('.plans/archive/2026-03-01-old.md', `# Archived Plan

**Status:** Complete

Archived preview.
`);

    const plans = await listRepoPlans();

    expect(plans).toHaveLength(2);
    expect(plans[0]).toMatchObject({
      path: '.plans/2026-03-12-active.md',
      title: 'Active Plan',
      archived: false,
      beadIds: ['nerve-413'],
    });
    expect(plans[1]).toMatchObject({
      path: '.plans/archive/2026-03-01-old.md',
      title: 'Archived Plan',
      status: 'Complete',
      archived: true,
    });
  });

  it('finds linked plans by bead id across active and archived locations', async () => {
    await writePlan('.plans/archive/2026-03-01-old.md', `---
bead_ids: [nerve-arch]
---
# Archived Match
`);
    await writePlan('.plans/2026-03-13-active.md', `---
bead_ids: [nerve-live, nerve-dup]
---
# Active Match
`);
    await writePlan('.plans/archive/2026-03-10-older.md', `---
bead_ids: [nerve-dup]
---
# Older Match
`);

    await expect(findRepoPlanByBeadId('nerve-live')).resolves.toMatchObject({
      path: '.plans/2026-03-13-active.md',
      archived: false,
    });
    await expect(findRepoPlanByBeadId('nerve-arch')).resolves.toMatchObject({
      path: '.plans/archive/2026-03-01-old.md',
      archived: true,
    });
    await expect(findRepoPlanByBeadId('nerve-dup')).resolves.toMatchObject({
      path: '.plans/2026-03-13-active.md',
      archived: false,
    });
    await expect(findRepoPlanByBeadId('')).resolves.toBeNull();
  });

  it('adds durable linkage frontmatter for active plans and keeps archived plans untouched', async () => {
    await writePlan('.plans/2026-03-14-live.md', '# Live plan\n\n### Task 1\n\n**Bead ID:** `nerve-live`\n');
    await writePlan('.plans/archive/2026-03-01-old.md', '# Archived plan\n\n**Bead ID:** `nerve-archived`\n');

    const plans = await listRepoPlans();

    expect(plans.find((plan) => plan.path === '.plans/2026-03-14-live.md')?.beadIds).toEqual(['nerve-live']);
    await expect(findRepoPlanByBeadId('nerve-live')).resolves.toMatchObject({
      path: '.plans/2026-03-14-live.md',
      planId: 'plan-2026-03-14-live',
    });

    const liveContent = await fs.readFile(path.join(tempDir, '.plans/2026-03-14-live.md'), 'utf-8');
    expect(liveContent).toContain('plan_id: plan-2026-03-14-live');
    expect(liveContent).toContain('bead_ids:\n  - nerve-live');

    const archivedContent = await fs.readFile(path.join(tempDir, '.plans/archive/2026-03-01-old.md'), 'utf-8');
    expect(archivedContent.startsWith('---\n')).toBe(false);
  });

  it('resolves metadata-first states with bead_ids fallback compatibility', async () => {
    await writePlan('.plans/2026-03-14-active.md', `---
plan_id: plan-active
bead_ids: [nerve-active, nerve-fallback]
---
# Active
`);
    await writePlan('.plans/archive/2026-03-10-archived.md', `---
plan_id: plan-archived
bead_ids: [nerve-archived]
---
# Archived
`);

    const moved = await resolveRepoPlanLinkForBead('nerve-active', {
      planId: 'plan-active',
      path: '.plans/2026-03-10-renamed.md',
      title: 'Old title',
    });
    expect(moved).toMatchObject({
      state: 'moved',
      resolvedBy: 'metadata',
      metadataNeedsWrite: true,
      plan: { path: '.plans/2026-03-14-active.md' },
    });

    const archived = await resolveRepoPlanLinkForBead('nerve-archived', {
      planId: 'plan-archived',
      path: '.plans/archive/2026-03-10-archived.md',
      title: 'Archived',
    });
    expect(archived).toMatchObject({
      state: 'archived',
      resolvedBy: 'metadata',
      metadataNeedsWrite: false,
    });

    const missing = await resolveRepoPlanLinkForBead('nerve-missing', {
      planId: 'plan-gone',
      path: '.plans/2026-01-01-gone.md',
      title: 'Gone',
    });
    expect(missing).toMatchObject({
      state: 'missing',
      resolvedBy: 'metadata',
      plan: null,
      lastKnown: {
        planId: 'plan-gone',
        path: '.plans/2026-01-01-gone.md',
      },
    });

    const fallback = await resolveRepoPlanLinkForBead('nerve-fallback');
    expect(fallback).toMatchObject({
      state: 'active',
      resolvedBy: 'bead_ids',
      metadataNeedsWrite: true,
      metadataToWrite: {
        planId: 'plan-active',
        path: '.plans/2026-03-14-active.md',
        title: 'Active',
      },
    });
  });

  it('reads a single plan and rejects paths outside .plans', async () => {
    await writePlan('.plans/2026-03-12-active.md', '# Active Plan\n\nBody\n');
    await fs.writeFile(path.join(tempDir, 'README.md'), '# Nope\n', 'utf-8');

    const plan = await readRepoPlan('.plans/2026-03-12-active.md');
    const escaped = await readRepoPlan('../README.md');

    expect(plan?.title).toBe('Active Plan');
    expect(plan?.planId).toBe('plan-2026-03-12-active');
    expect(plan?.content).toContain('Body');
    expect(escaped).toBeNull();
  });

  it('scopes plan discovery and reads to an explicit repo root', async () => {
    const repoA = path.join(tempDir, 'repo-a');
    const repoB = path.join(tempDir, 'repo-b');
    await fs.mkdir(path.join(repoA, '.plans'), { recursive: true });
    await fs.mkdir(path.join(repoB, '.plans'), { recursive: true });
    await fs.writeFile(path.join(repoA, '.plans', '2026-03-15-a.md'), '# Repo A Plan\n', 'utf-8');
    await fs.writeFile(path.join(repoB, '.plans', '2026-03-15-b.md'), '# Repo B Plan\n', 'utf-8');

    await expect(listRepoPlans(repoA)).resolves.toMatchObject([
      expect.objectContaining({ title: 'Repo A Plan', path: '.plans/2026-03-15-a.md' }),
    ]);
    await expect(listRepoPlans(repoB)).resolves.toMatchObject([
      expect.objectContaining({ title: 'Repo B Plan', path: '.plans/2026-03-15-b.md' }),
    ]);

    await expect(readRepoPlan('.plans/2026-03-15-a.md', repoA)).resolves.toMatchObject({ title: 'Repo A Plan' });
    await expect(readRepoPlan('.plans/2026-03-15-a.md', repoB)).resolves.toBeNull();
  });

  it('keeps existing frontmatter while enriching missing linkage fields', () => {
    const updated = ensurePlanLinkageFrontmatter('.plans/2026-03-14-test.md', `---\nstatus: in_progress\n---\n# Test\n\n**Bead ID:** \`nerve-test\`\n`);

    expect(updated).toContain('status: in_progress');
    expect(updated).toContain('plan_id: plan-2026-03-14-test');
    expect(updated).toContain('bead_ids:\n  - nerve-test');
  });
});
