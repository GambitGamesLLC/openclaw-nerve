import { describe, expect, it } from 'vitest';
import { formatBeadAddToChat, formatPlanAddToChat, mergeAddToChatText } from './addToChat';

describe('addToChat helpers', () => {
  it('formats plan context with title and path', () => {
    expect(formatPlanAddToChat({
      title: 'Nerve mobile polish',
      path: '.plans/2026-03-15-mobile-plans-back-button-and-add-to-chat.md',
    })).toBe('Plan context:\n- Title: Nerve mobile polish\n- Path: .plans/2026-03-15-mobile-plans-back-button-and-add-to-chat.md');
  });

  it('formats bead context with title and id', () => {
    expect(formatBeadAddToChat({
      title: 'Implement Add to Chat',
      id: 'nerve-qn2',
    })).toBe('Bead context:\n- Title: Implement Add to Chat\n- ID: nerve-qn2');
  });

  it('appends add-to-chat context after an existing draft', () => {
    expect(mergeAddToChatText('Please help with this next.', 'Plan context:\n- Title: Test\n- Path: .plans/test.md'))
      .toBe('Please help with this next.\n\nPlan context:\n- Title: Test\n- Path: .plans/test.md');
  });
});
