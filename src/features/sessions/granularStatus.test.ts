import { describe, expect, it } from 'vitest';
import {
  isStatusRunning,
  mapAgentLifecyclePhaseToStatus,
  mapChatStateToStatus,
  mapLegacyAgentStateToStatus,
} from './granularStatus';

describe('granular status mapping', () => {
  it('maps transient lifecycle/chat failures to FAILED', () => {
    expect(mapAgentLifecyclePhaseToStatus('error')).toBe('FAILED');
    expect(mapChatStateToStatus('error')).toBe('FAILED');
    expect(mapLegacyAgentStateToStatus('error')).toBe('FAILED');
  });

  it('does not treat FAILED as running/busy', () => {
    expect(isStatusRunning('THINKING')).toBe(true);
    expect(isStatusRunning('STREAMING')).toBe(true);
    expect(isStatusRunning('FAILED')).toBe(false);
  });

  it('keeps hard ERROR distinct for dead/unreachable legacy states', () => {
    expect(mapLegacyAgentStateToStatus('crashed')).toBe('ERROR');
    expect(mapLegacyAgentStateToStatus('unreachable')).toBe('ERROR');
    expect(mapLegacyAgentStateToStatus('error')).toBe('FAILED');
  });
});
