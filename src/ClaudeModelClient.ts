import { IModelClient } from './types/ModelClient'
import { execSync } from 'child_process'

export class ClaudeModelClient implements IModelClient {
  ask(question: string, context: string): string {
    const prompt = `${question}\n<context>${context}</context>`
    const escapedPrompt = prompt.replace(/'/g, "'\\''")
    const command = `claude --print '${escapedPrompt}' --output-format json --max-turns 1 --model sonnet`

    const output = execSync(command, { encoding: 'utf-8', timeout: 10000 })
    const response = JSON.parse(output)

    return response.result
  }
}
