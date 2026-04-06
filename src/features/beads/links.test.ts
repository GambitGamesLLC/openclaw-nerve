import { describe, expect, it } from 'vitest';
import { buildBeadTabId, decodeBeadLinkHref, isBeadId, isBeadLinkHref } from './links';

describe('bead link helpers', () => {
  it('recognizes bead ids and bead scheme links', () => {
    expect(isBeadId('nerve-fms2')).toBe(true);
    expect(isBeadLinkHref('nerve-fms2')).toBe(true);
    expect(isBeadLinkHref('bead:nerve-fms2')).toBe(true);
  });

  it('rejects normal file paths', () => {
    expect(isBeadId('.plans/demo.md')).toBe(false);
    expect(isBeadLinkHref('docs/todo.md')).toBe(false);
  });

  it('decodes bead links and tab ids', () => {
    expect(decodeBeadLinkHref('bead:nerve-fms2')).toBe('nerve-fms2');
    expect(buildBeadTabId('nerve-fms2')).toBe('bead:nerve-fms2');
  });
});
