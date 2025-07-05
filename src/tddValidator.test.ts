import { describe, test, expect, vi } from 'vitest';
import { tddValidator } from './tddValidator';

describe('tddValidator', () => {
  test('returns violation when content contains two tests', () => {
    const content = `
      test('first test', () => {
        expect(true).toBe(true);
      });
      
      test('second test', () => {
        expect(false).toBe(false);
      });
    `;
    
    const result = tddValidator(content);
    
    expect(result).toBe('violation');
  });

  test('returns ok when content contains one test', () => {
    const content = `
      test('single test', () => {
        expect(true).toBe(true);
      });
    `;
    
    const result = tddValidator(content);
    
    expect(result).toBe('ok');
  });
});