import { execFileSync } from 'child_process'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { IModelClient } from '../../contracts/types/ModelClient'
import { Config } from '../../config/Config'

export class ClaudeCli implements IModelClient {
  private readonly config: Config

  constructor(config?: Config) {
    this.config = config ?? new Config()
  }

  async ask(prompt: string): Promise<string> {
    const claudeBinary = this.config.useSystemClaude
      ? 'claude'
      : `${process.env.HOME}/.claude/local/claude`

    const args = [
      '-',
      '--output-format',
      'json',
      '--max-turns',
      '5',
      '--model',
      'sonnet',
      '--disallowed-tools',
      'TodoWrite',
      '--strict-mcp-config',
    ]
    const claudeDir = join(process.cwd(), '.claude')

    if (!existsSync(claudeDir)) {
      mkdirSync(claudeDir, { recursive: true })
    }

    try {
      const output = execFileSync(claudeBinary, args, {
        encoding: 'utf-8',
        timeout: 60000,
        input: prompt,
        cwd: claudeDir,
      })

      // Parse the Claude CLI response and extract the result field
      const response = JSON.parse(output)

      return response.result
    } catch (error: unknown) {
      // Create a more informative error message
      const command = `${claudeBinary} ${args.join(' ')}`
      let errorDetails = `Command: ${command}`

      if (error && typeof error === 'object') {
        const err = error as Record<string, unknown>

        if (typeof err.code === 'number') {
          errorDetails += `\nExit code: ${err.code}`
        }

        if (typeof err.signal === 'string') {
          errorDetails += `\nSignal: ${err.signal}`
        }

        if (err.stderr) {
          errorDetails += `\nStderr: ${err.stderr.toString()}`
        }

        if (err.stdout) {
          errorDetails += `\nStdout: ${err.stdout.toString()}`
        }
      }

      throw new Error(`Claude CLI execution failed.\n${errorDetails}`)
    }
  }
}
