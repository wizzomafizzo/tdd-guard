import { IModelClient } from '../../contracts/types/ModelClient'
import { execSync } from 'child_process'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

export class ClaudeModelClient implements IModelClient {
  ask(prompt: string): string {
    const command = `claude - --output-format json --max-turns 1 --model sonnet`
    const claudeDir = join(process.cwd(), '.claude')

    if (!existsSync(claudeDir)) {
      mkdirSync(claudeDir, { recursive: true })
    }

    const output = execSync(command, {
      encoding: 'utf-8',
      timeout: 20000,
      input: prompt,
      cwd: claudeDir,
    })
    const response = JSON.parse(output)

    // Extract the actual model response from the result field
    const modelResponse = response.result

    // The model may wrap JSON in markdown code blocks, extract it
    const jsonMatch = modelResponse.match(/```json\s*\n?([\s\S]*?)\n?```/)
    if (jsonMatch) {
      return jsonMatch[1].trim()
    }

    return modelResponse
  }
}
