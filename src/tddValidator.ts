import { ClaudeModelClient } from './ClaudeModelClient';
import { IModelClient } from './types/ModelClient';

export function tddValidator(content: string, modelClient: IModelClient = new ClaudeModelClient()): string {
  const question = 'Count the number of test() calls in the code. If there are 2 or more tests, respond with exactly the word "violation". If there is 1 or 0 tests, respond with exactly the word "ok".';
  
  try {
    const response = modelClient.ask(question, content);
    
    // The model should return either 'violation' or 'ok'
    if (!response) return '';
    return response.trim().toLowerCase() === 'violation' ? 'violation' : '';
  } catch (error) {
    return '';
  }
}