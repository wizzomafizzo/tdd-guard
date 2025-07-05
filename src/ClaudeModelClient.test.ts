import { describe, test, expect, vi, beforeEach } from 'vitest';
import { ClaudeModelClient } from './ClaudeModelClient';
import { execSync } from 'child_process';

vi.mock('child_process');

describe('ClaudeModelClient', () => {
  const question = 'Does this follow TDD?';
  const context = 'test code here';
  const result = 'This code follows TDD principles';
  const format = '--output-format json';
  const maxTurnsFlag = '--max-turns 1';
  const printFlag = '-p';
  const encoding = 'utf-8';
  const command = 'claude';
  
  let sut: ReturnType<typeof setupModelClient>;
  
  beforeEach(() => {
    sut = setupModelClient();
  });

  test('includes question in prompt', () => {
    sut.assertCommandContains(question);
  });

  test('includes context in prompt', () => {
    sut.assertCommandContains(context);
  });

  test('uses json output format', () => {
    sut.assertCommandContains(format);
  });

  test('limits to single turn', () => {
    sut.assertCommandContains(maxTurnsFlag);
  });

  test('uses claude command', () => {
    sut.assertCommandContains(command);
  });

  test('uses print mode flag', () => {
    sut.assertCommandContains(printFlag);
  });

  test('uses utf-8 encoding', () => {
    sut.assertCalledWithOptions({ encoding: encoding });
  });

  test('returns parsed result from response', () => {
    expect(sut.result).toBe(result);
  });

  // Test helper
  function setupModelClient() {
    const mockExecSync = vi.mocked(execSync);
    mockExecSync.mockReturnValue(JSON.stringify({ result }));

    const client = new ClaudeModelClient();
    const actualResult = client.ask(question, context);
    
    const assertCommandContains = (content: string) => {
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining(content),
        expect.any(Object)
      );
    };
    
    const assertCalledWithOptions = (options: object) => {
      expect(mockExecSync).toHaveBeenCalledWith(expect.any(String), options);
    };
    
    return {
      result: actualResult,
      assertCommandContains,
      assertCalledWithOptions
    };
  }
});