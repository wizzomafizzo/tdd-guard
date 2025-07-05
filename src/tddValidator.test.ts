import { describe, test, expect } from 'vitest';
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
});