import { IModelClient } from './types/ModelClient';
import { execSync } from 'child_process';

export class ClaudeModelClient implements IModelClient {
  ask(question: string, context: string): string {
    const prompt = `${question}\n<context>${context}</context>`;
    const command = `claude --print "${prompt}" --output-format json --max-turns 1`;
    
    const output = execSync(command, { encoding: 'utf-8' });
    const response = JSON.parse(output);
    
    return response.result;
  }
}