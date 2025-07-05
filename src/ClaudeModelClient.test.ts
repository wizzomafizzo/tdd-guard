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
  const printFlag = '--print';
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

  test('includes line break after question', () => {
    sut.assertCommandContains(question + '\n');
  });

  test('wraps context in context tags', () => {
    sut.assertCommandContains(`<context>${context}</context>`);
  });

  test('uses utf-8 encoding', () => {
    sut.assertCalledWithOptions({ encoding: encoding });
  });

  test('returns parsed result from response', () => {
    expect(sut.result).toBe(result);
  });

  describe('handles special characters', () => {
    const questionWithQuote = "What's the TDD pattern?";
    const contextWithQuote = "test('it should work', () => {})";
    
    let sut: ReturnType<typeof setupModelClient>;
    
    beforeEach(() => {
      sut = setupModelClient({ 
        question: questionWithQuote, 
        context: contextWithQuote 
      });
    });

    test('escapes single quotes in question', () => {
      sut.assertCommandContains("What'\\''s the TDD pattern?");
    });

    test('escapes single quotes in context', () => {
      sut.assertCommandContains("test('\\''it should work'\\''");
    });
  });

  // Test helper
  function setupModelClient(testData?: { question?: string; context?: string; result?: string }) {
    const { 
      question: q = question, 
      context: c = context, 
      result: r = result 
    } = testData || {};
    
    const mockExecSync = vi.mocked(execSync);
    mockExecSync.mockReturnValue(JSON.stringify({ result: r }));

    const client = new ClaudeModelClient();
    const actualResult = client.ask(q, c);
    
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