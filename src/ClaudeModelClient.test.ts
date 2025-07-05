import { describe, test, expect, vi } from 'vitest';
import { ClaudeModelClient } from './ClaudeModelClient';
import { execSync } from 'child_process';

vi.mock('child_process');

describe('ClaudeModelClient', () => {
  test('asks question with context and returns response', () => {
    const mockExecSync = vi.mocked(execSync);
    mockExecSync.mockReturnValue(JSON.stringify({
      result: 'This code follows TDD principles'
    }));

    const client = new ClaudeModelClient();
    const result = client.ask('Does this follow TDD?', 'test code here');

    expect(mockExecSync).toHaveBeenCalledWith(
      'claude -p "Does this follow TDD? test code here" --output-format json --max-turns 1',
      { encoding: 'utf-8' }
    );
    expect(result).toBe('This code follows TDD principles');
  });
});