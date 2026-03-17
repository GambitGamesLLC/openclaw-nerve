import { describe, expect, it } from 'vitest';
import { getStatusBadgeClasses, getStatusBadgeText } from './statusUtils';

describe('status badge rendering', () => {
  it('renders FAILED and ERROR with distinct labels/classes', () => {
    const failed = { status: 'FAILED', since: Date.now() } as const;
    const error = { status: 'ERROR', since: Date.now() } as const;

    expect(getStatusBadgeText(failed)).toBe('FAILED');
    expect(getStatusBadgeText(error)).toBe('ERROR');
    expect(getStatusBadgeClasses(failed)).toBe('bg-orange/20 text-orange');
    expect(getStatusBadgeClasses(error)).toBe('bg-red/20 text-red');
  });
});
