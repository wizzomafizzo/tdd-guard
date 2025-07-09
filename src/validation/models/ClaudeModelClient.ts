import { IModelClient } from '../../contracts/types/ModelClient'
import { execFileSync } from 'child_process'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { Config } from '../../config/Config'

export class ClaudeModelClient implements IModelClient {
  private config: Config

  constructor(config?: Config) {
    this.config = config || new Config()
  }

  ask(prompt: string): string {
    const claudeBinary = this.config.useLocalClaude
      ? `${process.env.HOME}/.claude/local/claude`
      : 'claude'

    const args = [
      '-',
      '--output-format',
      'json',
      '--max-turns',
      '1',
      '--model',
      'sonnet',
    ]
    const claudeDir = join(process.cwd(), '.claude')

    if (!existsSync(claudeDir)) {
      mkdirSync(claudeDir, { recursive: true })
    }

    const output = execFileSync(claudeBinary, args, {
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
