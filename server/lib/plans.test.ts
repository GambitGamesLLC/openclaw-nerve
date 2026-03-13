import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { extractPlanPreview, extractPlanStatus, extractPlanTitle, listRepoPlans, parsePlanContent, readRepoPlan } from './plans.js';

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

  it('reads a single plan and rejects paths outside .plans', async () => {
    await writePlan('.plans/2026-03-12-active.md', '# Active Plan\n\nBody\n');
    await fs.writeFile(path.join(tempDir, 'README.md'), '# Nope\n', 'utf-8');

    const plan = await readRepoPlan('.plans/2026-03-12-active.md');
    const escaped = await readRepoPlan('../README.md');

    expect(plan?.title).toBe('Active Plan');
    expect(plan?.content).toContain('Body');
    expect(escaped).toBeNull();
  });
});
