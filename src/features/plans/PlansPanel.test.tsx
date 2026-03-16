import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PlansPanel } from './PlansPanel';

const mockUseRepoSources = vi.fn(() => ({
  sources: [
    {
      id: 'gambit-openclaw-nerve',
      label: 'gambit-openclaw-nerve',
      kind: 'project' as const,
      isDefault: false,
      isCustom: false,
    },
  ],
  selectedSourceId: 'gambit-openclaw-nerve',
  setSelectedSourceId: vi.fn(),
  selectedSource: {
    id: 'gambit-openclaw-nerve',
    label: 'gambit-openclaw-nerve',
    kind: 'project' as const,
    isDefault: false,
    isCustom: false,
  },
  loadingSources: false,
  error: null,
  fetchSources: vi.fn(),
  addSource: vi.fn(),
  removeSource: vi.fn(),
}));

vi.mock('@/hooks/useRepoSources', () => ({
  useRepoSources: () => mockUseRepoSources(),
}));

vi.mock('@/features/workspace/tabs/PlansTab', () => ({
  PlansTab: ({ onCompactReaderActiveChange }: { onCompactReaderActiveChange?: (active: boolean) => void }) => (
    <div>
      <button type="button" onClick={() => onCompactReaderActiveChange?.(true)}>enter compact reader</button>
      <button type="button" onClick={() => onCompactReaderActiveChange?.(false)}>exit compact reader</button>
      <div>Plans tab body</div>
    </div>
  ),
}));

describe('PlansPanel', () => {
  it('hides the top-level plans shell while the compact reader is active', async () => {
    const user = userEvent.setup();

    render(<PlansPanel />);

    expect(screen.getByRole('heading', { name: /^plans$/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /select plans source/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /manage sources/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh sources/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /enter compact reader/i }));

    expect(screen.queryByRole('heading', { name: /^plans$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: /select plans source/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /manage sources/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /refresh sources/i })).not.toBeInTheDocument();
    expect(screen.getByText('Plans tab body')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /exit compact reader/i }));

    expect(screen.getByRole('heading', { name: /^plans$/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /select plans source/i })).toBeInTheDocument();
  });
});
